import { useEffect, useMemo } from 'react';
import { useHubRoleScope } from '../shared/api/hub';
import {
  codesMatch,
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
      setWatermarkImage(CKS_DEFAULT_WATERMARK_URL);
      return;
    }

    const applyForOwner = () => {
      const preferences = loadUserPreferencesWithFallback(ownerCode);
      const logoUrl = preferences.logoWatermarkUrl?.trim() || CKS_DEFAULT_WATERMARK_URL;
      setWatermarkImage(logoUrl);
    };

    applyForOwner();

    const onPreferencesChanged = (event: Event) => {
      const detail = (event as CustomEvent<UserPreferencesChangeDetail>).detail;
      if (!detail || !codesMatch(detail.userCode, ownerCode)) {
        return;
      }
      const logoUrl = detail.preferences.logoWatermarkUrl?.trim() || CKS_DEFAULT_WATERMARK_URL;
      setWatermarkImage(logoUrl);
    };

    const onStorageChanged = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith('cks_prefs_')) {
        return;
      }
      applyForOwner();
    };

    window.addEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
    window.addEventListener('storage', onStorageChanged);
    return () => {
      window.removeEventListener(USER_PREFERENCES_EVENT, onPreferencesChanged as EventListener);
      window.removeEventListener('storage', onStorageChanged);
    };
  }, [enabled, hasWatermarkPolicy, shouldUseCksDefault, watermarkOwnerCode]);
}
