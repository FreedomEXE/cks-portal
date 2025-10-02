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
