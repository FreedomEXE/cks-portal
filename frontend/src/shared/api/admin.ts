import useSWR from 'swr';

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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  // Try to include a Bearer token from Clerk if available (in addition to cookies)
  let authHeader: Record<string, string> = {};
  try {
    const token = await (globalThis as any)?.Clerk?.session?.getToken?.();
    if (token) {
      authHeader = { Authorization: `Bearer ${token}` };
    }
  } catch {
    // noop – fall back to cookie-only auth
  }
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeader,
      ...(init?.headers || {}),
    },
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

const swrFetcher = (endpoint: string) =>
  apiFetch<ApiResponse<AdminUser[]>>(endpoint).then((res) => res.data);

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    params.set(key, String(value));
  });

  const key = `/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
  const { data, error, isLoading } = useSWR<AdminUser[], Error>(key, swrFetcher);

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await apiFetch<ApiResponse<AdminUser[]>>('/admin/users');
  return response.data;
}

export type { AdminUser, AdminUserFilters };

