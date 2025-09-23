import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

const RAW_API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export type ApiResponse<T> = { data: T };

export type ApiFetchInit = RequestInit & {
  getToken?: () => Promise<string | null>;
};

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const url = API_BASE + path;
  const { getToken: providedGetToken, headers: initHeaders, ...restInit } = (init ?? {}) as ApiFetchInit;
  const headers = new Headers(initHeaders as HeadersInit | undefined);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('authorization')) {
    const tokenSources: Array<(() => Promise<string | null>) | undefined> = [
      providedGetToken,
      () => (globalThis as any)?.Clerk?.session?.getToken?.(),
    ];

    for (const provider of tokenSources) {
      if (!provider) {
        continue;
      }
      try {
        const token = await provider();
        if (token) {
          headers.set('Authorization', 'Bearer ' + token);
          break;
        }
      } catch {
        // ignore token lookup errors and continue
      }
    }
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...restInit,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(new Error('Unauthorized'), { status: response.status });
  }

  if (!response.ok) {
    const message = await response.text();
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
