/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * centerApi.ts
 * 
 * Description: Center-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Center hub endpoints
 * Importance: Critical - Central API communication layer for Center hub
 * Connects to: Center backend API, Clerk authentication, Center data hooks
 * 
 * Notes: Uses dedicated Center API base URL for complete backend separation.
 *        Includes Center-specific authentication headers and crew coordination focus.
 *        Isolated from other hub API calls for security and business separation.
 *        Centers coordinate crew operations and report to customer managers.
 */

/**
 * Center API base configuration
 * Uses separate endpoint for Center hub isolation and crew coordination
 */
const CENTER_DEV_PROXY_BASE = '/api/center';
const CENTER_RAW_API_BASE = import.meta.env.VITE_CENTER_API_URL || CENTER_DEV_PROXY_BASE;
export const CENTER_API_BASE = CENTER_RAW_API_BASE.replace(/\/+$/, "");

export function buildCenterApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = CENTER_API_BASE + path;
  
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

// Return Clerk user id for Center authentication
function getCenterClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Center-specific fetch wrapper with dedicated authentication
export async function centerApiFetch(input: string, init: RequestInit = {}) {
  const userId = getCenterClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Center-specific headers
  if (userId && !headers.has('x-center-user-id')) {
    headers.set('x-center-user-id', userId);
  }
  // Align with backend pattern: also provide generic x-user-id
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'center');
  if (!headers.has('x-crew-coordinator')) headers.set('x-crew-coordinator', 'true'); // Center coordinates crew
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[centerApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[centerApiFetch] error', { url: input, error });
    throw error;
  }
}
