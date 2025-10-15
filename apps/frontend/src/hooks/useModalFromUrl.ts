/**
 * useModalFromUrl - Modal State from URL Parameters
 *
 * Manages modal state through URL search params for deep linking and back/forward support.
 *
 * URL Format: ?modal=order&id=PO-123&entityType=order
 *
 * Usage:
 * ```tsx
 * const orderModal = useModalFromUrl('order');
 *
 * <OrderDetailsModal
 *   isOpen={orderModal.isOpen}
 *   orderId={orderModal.entityId}
 *   onClose={orderModal.close}
 * />
 * ```
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface ModalState {
  isOpen: boolean;
  entityId: string | null;
  entityType: string | null;
  close: () => void;
}

/**
 * Hook to manage modal state from URL parameters
 * @param modalName - The modal identifier (e.g., 'order', 'service', 'user', 'report')
 */
export function useModalFromUrl(modalName: string): ModalState {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentModal = searchParams.get('modal');
  const entityId = searchParams.get('id');
  const entityType = searchParams.get('entityType');

  const isOpen = useMemo(
    () => currentModal === modalName && entityId !== null,
    [currentModal, modalName, entityId]
  );

  const close = useCallback(() => {
    // Remove modal, id, and entityType params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('modal');
    newParams.delete('id');
    newParams.delete('entityType');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    isOpen,
    entityId,
    entityType,
    close,
  };
}

/**
 * Hook to manage multiple modals from URL (for hubs with different modal types)
 */
export function useModalsFromUrl(modalNames: string[]): Record<string, ModalState> {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentModal = searchParams.get('modal');
  const entityId = searchParams.get('id');
  const entityType = searchParams.get('entityType');

  const close = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('modal');
    newParams.delete('id');
    newParams.delete('entityType');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return modalNames.reduce((acc, modalName) => {
    acc[modalName] = {
      isOpen: currentModal === modalName && entityId !== null,
      entityId,
      entityType,
      close,
    };
    return acc;
  }, {} as Record<string, ModalState>);
}
