/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
/**
 * File: useAccountWatermark.ts
 *
 * Description:
 * Hook that resolves and applies the account watermark CSS variable.
 * For contractors: uses their own watermark.
 * For customers/centers: uses their contractor's watermark.
 * For manager/warehouse/crew: uses CKS default.
 *
 * Preferences are loaded from localStorage first (fast, sync), then
 * fetched from the API if localStorage is empty (handles cross-browser/
 * cross-admin scenarios like impersonation).
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useEffect, useMemo } from 'react';
import { useHubRoleScope } from '../shared/api/hub';
import {
  codesMatch,
  fetchUserPreferencesFromApi,
  loadUserPreferencesWithFallback,
  USER_PREFERENCES_EVENT,
  type UserPreferencesChangeDetail,
} from '../shared/preferences';
import {
  CKS_DEFAULT_WATERMARK_URL,
  isWatermarkPolicyRole,
  resolveWatermarkOwnerCode,
  usesCksDefaultWatermark,
} from '../shared/watermark';

const WATERMARK_IMAGE_CSS_VAR = '--cks-account-watermark-image';
const WATERMARK_DEBUG_LOGS_ENABLED = import.meta.env.DEV;

function logWatermarkDebug(message: string, value?: string): void {
  if (!WATERMARK_DEBUG_LOGS_ENABLED) {
    return;
  }
  if (typeof value === 'string') {
    console.log(`[Watermark] ${message}`, value);
    return;
  }
  console.log(`[Watermark] ${message}`);
}

function setWatermarkImage(url: string | undefined): void {
  const root = document.documentElement;
  if (!url || !url.trim()) {
    logWatermarkDebug('Clearing watermark (no URL)');
    root.style.setProperty(WATERMARK_IMAGE_CSS_VAR, 'none');
    return;
  }
  const safeUrl = url.replace(/"/g, '\\"');
  const cssValue = `url("${safeUrl}")`;
  logWatermarkDebug('Setting watermark:', cssValue);
  root.style.setProperty(WATERMARK_IMAGE_CSS_VAR, cssValue);
}

function resolveWatermarkUrl(
  logoWatermarkUrl: string | null | undefined,
  options?: { fallbackToCks?: boolean },
): string | undefined {
  const trimmed = typeof logoWatermarkUrl === 'string' ? logoWatermarkUrl.trim() : '';
  if (trimmed) {
    return trimmed;
  }
  if (options?.fallbackToCks) {
    return CKS_DEFAULT_WATERMARK_URL;
  }
  return undefined;
}

export function useAccountWatermark(
  userCode: string | null | undefined,
  role: string | null | undefined,
  options?: { enabled?: boolean },
): void {
  const enabled = options?.enabled ?? true;
  const normalizedViewerCode = useMemo(() => {
    const trimmed = (userCode || '').trim();
    return trimmed ? trimmed.toUpperCase() : null;
  }, [userCode]);
  const normalizedRole = useMemo(() => (role || '').trim().toLowerCase(), [role]);
  const hasWatermarkPolicy = isWatermarkPolicyRole(normalizedRole);
  const shouldUseCksDefault = usesCksDefaultWatermark(normalizedRole);
  const shouldResolveContractorScope =
    normalizedRole === 'customer' || normalizedRole === 'center';
  const { data: scopeData } = useHubRoleScope(
    shouldResolveContractorScope ? normalizedViewerCode : null,
  );
  const watermarkOwnerCode = useMemo(
    () => resolveWatermarkOwnerCode(normalizedRole, normalizedViewerCode, scopeData),
    [normalizedRole, normalizedViewerCode, scopeData],
  );

  useEffect(() => {
    if (!enabled) {
      setWatermarkImage(undefined);
      return;
    }

    if (!hasWatermarkPolicy) {
      setWatermarkImage(undefined);
      return;
    }

    if (shouldUseCksDefault) {
      setWatermarkImage(CKS_DEFAULT_WATERMARK_URL);
      return;
    }

    const ownerCode = watermarkOwnerCode;
    if (!ownerCode) {
      setWatermarkImage(undefined);
      return;
    }

    // 1. Apply from localStorage immediately (fast, sync)
    const applyFromLocal = () => {
      const preferences = loadUserPreferencesWithFallback(ownerCode);
      setWatermarkImage(resolveWatermarkUrl(preferences.logoWatermarkUrl));
      return preferences;
    };

    const localPrefs = applyFromLocal();

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // 2. If localStorage is empty for this owner, fetch from API.
    // Retry a few times to survive initial auth-token timing races.
    const needsFetch = !localPrefs.logoWatermarkUrl;
    if (needsFetch) {
      const fetchFromApi = async (attempt: number) => {
        try {
          const apiPrefs = await fetchUserPreferencesFromApi(ownerCode);
          if (cancelled) {
            return;
          }
          const resolved = resolveWatermarkUrl(apiPrefs.logoWatermarkUrl);
          if (resolved) {
            setWatermarkImage(resolved);
            return;
          }
        } catch {
          // Already logged/handled in preferences helper
        }

        if (!cancelled && attempt < 2) {
          retryTimer = setTimeout(() => {
            void fetchFromApi(attempt + 1);
          }, (attempt + 1) * 500);
        }
      };

      void fetchFromApi(0);
    }

    // Listen for preference changes (same-tab edits, storage events)
    const onPreferencesChanged = (event: Event) => {
      const detail = (event as CustomEvent<UserPreferencesChangeDetail>).detail;
      if (!detail || !codesMatch(detail.userCode, ownerCode)) {
        return;
      }
      setWatermarkImage(resolveWatermarkUrl(detail.preferences.logoWatermarkUrl));
    };

    const onStorageChanged = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith('cks_prefs_')) {
        return;
      }
      applyFromLocal();
    };

    window.addEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
    window.addEventListener('storage', onStorageChanged);
    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      window.removeEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
      window.removeEventListener('storage', onStorageChanged);
    };
  }, [enabled, hasWatermarkPolicy, shouldUseCksDefault, watermarkOwnerCode]);
}
