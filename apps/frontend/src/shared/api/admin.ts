import useSWR from 'swr';
import { useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch, type ApiFetchInit, type ApiResponse } from './client';
import type { HubOrderItem } from './hub';

export type AdminUser = {
  id: string;
  clerkUserId: string;
  cksCode: string;
  role: string;
  status: string;
  fullName?: string | null;
  email?: string | null;
  territory?: string | null;
  phone?: string | null;
  address?: string | null;
  reportsTo?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type AdminUserFilters = {
  status?: string;
  role?: string;
  territory?: string;
  limit?: number;
  offset?: number;
};

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const { getToken } = useClerkAuth();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    params.set(key, String(value));
  });

  const query = params.toString();
  const key = '/admin/users' + (query ? '?' + query : '');
  const fetcher = useCallback(
    (endpoint: string) =>
      apiFetch<ApiResponse<AdminUser[]>>(endpoint, { getToken }).then((res) => res.data),
    [getToken],
  );
  const { data, error, isLoading } = useSWR<AdminUser[], Error>(key, fetcher);

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}

export async function fetchAdminUsers(init?: ApiFetchInit): Promise<AdminUser[]> {
  const response = await apiFetch<ApiResponse<AdminUser[]>>('/admin/users', init);
  return response.data;
}

export interface ImpersonationRequest {
  entityType: string;
  entityId: string;
}

export interface ImpersonationResponse {
  token?: string;
  sessionId?: string;
}

