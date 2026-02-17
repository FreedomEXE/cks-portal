import type { HubRoleScopeResponse } from './api/hub';

export const CKS_DEFAULT_WATERMARK_URL = '/cks-watermark-logo.svg';

type WatermarkRole = 'contractor' | 'customer' | 'center' | 'warehouse' | 'manager' | 'crew';

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
    return normalizeCode(scopeData.relationships?.contractor?.id);
  }

  if (normalizedRole === 'center' && scopeData?.role === 'center') {
    return normalizeCode(scopeData.relationships?.contractor?.id);
  }

  return null;
}

export function sanitizeWatermarkPreferenceWrite<T extends { logoWatermarkUrl?: string }>(
  role: string | null | undefined,
  prefs: Partial<T>,
): Partial<T> {
  if (canRoleEditWatermark(role)) {
    return prefs;
  }
  const { logoWatermarkUrl: _ignored, ...rest } = prefs;
  return rest as Partial<T>;
}
