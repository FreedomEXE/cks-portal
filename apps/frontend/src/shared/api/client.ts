import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

const RAW_API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export type ApiResponse<T> = { data: T };

export type ApiFetchInit = RequestInit & {
  getToken?: () => Promise<string | null>;
};

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const url = API_BASE + path;
  const { getToken: providedGetToken, headers: initHeaders, ...restInit } = (init ?? {}) as ApiFetchInit;
  const headers = new Headers(initHeaders as HeadersInit | undefined);

  console.log('[apiFetch] Starting request to:', path);
  console.log('[apiFetch] providedGetToken:', !!providedGetToken);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (restInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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






