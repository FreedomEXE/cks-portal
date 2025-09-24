import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback, useRef, useEffect } from 'react';

// ============================================
// Type Definitions
// ============================================

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  retryable?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp?: number;
    requestId?: string;
  };
}

export interface ApiFetchOptions extends Omit<RequestInit, 'signal'> {
  getToken?: () => Promise<string | null>;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  skipCache?: boolean;
  signal?: AbortSignal;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

// ============================================
// Configuration
// ============================================

// Proper TypeScript types for Vite env
declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL?: string;
    VITE_API_TIMEOUT?: string;
    VITE_API_CACHE_TTL?: string;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const DEFAULT_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
const CACHE_TTL = parseInt(import.meta.env.VITE_API_CACHE_TTL || '60000', 10);

// ============================================
// Request Cache & Deduplication
// ============================================

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  getCacheKey(path: string, options?: ApiFetchOptions): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${path}:${body}`;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, etag?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
    });
  }

  getPending<T>(key: string): Promise<T> | undefined {
    return this.pendingRequests.get(key);
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);
    promise.finally(() => this.pendingRequests.delete(key));
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const requestCache = new RequestCache();

// ============================================
// Error Handling
// ============================================

function createApiError(message: string, status?: number, details?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.details = details;
  error.retryable = isRetryableError(status);
  return error;
}

function isRetryableError(status?: number): boolean {
  if (!status) return true; // Network errors are retryable
  return status === 408 || status === 429 || status === 503 || status === 504;
}

// ============================================
// URL Validation & Construction
// ============================================

function buildSecureUrl(path: string): string {
  // Validate path to prevent traversal attacks
  if (path.includes('..') || path.includes('//')) {
    throw createApiError('Invalid path: potential security risk', 400);
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  try {
    // Use URL constructor for safe URL building
    return new URL(normalizedPath, API_BASE).toString();
  } catch (error) {
    throw createApiError(`Invalid URL construction: ${path}`, 400);
  }
}

// ============================================
// Retry Logic
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    delay: number;
    signal?: AbortSignal;
  }
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i <= options.retries; i++) {
    try {
      // Check if aborted before attempting
      if (options.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      // Check if error is retryable
      const apiError = error as ApiError;
      if (!apiError.retryable || i === options.retries) {
        throw error;
      }

      // Exponential backoff with jitter
      const backoffDelay = options.delay * Math.pow(2, i) * (0.5 + Math.random() * 0.5);
      await sleep(Math.min(backoffDelay, 30000)); // Cap at 30 seconds
    }
  }

  throw lastError;
}

// ============================================
// Main API Fetch Function
// ============================================

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const {
    getToken,
    retries = 3,
    retryDelay = 1000,
    timeout = DEFAULT_TIMEOUT,
    skipCache = false,
    headers: initHeaders,
    signal: userSignal,
    ...restOptions
  } = options || {};

  // Check cache for GET requests
  const cacheKey = requestCache.getCacheKey(path, options);
  const isGetRequest = !options?.method || options.method === 'GET';

  if (isGetRequest && !skipCache) {
    // Check cache
    const cached = requestCache.get<T>(cacheKey);
    if (cached) return cached;

    // Check for pending request (deduplication)
    const pending = requestCache.getPending<T>(cacheKey);
    if (pending) return pending;
  }

  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);

  // Combine user signal with timeout signal
  const signal = userSignal
    ? AbortSignal.any([userSignal, abortController.signal])
    : abortController.signal;

  const executeRequest = async (): Promise<T> => {
    try {
      const url = buildSecureUrl(path);
      const headers = new Headers(initHeaders as HeadersInit | undefined);

      // Set default headers
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }

      // Only set Content-Type for requests with body
      if (restOptions.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      // Handle authentication
      if (!headers.has('Authorization')) {
        if (getToken) {
          try {
            const token = await getToken();
            if (token) {
              headers.set('Authorization', `Bearer ${token}`);
            }
          } catch (error) {
            console.warn('Failed to get auth token:', error);
          }
        }
      }

      const response = await fetch(url, {
        ...restOptions,
        headers,
        signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);

      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        throw createApiError(
          response.status === 401 ? 'Unauthorized' : 'Forbidden',
          response.status
        );
      }

      // Handle non-OK responses
      if (!response.ok) {
        let errorDetails: unknown;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          try {
            errorDetails = await response.json();
          } catch {
            errorDetails = await response.text();
          }
        } else {
          errorDetails = await response.text();
        }

        throw createApiError(
          `Request failed: ${response.status}`,
          response.status,
          errorDetails
        );
      }

      // Validate response content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw createApiError('Invalid response type: expected JSON', 422);
      }

      const data = await response.json() as T;

      // Cache successful GET requests
      if (isGetRequest && !skipCache) {
        const etag = response.headers.get('etag');
        requestCache.set(cacheKey, data, etag || undefined);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw createApiError('Request timeout', 408);
      }

      throw error;
    }
  };

  // Create promise for request with retry logic
  const requestPromise = withRetry(executeRequest, {
    retries: isGetRequest ? retries : 0, // Only retry GET requests by default
    delay: retryDelay,
    signal: userSignal,
  });

  // Store pending request for deduplication
  if (isGetRequest && !skipCache) {
    requestCache.setPending(cacheKey, requestPromise);
  }

  return requestPromise;
}

// ============================================
// React Hooks
// ============================================

export function useAuthedFetcher<T>(
  path: string,
  options?: Omit<ApiFetchOptions, 'getToken'>
) {
  const { getToken } = useClerkAuth();
  const abortControllerRef = useRef<AbortController>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetcher = useCallback(async (): Promise<T> => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    return apiFetch<T>(path, {
      ...options,
      getToken,
      signal: abortControllerRef.current.signal,
    });
  }, [getToken, path, options]);

  return fetcher;
}

export function useCachedFetcher<T>(
  path: string,
  options?: Omit<ApiFetchOptions, 'skipCache'>
) {
  const { getToken } = useClerkAuth();

  return useCallback(async (forceRefresh = false): Promise<T> => {
    return apiFetch<T>(path, {
      ...options,
      getToken,
      skipCache: forceRefresh,
    });
  }, [getToken, path, options]);
}

// ============================================
// Utility Functions
// ============================================

export function clearApiCache(): void {
  requestCache.clear();
}

export function prefetchApi<T>(path: string, options?: ApiFetchOptions): void {
  // Fire and forget prefetch
  apiFetch<T>(path, options).catch(error => {
    console.debug('Prefetch failed:', path, error);
  });
}

// ============================================
// Export legacy compatibility
// ============================================

export const API_BASE_URL = API_BASE; // For backwards compatibility
export type { ApiResponse as ApiResponse };