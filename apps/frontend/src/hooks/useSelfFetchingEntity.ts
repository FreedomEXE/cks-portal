/**
 * useSelfFetchingEntity - Self-Fetching Entity Hook for Modals
 *
 * Automatically fetches entity data when modal opens with loading states.
 * Modals become self-sufficient and don't rely on parent components to fetch.
 *
 * Usage:
 * ```tsx
 * function OrderDetailsModal({ orderId, isOpen, onClose }) {
 *   const { data, loading, error } = useSelfFetchingEntity({
 *     entityType: 'order',
 *     entityId: orderId,
 *     enabled: isOpen,
 *     includeDeleted: true, // for admin
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <Modal isOpen={isOpen} onClose={onClose}>
 *       {loading ? <LoadingSpinner /> : <OrderContent order={data?.entity} />}
 *     </Modal>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { fetchJson } from '../shared/utils/fetch';
import { useAuth } from '@cks/auth';

export interface EntityFetchResult {
  entity: any;
  state: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
  deletedBy?: string;
}

export interface UseSelfFetchingEntityOptions {
  entityType: string | null;
  entityId: string | null;
  enabled?: boolean; // Only fetch when enabled (e.g., when modal is open)
  includeDeleted?: boolean; // Only works for admin users
}

export interface UseSelfFetchingEntityResult {
  data: EntityFetchResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to self-fetch entity data with loading states
 */
export function useSelfFetchingEntity(
  options: UseSelfFetchingEntityOptions
): UseSelfFetchingEntityResult {
  const { entityType, entityId, enabled = true, includeDeleted = false } = options;
  const { role } = useAuth();

  const [data, setData] = useState<EntityFetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntity = async () => {
    if (!entityType || !entityId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Only admins can request deleted snapshots
      const includeDeletedParam =
        includeDeleted && role === 'admin' ? '?includeDeleted=1' : '';

      const response = await fetchJson<EntityFetchResult>(
        `/api/entity/${entityType}/${entityId}${includeDeletedParam}`
      );

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to fetch entity');
      }

      setData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load entity';

      // Friendly error messages
      if (message.includes('403') || message.includes('Forbidden')) {
        setError('You do not have permission to view this entity');
      } else if (message.includes('404')) {
        setError('Entity not found');
      } else {
        setError(message);
      }

      console.error('[useSelfFetchingEntity] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntity();
  }, [entityType, entityId, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchEntity,
  };
}
