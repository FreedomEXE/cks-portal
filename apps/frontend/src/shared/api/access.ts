import { apiFetch, type ApiFetchInit, type ApiResponse } from './client';

export type AccessTier = 'free' | 'premium';

export interface AccessCodeRequest {
  targetRole: string;
  tier: AccessTier;
  maxRedemptions: number;
  scopeCode?: string | null;
  notes?: string | null;
  expiresAt?: string | null;
}

export interface AccessCodeResponse {
  code: string;
  targetRole: string;
  tier: AccessTier;
  status: string;
  maxRedemptions: number;
  redeemedCount: number;
  scopeRole: string | null;
  scopeCode: string | null;
  cascade: boolean;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByRole: string | null;
  createdByCode: string | null;
}

export async function createAccessCode(
  payload: AccessCodeRequest,
  init?: ApiFetchInit,
): Promise<AccessCodeResponse> {
  const response = await apiFetch<ApiResponse<AccessCodeResponse>>('/admin/access-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  return response.data;
}

export interface RedeemAccessCodeRequest {
  code: string;
}

export interface AccessGrantResponse {
  id: string;
  cksCode: string;
  role: string;
  tier: AccessTier;
  status: string;
  sourceCode: string | null;
  cascade: boolean;
  createdAt: string;
}

export async function redeemAccessCode(
  payload: RedeemAccessCodeRequest,
  init?: ApiFetchInit,
): Promise<AccessGrantResponse> {
  const response = await apiFetch<ApiResponse<AccessGrantResponse>>('/account/access-codes/redeem', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  return response.data;
}
