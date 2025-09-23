import useSWR from 'swr';
import { useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch, type ApiFetchInit, type ApiResponse } from './client';

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
