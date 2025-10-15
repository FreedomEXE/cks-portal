import { apiFetch } from '../api/client';

export interface FetchResponse<T> {
  ok: boolean;
  data: T;
  error?: {
    message: string;
  };
}

/**
 * Wrapper around apiFetch that returns a standardized response format
 */
export async function fetchJson<T>(
  path: string,
  options?: RequestInit
): Promise<FetchResponse<T>> {
  try {
    const data = await apiFetch<T>(path, options);
    return {
      ok: true,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return {
      ok: false,
      data: null as any,
      error: {
        message,
      },
    };
  }
}
