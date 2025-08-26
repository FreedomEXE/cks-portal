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
 *        Includes Customer-specific authentication headers and center management focus.
 *        Isolated from other hub API calls for security and business separation.
 *        Customers manage centers through contractor arrangements with CKS.
 */

/**
 * Customer API base configuration
 * Uses separate endpoint for Customer hub isolation and center management
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
  const userId = getCustomerClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Customer-specific headers
  if (userId && !headers.has('x-customer-user-id')) {
    headers.set('x-customer-user-id', userId);
  }
  // Align with backend: also provide generic x-user-id
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'customer');
  if (!headers.has('x-center-manager')) headers.set('x-center-manager', 'true'); // Customer manages centers
  
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
