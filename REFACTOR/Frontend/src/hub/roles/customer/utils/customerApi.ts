/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * customerApi.ts
 * 
 * Description: Customer-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Customer hub endpoints
 * Importance: Critical - Central API communication layer for Customer hub
 * Connects to: Customer backend API, Clerk authentication, Customer data hooks
 * 
 * Notes: Uses dedicated Customer API base URL for complete backend separation.
 *        Includes Customer-specific authentication headers and error handling.
 *        Isolated from other hub API calls for security.
 */

/**
 * Customer API base configuration
 * Uses separate endpoint for Customer hub isolation and security
 */
const CUSTOMER_DEV_PROXY_BASE = '/api/customer';
const CUSTOMER_RAW_API_BASE = import.meta.env.VITE_CUSTOMER_API_URL || CUSTOMER_DEV_PROXY_BASE;
export const CUSTOMER_API_BASE = CUSTOMER_RAW_API_BASE.replace(/\/+$/, "");

export function buildCustomerApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = CUSTOMER_API_BASE + path;
  
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

// Return Clerk user id for Customer authentication
function getCustomerClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Customer-specific fetch wrapper with dedicated authentication
export async function customerApiFetch(input: string, init: RequestInit = {}) {
  // Prefer dev/session override code only when impersonating
  let overrideCode: string | null = null;
  let impersonate = false;
  try { 
    impersonate = sessionStorage.getItem('impersonate') === 'true';
    if (impersonate) overrideCode = sessionStorage.getItem('me:lastCode') || sessionStorage.getItem('customer:lastCode');
  } catch {}
  const userId = (impersonate && overrideCode) ? overrideCode : getCustomerClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Customer-specific headers
  if (userId && !headers.has('x-customer-user-id')) {
    headers.set('x-customer-user-id', userId);
  }
  // Align with backend: also provide generic x-user-id
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }
  try {
    const role = sessionStorage.getItem('me:lastRole');
    if (impersonate && role && !headers.has('x-user-role')) headers.set('x-user-role', role);
  } catch { /* ignore */ }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'customer');
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[customerApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[customerApiFetch] error', { url: input, error });
    throw error;
  }
}