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
  token: string;
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