export async function createImpersonationToken(
  payload: ImpersonationRequest,
  init?: ApiFetchInit,
): Promise<ImpersonationResponse> {
  const response = await apiFetch<ApiResponse<ImpersonationResponse>>('/admin/impersonations', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  return response.data;
}

export interface InviteRequest {
  entityType: string;
  entityId: string;
}

export interface InviteResponse {
  userId: string;
  email: string;
  delivery?: 'invitation';
  invitationId?: string | null;
  inviteStatus?: string | null;
  inviteAlreadyPending?: boolean;
  inviteCreatedAt?: number | null;
}

export interface UnlinkAccountRequest {
  entityType: string;
  entityId: string;
}

export interface UnlinkAccountResponse {
  entityType: string;
  entityId: string;
  wasLinked: boolean;
  unlinked: boolean;
  alreadyUnlinked: boolean;
}

export async function sendUserInvite(
  payload: InviteRequest,
  init?: ApiFetchInit,
): Promise<InviteResponse> {
  const response = await apiFetch<ApiResponse<InviteResponse>>('/admin/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  return response.data;
}

export async function unlinkUserAccountLink(
  payload: UnlinkAccountRequest,
  init?: ApiFetchInit,
): Promise<UnlinkAccountResponse> {
  const response = await apiFetch<ApiResponse<UnlinkAccountResponse>>('/admin/account-links/unlink', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  return response.data;
}

export interface ProvisionTestUsersResult {
  entityType: string;
  entityId: string;
  status: 'linked' | 'error';
  clerkUserId?: string | null;
  error?: string;
}

export async function provisionTestEcosystemUsers(
  init?: ApiFetchInit,
): Promise<ProvisionTestUsersResult[]> {
  const response = await apiFetch<ApiResponse<{ results: ProvisionTestUsersResult[] }>>(
    '/admin/test-ecosystem/provision',
    {
      method: 'POST',
      ...init,
    },
  );
  return response.data.results;
}

export interface UpdateTestUserPasswordInput {
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  entityId: string;
  password: string;
}

export async function updateTestUserPassword(
  input: UpdateTestUserPasswordInput,
  init?: ApiFetchInit,
) {
  const response = await apiFetch<ApiResponse<{ clerkUserId: string }>>('/admin/test-users/password', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  return response.data;
}

export interface UpdateInventoryInput {
  warehouseId: string;
  itemId: string;
  quantityChange: number;
  reason?: string;
}

export interface UpdateInventoryResponse {
  success: boolean;
  message: string;
}

export async function updateInventory(
  input: UpdateInventoryInput,
  init?: ApiFetchInit
): Promise<UpdateInventoryResponse> {
  const response = await apiFetch<UpdateInventoryResponse>('/hub/inventory/update', {
    ...init,
    method: 'POST',
    body: JSON.stringify(input),
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  return response;
}

export async function fetchAdminOrderById(orderId: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubOrderItem>>(`/orders/${encodeURIComponent(orderId)}`, init);
  return response.data;
}

// Update catalog service fields/metadata (admin only)
export async function updateCatalogService(
  serviceId: string,
  payload: {
    name?: string;
    category?: string;
    description?: string;
    imageUrl?: string;
    tags?: string[];
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  },
  init?: ApiFetchInit,
) {
  return apiFetch<{ success: boolean }>(`/admin/catalog/services/${encodeURIComponent(serviceId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
}

export async function updateCatalogProduct(
  productId: string,
  payload: {
    name?: string;
    description?: string;
    imageUrl?: string;
  },
  init?: ApiFetchInit,
) {
  return apiFetch<{ success: boolean }>(`/admin/catalog/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
}

export async function fetchServiceCertifications(serviceId: string, init?: ApiFetchInit): Promise<{ managers: string[]; crew: string[]; warehouses: string[] }>{
  const res = await apiFetch<{ success: boolean; data: { managers: string[]; crew: string[]; warehouses: string[] } }>(`/admin/catalog/services/${encodeURIComponent(serviceId)}/certifications`, init);
  return res.data;
}

export async function patchServiceAssignments(serviceId: string, payload: { role: 'manager'|'contractor'|'crew'|'warehouse'; add: string[]; remove: string[] }, init?: ApiFetchInit) {
  return apiFetch<{ success: boolean }>(`/admin/catalog/services/${encodeURIComponent(serviceId)}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
}

export type UserProfileUpdatePayload = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  mainContact?: string | null;
  emergencyContact?: string | null;
  territory?: string | null;
  reportsTo?: string | null;
};

export async function updateUserProfile(
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse',
  entityId: string,
  payload: UserProfileUpdatePayload,
  init?: ApiFetchInit,
) {
  return apiFetch<{ data: any; state?: string }>(
    `/admin/profile/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    },
  );
}

export type AccountStatus = 'active' | 'paused' | 'ended';
export type AccessTier = 'standard' | 'premium';
export type AccessGrantStatus = 'active' | 'revoked';

export interface AccountManagementSnapshot {
  accountStatus: AccountStatus | string | null;
  accessTier: AccessTier | null;
  accessStatus: AccessGrantStatus | null;
}

export async function fetchAccountManagement(
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse',
  entityId: string,
  init?: ApiFetchInit,
): Promise<AccountManagementSnapshot> {
  const response = await apiFetch<{ data: AccountManagementSnapshot }>(
    `/admin/account-management/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    init,
  );
  return response.data;
}

export async function updateAccountManagement(
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse',
  entityId: string,
  payload: { accountStatus?: AccountStatus; accessTier?: AccessTier },
  init?: ApiFetchInit,
): Promise<AccountManagementSnapshot> {
  const response = await apiFetch<{ data: AccountManagementSnapshot }>(
    `/admin/account-management/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    },
  );
  return response.data;
}

export async function getServiceCertifications(serviceId: string, init?: ApiFetchInit) {
  return apiFetch<{ success: boolean; data: { managers: string[]; contractors: string[]; crew: string[]; warehouses: string[] } }>(`/admin/catalog/services/${encodeURIComponent(serviceId)}/certifications`, {
    method: 'GET',
    ...init,
  });
}

export interface ProductInventory {
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  minStockLevel: number | null;
  location: string | null;
}

export async function getProductInventory(productId: string, init?: ApiFetchInit) {
  return apiFetch<{ success: boolean; data: ProductInventory[] }>(`/admin/catalog/products/${encodeURIComponent(productId)}/inventory`, {
    method: 'GET',
    ...init,
  });
}
