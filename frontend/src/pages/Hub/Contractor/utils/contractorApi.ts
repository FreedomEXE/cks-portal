/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * contractorApi.ts
 * 
 * Description: Contractor-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Contractor hub endpoints
 * Importance: Critical - Central API communication layer for Contractor hub (top tier clients)
 * Connects to: Contractor backend API, Clerk authentication, Contractor data hooks
 * 
 * Notes: Uses dedicated Contractor API base URL for complete backend separation.
 *        Includes Contractor-specific authentication headers and billing integration.
 *        Isolated from other hub API calls for security and business separation.
 *        Contractors are paying clients and need premium API reliability.
 */

/**
 * Contractor API base configuration
 * Uses separate endpoint for Contractor hub isolation and premium service
 */
const CONTRACTOR_DEV_PROXY_BASE = '/api/contractor';
const CONTRACTOR_RAW_API_BASE = import.meta.env.VITE_CONTRACTOR_API_URL || CONTRACTOR_DEV_PROXY_BASE;
export const CONTRACTOR_API_BASE = CONTRACTOR_RAW_API_BASE.replace(/\/+$/, "");

export function buildContractorApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = CONTRACTOR_API_BASE + path;
  
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

// Return Clerk user id for Contractor authentication
function getContractorClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Contractor-specific fetch wrapper with dedicated authentication
export async function contractorApiFetch(input: string, init: RequestInit = {}) {
  const userId = getContractorClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Contractor-specific headers
  if (userId && !headers.has('x-contractor-user-id')) {
    headers.set('x-contractor-user-id', userId);
  }
  // Align with backend: also provide generic x-user-id
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'contractor');
  if (!headers.has('x-client-tier')) headers.set('x-client-tier', 'premium'); // Contractors are paying clients
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[contractorApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[contractorApiFetch] error', { url: input, error });
    throw error;
  }
}
