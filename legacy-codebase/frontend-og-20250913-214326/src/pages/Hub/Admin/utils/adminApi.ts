/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * adminApi.ts
 * 
 * Description: Admin-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Admin hub endpoints
 * Importance: Critical - Central API communication layer for Admin hub
 * Connects to: Admin backend API, Clerk authentication, Admin data hooks
 * 
 * Notes: Uses dedicated Admin API base URL for complete backend separation.
 *        Includes Admin-specific authentication headers and system management focus.
 *        Isolated from other hub API calls for security and business separation.
 *        Admin users manage all system data, users, and configurations.
 */

/**
 * Admin API base configuration
 * Uses separate endpoint for Admin hub isolation and system management
 */
const ADMIN_DEV_PROXY_BASE = '/api/admin';
const ADMIN_RAW_API_BASE = import.meta.env.VITE_ADMIN_API_URL || ADMIN_DEV_PROXY_BASE;
export const ADMIN_API_BASE = ADMIN_RAW_API_BASE.replace(/\/+$/, "");

export function buildAdminApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = ADMIN_API_BASE + path;
  
  // Add query parameters if any
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      searchParams.set(k, String(v));
    }
  }
  
  const queryString = searchParams.toString();
  if (queryString) {
    url += '?' + queryString;
  }
  
  return url;
}

// Return Clerk user id for Admin authentication
function getAdminClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Admin-specific fetch wrapper with dedicated authentication
export async function adminApiFetch(input: string, init: RequestInit = {}) {
  const userId = getAdminClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Admin-specific headers
  if (userId && !headers.has('x-admin-user-id')) {
    headers.set('x-admin-user-id', userId);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'admin');
  if (!headers.has('x-system-admin')) headers.set('x-system-admin', 'true'); // Admin has system access
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[adminApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[adminApiFetch] error', { url: input, error });
    throw error;
  }
}