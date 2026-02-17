import { useEffect } from 'react';
import {
  codesMatch,
  loadUserPreferencesWithFallback,
  USER_PREFERENCES_EVENT,
  type UserPreferencesChangeDetail,
} from '../shared/preferences';

const WATERMARK_IMAGE_CSS_VAR = '--cks-account-watermark-image';

function setWatermarkImage(url: string | undefined): void {
  const root = document.documentElement;
  if (!url || !url.trim()) {
    root.style.setProperty(WATERMARK_IMAGE_CSS_VAR, 'none');
    return;
  }
  const safeUrl = url.replace(/"/g, '\\"');
  root.style.setProperty(WATERMARK_IMAGE_CSS_VAR, `url("${safeUrl}")`);
}

export function useAccountWatermark(
  userCode: string | null | undefined,
  options?: { enabled?: boolean },
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || !userCode) {
      setWatermarkImage(undefined);
      return;
    }

    const normalizedCode = userCode.toUpperCase();
    const applyForCurrentUser = () => {
      const preferences = loadUserPreferencesWithFallback(normalizedCode);
      setWatermarkImage(preferences.logoWatermarkUrl);
    };

    applyForCurrentUser();

    const onPreferencesChanged = (event: Event) => {
      const detail = (event as CustomEvent<UserPreferencesChangeDetail>).detail;
      if (!detail || !codesMatch(detail.userCode, normalizedCode)) {
        return;
      }
      setWatermarkImage(detail.preferences.logoWatermarkUrl);
    };

    const onStorageChanged = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith('cks_prefs_')) {
        return;
      }
      applyForCurrentUser();
    };

    window.addEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
    window.addEventListener('storage', onStorageChanged);
    return () => {
      window.removeEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
      window.removeEventListener('storage', onStorageChanged);
    };
  }, [enabled, userCode]);
}
