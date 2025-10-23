import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';
import * as LoadingService from '../loading';
import { ENTITY_CATALOG } from '../constants/entityCatalog';

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

export type ApiResponse<T> = {
  data: T;
  meta?: {
    isTombstone?: boolean;
  };
};

export type ApiFetchInit = RequestInit & {
  getToken?: () => Promise<string | null>;
  // When true, shows the global blocking overlay for this request
  blocking?: boolean;
  // Optional timeout for the request; if reached, the request is aborted
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = Number(((import.meta as any).env?.VITE_API_TIMEOUT_MS as string | undefined) || '25000');

/**
 * Check if a URL path matches a catalog-backed detail endpoint
 * Returns { entityType, entityId } if match, null otherwise
 */
function parseDetailEndpoint(path: string): { entityType: string; entityId: string } | null {
  // Detail endpoints end with /details
  if (!path.endsWith('/details')) {
    return null;
  }

  // Try to match against catalog patterns
  // Patterns: /api/order/{id}/details, /api/reports/{id}/details, /api/services/{id}/details
  const match = path.match(/\/api\/([^\/]+)\/([^\/]+)\/details$/);
  if (!match) {
    return null;
  }

  const [, pathSegment, entityId] = match;

  // Find matching entity type in catalog
  for (const [entityType, definition] of Object.entries(ENTITY_CATALOG)) {
    // Check if this entity has a details endpoint
    if (!definition.detailsEndpoint) {
      continue;
    }

    // Build expected endpoint and compare
    const expectedPath = definition.detailsEndpoint(entityId);
    if (path === expectedPath || path.startsWith(expectedPath)) {
      return { entityType, entityId };
    }
  }

  return null;
}

/**
 * Attempt to fetch tombstone snapshot for a deleted entity
 */
async function fetchTombstoneSnapshot(
  entityType: string,
  entityId: string,
  headers: Headers
): Promise<any> {
  const snapshotUrl = `${API_BASE}/api/deleted/${entityType}/${entityId}/snapshot`;

  console.log(`[apiFetch:tombstone] Attempting fallback for ${entityType} ${entityId}`);

  const snapshotResponse = await fetch(snapshotUrl, {
    credentials: 'include',
    headers,
  });

  if (!snapshotResponse.ok) {
    throw new Error(`Tombstone snapshot not available (${snapshotResponse.status})`);
  }

  const snapshotData = await snapshotResponse.json();

  if (!snapshotData.success || !snapshotData.data) {
    throw new Error('Invalid snapshot response format');
  }

  // Reconstruct ApiResponse with tombstone flag
  return {
    data: {
      ...snapshotData.data.snapshot,
      isDeleted: true,
      deletedAt: snapshotData.data.deletedAt,
      deletedBy: snapshotData.data.deletedBy,
      deletionReason: snapshotData.data.deletionReason,
      isTombstone: true,
    },
    meta: {
      isTombstone: true,
    },
  };
}

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { getToken: providedGetToken, headers: initHeaders, blocking, timeoutMs, ...restInit } = (init ?? {}) as ApiFetchInit;
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

  const end = LoadingService.start({ blocking: !!blocking });
  let response: Response;
  try {
    const controller = new AbortController();
    const providedSignal = restInit.signal as AbortSignal | undefined;
    if (providedSignal) {
      if (providedSignal.aborted) controller.abort();
      else providedSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    const t = globalThis.setTimeout(() => controller.abort(), Number(timeoutMs ?? DEFAULT_TIMEOUT_MS)) as unknown as number;
    try {
      response = await fetch(url, {
        credentials: 'include',
        ...restInit,
        signal: controller.signal,
        headers,
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.error('[apiFetch] Request timed out:', path);
        const e = new Error('Request timed out');
        (e as any).code = 'ETIMEOUT';
        throw e;
      }
      throw error;
    } finally {
      globalThis.clearTimeout(t);
    }
  } finally {
    end();
  }

  if (response.status === 401) {
    console.error('[apiFetch] 401 Unauthorized for:', path);
    throw Object.assign(new Error('Unauthorized'), { status: response.status });
  }

  if (response.status === 403) {
    console.error('[apiFetch] 403 Forbidden for:', path);
    throw Object.assign(new Error('Forbidden'), { status: response.status });
  }

  // TOMBSTONE FALLBACK: Handle 404 on detail endpoints
  if (response.status === 404) {
    const detailEndpoint = parseDetailEndpoint(normalizedPath);

    if (detailEndpoint) {
      const { entityType, entityId } = detailEndpoint;

      try {
        console.log(`[apiFetch:tombstone] 404 on ${entityType} details, trying snapshot...`);
        const tombstoneData = await fetchTombstoneSnapshot(entityType, entityId, headers);
        console.log(`[apiFetch:tombstone] ✓ Tombstone loaded for ${entityType} ${entityId}`);
        return tombstoneData as T;
      } catch (tombstoneErr) {
        console.log('[apiFetch:tombstone] Snapshot unavailable, re-throwing 404');
        // Fall through to normal 404 handling
      }
    }

    // No detail endpoint match or tombstone failed - throw 404
    const message = await response.text();
    console.error('[apiFetch] 404 Not Found:', path);
    throw Object.assign(new Error(message || 'Not Found'), { status: 404 });
  }

  if (!response.ok) {
    const message = await response.text();
    console.error('[apiFetch] Request failed:', response.status, message);
    throw Object.assign(new Error(message || 'Request failed with ' + response.status), { status: response.status });
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
