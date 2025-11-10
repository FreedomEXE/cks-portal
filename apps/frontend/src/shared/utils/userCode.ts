/**
 * Typed selector hook for viewer/user code
 * Prevents regressions where code becomes undefined due to scope issues
 */

import { useMemo } from 'react';
import { useAuth } from '@cks/auth';

/**
 * Normalizes user code to uppercase and trims whitespace
 */
function normalizeCode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

/**
 * Returns the current viewer's normalized user code
 * This is the canonical way to get the viewer's identity code
 *
 * @returns {string} Normalized user code (never undefined/null)
 * @throws {Error} If auth is not ready or code cannot be determined
 */
export function useViewerCode(): string {
  const { code, status } = useAuth();

  return useMemo(() => {
    if (status !== 'ready') {
      throw new Error('useViewerCode: Auth not ready');
    }

    if (!code) {
      throw new Error('useViewerCode: User code not available');
    }

    const normalized = normalizeCode(code);
    if (!normalized) {
      throw new Error('useViewerCode: Failed to normalize user code');
    }

    return normalized;
  }, [code, status]);
}

/**
 * Returns the current viewer's normalized user code, or null if not available
 * Use this variant when you need to handle the "not ready" case explicitly
 *
 * @returns {string | null} Normalized user code or null
 */
export function useViewerCodeSafe(): string | null {
  const { code, status } = useAuth();

  return useMemo(() => {
    if (status !== 'ready' || !code) {
      return null;
    }

    return normalizeCode(code);
  }, [code, status]);
}
