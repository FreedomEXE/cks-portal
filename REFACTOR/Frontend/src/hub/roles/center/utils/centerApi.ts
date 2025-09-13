/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * centerApi.ts - Center API utilities
 */

const CENTER_DEV_PROXY_BASE = '/api/center';
const CENTER_RAW_API_BASE = import.meta.env.VITE_CENTER_API_URL || CENTER_DEV_PROXY_BASE;
export const CENTER_API_BASE = CENTER_RAW_API_BASE.replace(/\/+$/, "");

export function buildCenterApiUrl(path: string, params: Record<string, any> = {}) {
  let url = CENTER_API_BASE + path;
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      searchParams.set(k, String(v));
    }
  }
  const queryString = searchParams.toString();
  if (queryString) url += '?' + queryString;
  return url;
}

function getCenterClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    return w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
  } catch { return null; }
}

export async function centerApiFetch(input: string, init: RequestInit = {}) {
  let overrideCode: string | null = null;
  let impersonate = false;
  try { 
    impersonate = sessionStorage.getItem('impersonate') === 'true';
    if (impersonate) overrideCode = sessionStorage.getItem('me:lastCode') || sessionStorage.getItem('center:lastCode');
  } catch {}
  const userId = (impersonate && overrideCode) ? overrideCode : getCenterClerkUserId();
  const headers = new Headers(init.headers || {});
  
  if (userId && !headers.has('x-center-user-id')) headers.set('x-center-user-id', userId);
  if (userId && !headers.has('x-user-id')) headers.set('x-user-id', userId);
  try {
    const role = sessionStorage.getItem('me:lastRole');
    if (impersonate && role && !headers.has('x-user-role')) headers.set('x-user-role', role);
  } catch { /* ignore */ }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'center');
  
  const opts: RequestInit = { credentials: 'include', ...init, headers };
  
  try {
    const response = await fetch(input, opts);
    console.debug('[centerApiFetch]', { url: input, status: response.status });
    return response;
  } catch (error) {
    console.error('[centerApiFetch] error', { url: input, error });
    throw error;
  }
}