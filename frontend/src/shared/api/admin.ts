import useSWR from 'swr';
import { useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const RAW_API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

type ApiResponse<T> = { data: T };

type AdminUser = {
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

type AdminUserFilters = {
  status?: string;
  role?: string;
  territory?: string;
  limit?: number;
  offset?: number;
};

type ApiFetchInit = RequestInit & {
  getToken?: () => Promise<string | null>;
};

async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { getToken: providedGetToken, headers: initHeaders, ...restInit } = (init ?? {}) as ApiFetchInit;
  const headers = new Headers(initHeaders as HeadersInit | undefined);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('authorization')) {
    const tokenSources: Array<(() => Promise<string | null>) | undefined> = [
      providedGetToken,
      () => (globalThis as any)?.Clerk?.session?.getToken?.(),
    ];

    for (const provider of tokenSources) {
      if (!provider) {
        continue;
      }
      try {
        const token = await provider();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          break;
        }
      } catch {
        // ignore, fall back to cookie-based auth if token lookup fails
      }
    }
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...restInit,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(new Error('Unauthorized'), { status: response.status });
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  const data = await response.json();
  return data as T;
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const { getToken } = useClerkAuth();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    params.set(key, String(value));
  });

  const key = `/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
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

export type { AdminUser, AdminUserFilters };
