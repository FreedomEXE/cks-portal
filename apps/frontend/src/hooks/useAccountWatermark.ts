import { useEffect } from 'react';
import {
  loadUserPreferences,
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

export function useAccountWatermark(userCode: string | null | undefined): void {
  useEffect(() => {
    if (!userCode) {
      setWatermarkImage(undefined);
      return;
    }

    const normalizedCode = userCode.toUpperCase();
    const applyForCurrentUser = () => {
      const preferences = loadUserPreferences(normalizedCode);
      setWatermarkImage(preferences.logoWatermarkUrl);
    };

    applyForCurrentUser();

    const onPreferencesChanged = (event: Event) => {
      const detail = (event as CustomEvent<UserPreferencesChangeDetail>).detail;
      if (!detail || detail.userCode !== normalizedCode) {
        return;
      }
      setWatermarkImage(detail.preferences.logoWatermarkUrl);
    };

    window.addEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
    return () => {
      window.removeEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
      setWatermarkImage(undefined);
    };
  }, [userCode]);
}
