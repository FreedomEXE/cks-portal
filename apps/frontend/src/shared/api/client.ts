import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

// Prefer Vite dev proxy by default. Allow override via env.
const DEV_PROXY_BASE = '/api';
const RAW_API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  DEV_PROXY_BASE;
export const API_BASE = String(RAW_API_BASE).replace(/\/+$/, '');
declare global {
  interface Window {
    __cksDevAuth?: (options?: { role?: string | null; code?: string | null }) => void;
  }
}
const DEV_AUTH_ENABLED = ((import.meta as any).env?.VITE_CKS_ENABLE_DEV_AUTH ?? 'false') === 'true';

export type ApiResponse<T> = { data: T };

export type ApiFetchInit = RequestInit & {
  getToken?: () => Promise<string | null>;
};

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { getToken: providedGetToken, headers: initHeaders, ...restInit } = (init ?? {}) as ApiFetchInit;
  const headers = new Headers(initHeaders as HeadersInit | undefined);
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  const url = API_BASE + normalizedPath;
  const isAdminApiRequest = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');
  const shouldApplyDevOverride = DEV_AUTH_ENABLED && typeof window !== 'undefined' && !isAdminApiRequest;

  console.log('[apiFetch] Starting request to:', path);
  console.log('[apiFetch] providedGetToken:', !!providedGetToken);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (restInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (shouldApplyDevOverride) {
    try {
      if (!headers.has('x-cks-dev-role')) {
        const storedRole = window.sessionStorage?.getItem?.('cks_dev_role') ?? null;
        const normalizedRole = storedRole?.trim();
        if (normalizedRole) {
          headers.set('x-cks-dev-role', normalizedRole);
          console.log('[apiFetch] Added dev role header:', normalizedRole);
        }
      }
      if (!headers.has('x-cks-dev-code')) {
        const storedCode = window.sessionStorage?.getItem?.('cks_dev_code') ?? null;
        const normalizedCode = storedCode?.trim();
        if (normalizedCode) {
          const headerCode = normalizedCode.toUpperCase();
          headers.set('x-cks-dev-code', headerCode);
          console.log('[apiFetch] Added dev code header:', headerCode);
        }
      }
    } catch (error) {
      console.warn('[apiFetch] Failed to apply dev auth override', error);
    }
  } else if (DEV_AUTH_ENABLED && typeof window !== 'undefined') {
    headers.delete('x-cks-dev-role');
    headers.delete('x-cks-dev-code');
  }

  // Enhanced token resolution with better error handling
  if (!headers.has('authorization') && !headers.has('Authorization')) {
    const tokenSources: Array<(() => Promise<string | null>) | undefined> = [
      providedGetToken,
      () => (globalThis as any)?.Clerk?.session?.getToken?.(),
    ];

    let tokenResolved = false;
    for (const provider of tokenSources) {
      if (!provider) {
        console.log('[apiFetch] Skipping undefined token provider');
        continue;
      }
      try {
        console.log('[apiFetch] Trying token provider...');
        const token = await provider();
        console.log('[apiFetch] Token result:', token ? 'received' : 'null');
        if (token) {
          headers.set('Authorization', 'Bearer ' + token);
          tokenResolved = true;
          console.log('[apiFetch] Token attached for:', path);
          break;
        }
      } catch (error) {
        console.warn('[apiFetch] Token provider failed:', error);
      }
    }

    if (!tokenResolved) {
      console.warn('[apiFetch] No auth token available for request to:', path);
    }
  }

  console.log('[apiFetch] Final headers:', Object.fromEntries(headers.entries()));

  const response = await fetch(url, {
    credentials: 'include',
    ...restInit,
    headers,
  });

  if (response.status === 401) {
    console.error('[apiFetch] 401 Unauthorized for:', path);
    throw Object.assign(new Error('Unauthorized'), { status: response.status });
  }

  if (response.status === 403) {
    console.error('[apiFetch] 403 Forbidden for:', path);
    throw Object.assign(new Error('Forbidden'), { status: response.status });
  }

  if (!response.ok) {
    const message = await response.text();
    console.error('[apiFetch] Request failed:', response.status, message);
    throw new Error(message || 'Request failed with ' + response.status);
  }

  const data = await response.json();
  return data as T;
}

export function useAuthedFetcher<T>(path: string, transform?: (input: T) => T) {
  const { getToken } = useClerkAuth();
  return useCallback(async () => {
    const result = await apiFetch<T>(path, { getToken });
    return transform ? transform(result) : result;
  }, [getToken, path, transform]);
}




















if (DEV_AUTH_ENABLED && typeof window !== 'undefined' && !window.__cksDevAuth) {
  window.__cksDevAuth = (options: { role?: string | null; code?: string | null } = {}) => {
    const role = options.role ?? undefined;
    const code = options.code ?? undefined;

    if (role !== undefined) {
      const trimmedRole = role ? role.trim() : '';
      if (trimmedRole) {
        window.sessionStorage?.setItem('cks_dev_role', trimmedRole);
      } else {
        window.sessionStorage?.removeItem('cks_dev_role');
      }
    }

    if (code !== undefined) {
      const trimmedCode = code ? code.trim() : '';
      if (trimmedCode) {
        window.sessionStorage?.setItem('cks_dev_code', trimmedCode.toUpperCase());
      } else {
        window.sessionStorage?.removeItem('cks_dev_code');
      }
    }

    console.info('[apiFetch] Dev auth override updated', {
      role: window.sessionStorage?.getItem?.('cks_dev_role') ?? null,
      code: window.sessionStorage?.getItem?.('cks_dev_code') ?? null,
    });
  };
}
