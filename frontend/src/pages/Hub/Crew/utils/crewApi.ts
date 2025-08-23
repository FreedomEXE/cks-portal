/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * crewApi.ts
 * 
 * Description: Crew-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Crew hub endpoints
 * Importance: Critical - Central API communication layer for Crew hub
 * Connects to: Crew backend API, Clerk authentication, Crew data hooks
 * 
 * Notes: Uses dedicated Crew API base URL for complete backend separation.
 *        Includes Crew-specific authentication headers and operational task focus.
 *        Isolated from other hub API calls for security and business separation.
 *        Crew members perform operational tasks and report to center coordinators.
 */

/**
 * Crew API base configuration
 * Uses separate endpoint for Crew hub isolation and operational tasks
 */
const CREW_DEV_PROXY_BASE = '/api/crew';
const CREW_RAW_API_BASE = import.meta.env.VITE_CREW_API_URL || CREW_DEV_PROXY_BASE;
export const CREW_API_BASE = CREW_RAW_API_BASE.replace(/\/+$/, "");

export function buildCrewApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = CREW_API_BASE + path;
  
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

// Return Clerk user id for Crew authentication
function getCrewClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

// Crew-specific fetch wrapper with dedicated authentication
export async function crewApiFetch(input: string, init: RequestInit = {}) {
  const userId = getCrewClerkUserId();
  const headers = new Headers(init.headers || {});
  
  // Crew-specific headers
  if (userId && !headers.has('x-crew-user-id')) {
    headers.set('x-crew-user-id', userId);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'crew');
  if (!headers.has('x-field-worker')) headers.set('x-field-worker', 'true'); // Crew are field workers
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[crewApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[crewApiFetch] error', { url: input, error });
    throw error;
  }
}