import type { HubProfileResponse, HubRoleScopeResponse } from './api/hub';

export const CKS_DEFAULT_WATERMARK_URL = '/cks-watermark-logo.svg';

export type WatermarkRole = 'contractor' | 'customer' | 'center' | 'warehouse' | 'manager' | 'crew';

function normalizeRole(role: string | null | undefined): WatermarkRole | null {
  const value = (role || '').trim().toLowerCase();
  if (
    value === 'contractor' ||
    value === 'customer' ||
    value === 'center' ||
    value === 'warehouse' ||
    value === 'manager' ||
    value === 'crew'
  ) {
    return value;
  }
  return null;
}

function normalizeCode(value: string | null | undefined): string | null {
  const trimmed = (value || '').trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function canRoleEditWatermark(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'contractor';
}

export function isWatermarkPolicyRole(role: string | null | undefined): boolean {
  return normalizeRole(role) !== null;
}

export function usesCksDefaultWatermark(role: string | null | undefined): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'warehouse' || normalizedRole === 'manager' || normalizedRole === 'crew';
}

export function resolveWatermarkOwnerCode(
  role: string | null | undefined,
  viewerCode: string | null | undefined,
  scopeData: HubRoleScopeResponse | null | undefined,
  profileData?: HubProfileResponse | null,
): string | null {
  const normalizedRole = normalizeRole(role);
  const normalizedViewerCode = normalizeCode(viewerCode);
  if (!normalizedRole) {
    return null;
  }

  if (normalizedRole === 'contractor') {
    return normalizedViewerCode;
  }

  if (normalizedRole === 'customer' && scopeData?.role === 'customer') {
    const directContractor = normalizeCode(scopeData.relationships?.contractor?.id);
    if (directContractor) {
      return directContractor;
    }

    for (const center of scopeData.relationships?.centers ?? []) {
      const centerContractor = normalizeCode(center.contractorId);
      if (centerContractor) {
        return centerContractor;
      }
    }
  }

  if (normalizedRole === 'customer' && profileData?.role === 'customer') {
    return normalizeCode(profileData.contractor?.id);
  }

  if (normalizedRole === 'center' && scopeData?.role === 'center') {
    const directContractor = normalizeCode(scopeData.relationships?.contractor?.id);
    if (directContractor) {
      return directContractor;
    }
  }

  if (normalizedRole === 'center' && profileData?.role === 'center') {
    return normalizeCode(profileData.contractor?.id);
  }

  return null;
}

export function sanitizeWatermarkPreferenceWrite<T extends { logoWatermarkUrl?: string; syncProfilePhotoToWatermark?: boolean }>(
  role: string | null | undefined,
  prefs: Partial<T>,
): Partial<T> {
  if (canRoleEditWatermark(role)) {
    return prefs;
  }
  const {
    logoWatermarkUrl: _ignoredLogo,
    syncProfilePhotoToWatermark: _ignoredSync,
    ...rest
  } = prefs;
  return rest as Partial<T>;
}
