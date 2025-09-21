const RAW_API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "/api";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

type ApiResponse<T> = { data: T };

type AdminUser = {
  id: string;
  clerkUserId: string;
  email?: string;
  username?: string;
  cksCode: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(new Error("Unauthorized"), { status: response.status });
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  const data = await response.json();
  return data as T;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await apiFetch<ApiResponse<AdminUser[]>>("/admin/users");
  return response.data;
}

export type { AdminUser };
