/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
/**
 * File: preferences.ts
 *
 * Description:
 * User preferences storage with database persistence and localStorage cache.
 * Preferences are stored in the user_preferences table on the backend and
 * cached in localStorage for fast synchronous access. The watermark hook and
 * hub components read from localStorage (fast, sync), while writes go to both
 * localStorage AND the API (durable, shared across browsers/admins).
 *
 * fetchUserPreferencesFromApi() pulls preferences from the server into
 * localStorage so that any browser/admin can see another user's preferences
 * (critical for watermark resolution across impersonation sessions).
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export type UserPreferences = {
  hubTitle?: string;
  defaultLandingTab?: string;
  theme?: 'light' | 'dark' | 'system';
  logoWatermarkUrl?: string;
  /**
   * Contractor-only preference.
   * When true (default), profile photo uploads also update watermark logo.
   */
  syncProfilePhotoToWatermark?: boolean;
};

const KEY_PREFIX = 'cks_prefs_';
export const USER_PREFERENCES_EVENT = 'cks:user-preferences-changed';

export type UserPreferencesChangeDetail = {
  userCode: string;
  preferences: UserPreferences;
};

type ApiFetchFn = typeof import('./api/client').apiFetch;

let _apiFetch: ApiFetchFn | null = null;

async function getApiFetch(): Promise<ApiFetchFn> {
  if (_apiFetch) {
    return _apiFetch;
  }
  const module = await import('./api/client');
  _apiFetch = module.apiFetch;
  return _apiFetch;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function resolveClerkTokenWithRetry(maxAttempts = 4): Promise<string | null> {
  const clerk = (globalThis as any)?.Clerk;
  const getToken = clerk?.session?.getToken;
  if (typeof getToken !== 'function') {
    return null;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const token = await getToken();
      if (typeof token === 'string' && token.trim().length > 0) {
        return token;
      }
    } catch {
      // ignore and retry
    }

    if (attempt < maxAttempts - 1) {
      await delay((attempt + 1) * 150);
    }
  }

  return null;
}

async function apiFetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const apiFetch = await getApiFetch();
  return apiFetch<T>(path, {
    ...init,
    getToken: () => resolveClerkTokenWithRetry(),
  });
}

function hasAnyPreferences(prefs: UserPreferences): boolean {
  return Object.keys(prefs).length > 0;
}

function normalizeCodeForMatch(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function loadUserPreferencesExact(userCode: string | null | undefined): UserPreferences {
  try {
    if (!userCode) return {};
    const raw = window.localStorage.getItem(KEY_PREFIX + userCode.toUpperCase());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function loadUserPreferences(userCode: string | null | undefined): UserPreferences {
  return loadUserPreferencesWithFallback(userCode);
}

/**
 * Loads preferences using exact key first, then a normalized fallback match.
 * This avoids issues when one code is stored with separators (CON-001-TEST)
 * and another path resolves without separators (CON001TEST).
 */
export function loadUserPreferencesWithFallback(userCode: string | null | undefined): UserPreferences {
  if (!userCode) {
    return {};
  }

  const exact = loadUserPreferencesExact(userCode);
  if (Object.keys(exact).length > 0) {
    return exact;
  }

  try {
    const expected = normalizeCodeForMatch(userCode);
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(KEY_PREFIX)) {
        continue;
      }
      const storedCode = key.slice(KEY_PREFIX.length);
      if (normalizeCodeForMatch(storedCode) !== expected) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed) {
        return parsed as UserPreferences;
      }
    }
  } catch {
    // ignore
  }

  return exact;
}

export function codesMatch(codeA: string | null | undefined, codeB: string | null | undefined): boolean {
  if (!codeA || !codeB) {
    return false;
  }
  return normalizeCodeForMatch(codeA) === normalizeCodeForMatch(codeB);
}

/**
 * Write preferences to localStorage cache and emit change event.
 * This is the fast, synchronous path used by all existing callers.
 */
function writeToLocalStorage(normalizedCode: string, next: UserPreferences): void {
  const key = KEY_PREFIX + normalizedCode;
  window.localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent<UserPreferencesChangeDetail>(USER_PREFERENCES_EVENT, {
      detail: {
        userCode: normalizedCode,
        preferences: next,
      },
    }),
  );
}

/**
 * Save preferences to localStorage AND persist to the backend API.
 * The API call is fire-and-forget — localStorage is the source of truth
 * for the current session, and the DB is the durable cross-session store.
 */
export function saveUserPreferences(userCode: string | null | undefined, prefs: Partial<UserPreferences>): void {
  try {
    if (!userCode) return;
    const normalizedCode = userCode.toUpperCase();
    const current = loadUserPreferences(userCode);
    const next = { ...current, ...prefs } as UserPreferences;

    // 1. Write to localStorage (fast, sync — keeps existing behavior)
    writeToLocalStorage(normalizedCode, next);

    // 2. Persist to backend (async, fire-and-forget)
    persistPreferencesToApi(normalizedCode, prefs).catch((err) => {
      console.warn('[preferences] Failed to persist to API, data is safe in localStorage', err);
    });
  } catch {
    // ignore
  }
}

/**
 * Persist a partial preferences update to the backend API.
 * Uses PUT with merge semantics on the server side.
 */
async function persistPreferencesToApi(normalizedCode: string, prefs: Partial<UserPreferences>): Promise<void> {
  await apiFetchWithAuth(`/preferences/${encodeURIComponent(normalizedCode)}`, {
    method: 'PUT',
    body: JSON.stringify(prefs),
  });
}

// ── In-flight dedup for fetchUserPreferencesFromApi ─────────────────
const _fetchInflight = new Map<string, Promise<UserPreferences>>();

/**
 * Fetch preferences from the backend API and populate localStorage cache.
 * This is the critical function that makes watermarks work across browsers/admins.
 * Called by the watermark hook to ensure the contractor's preferences are available
 * locally even if this browser has never visited that contractor's profile.
 *
 * Deduplicates concurrent calls for the same code.
 */
export async function fetchUserPreferencesFromApi(
  userCode: string | null | undefined,
): Promise<UserPreferences> {
  if (!userCode) return {};
  const normalizedCode = userCode.toUpperCase();

  // Deduplicate concurrent fetches
  const existing = _fetchInflight.get(normalizedCode);
  if (existing) return existing;

  const promise = (async (): Promise<UserPreferences> => {
    try {
      const response = await apiFetchWithAuth<{ success: boolean; data: UserPreferences }>(
        `/preferences/${encodeURIComponent(normalizedCode)}`,
      );
      const prefs = response.data ?? {};
      const localFallback = loadUserPreferencesWithFallback(normalizedCode);

      if (hasAnyPreferences(prefs)) {
        // Merge into localStorage (don't overwrite local-only fields)
        const current = loadUserPreferencesExact(normalizedCode);
        const merged = { ...current, ...prefs };
        writeToLocalStorage(normalizedCode, merged);
        return prefs;
      }

      // API has no row yet, but local cache has data: return local and backfill DB.
      if (hasAnyPreferences(localFallback)) {
        persistPreferencesToApi(normalizedCode, localFallback).catch((err) => {
          console.warn('[preferences] Failed to backfill API from local cache for', normalizedCode, err);
        });
        return localFallback;
      }

      return {};
    } catch (err) {
      console.warn('[preferences] Failed to fetch from API for', normalizedCode, err);
      // Fall back to localStorage
      return loadUserPreferencesWithFallback(normalizedCode);
    } finally {
      _fetchInflight.delete(normalizedCode);
    }
  })();

  _fetchInflight.set(normalizedCode, promise);
  return promise;
}
