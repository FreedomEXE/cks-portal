/**
 * apiBase.ts
 *
 * Exports the API base URL and a helper function for building URLs with query parameters.
 * Reads VITE_API_URL from environment or defaults to localhost.
 */
/**
 * API base + helper
 * Prefer dev proxy (/api) so only one ngrok tunnel (frontend) is needed.
 * If VITE_API_URL is set, use it (e.g., production builds).
 */
const DEV_PROXY_BASE = '/api';
const RAW_API_BASE = import.meta.env.VITE_API_URL || DEV_PROXY_BASE;
export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export function buildUrl(path, params = {}) {
  const url = new URL(API_BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

// Return Clerk user id if available (frontend only)
function getClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Fetch wrapper that adds x-user-id for dev bridging until backend JWT auth is added
export async function apiFetch(input: string, init: RequestInit = {}) {
  const userId = getClerkUserId();
  const headers = new Headers(init.headers || {});
  if (userId && !headers.has('x-user-id')) headers.set('x-user-id', userId);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const opts: RequestInit = { credentials: 'include', ...init, headers };
  return fetch(input, opts);
}
