/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * managerApi.ts
 * 
 * Description: Manager-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Manager hub endpoints
 * Importance: Critical - Central API communication layer for Manager hub
 * Connects to: Manager backend API, Clerk authentication, Manager data hooks
 * 
 * Notes: Uses dedicated Manager API base URL for complete backend separation.
 *        Includes Manager-specific authentication headers and error handling.
 *        Isolated from other hub API calls for security.
 */

/**
 * Manager API base configuration
 * Uses separate endpoint for Manager hub isolation and security
 */
const MANAGER_DEV_PROXY_BASE = '/api/manager';
const MANAGER_RAW_API_BASE = import.meta.env.VITE_MANAGER_API_URL || MANAGER_DEV_PROXY_BASE;
export const MANAGER_API_BASE = MANAGER_RAW_API_BASE.replace(/\/+$/, "");

export function buildManagerApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = MANAGER_API_BASE + path;
  
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

// Return Clerk user id for Manager authentication
function getManagerClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Manager-specific fetch wrapper with dedicated authentication
export async function managerApiFetch(input: string, init: RequestInit = {}) {
  const userId = getManagerClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Manager-specific headers
  if (userId && !headers.has('x-manager-user-id')) {
    headers.set('x-manager-user-id', userId);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'manager');
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[managerApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[managerApiFetch] error', { url: input, error });
    throw error;
  }
}