export type UserPreferences = {
  hubTitle?: string;
  defaultLandingTab?: string;
  theme?: 'light' | 'dark' | 'system';
  logoWatermarkUrl?: string;
};

const KEY_PREFIX = 'cks_prefs_';
export const USER_PREFERENCES_EVENT = 'cks:user-preferences-changed';

export type UserPreferencesChangeDetail = {
  userCode: string;
  preferences: UserPreferences;
};

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

export function saveUserPreferences(userCode: string | null | undefined, prefs: Partial<UserPreferences>): void {
  try {
    if (!userCode) return;
    const normalizedCode = userCode.toUpperCase();
    const key = KEY_PREFIX + normalizedCode;
    const current = loadUserPreferences(userCode);
    const next = { ...current, ...prefs } as UserPreferences;
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent<UserPreferencesChangeDetail>(USER_PREFERENCES_EVENT, {
        detail: {
          userCode: normalizedCode,
          preferences: next,
        },
      }),
    );
  } catch {
    // ignore
  }
}
