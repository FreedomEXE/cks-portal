/**
 * ModalProvider - Simplified Universal Modal Management
 *
 * New architecture using ModalGateway for all entity types.
 * Eliminates need for entity-specific logic in the provider.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ModalGateway from '../components/ModalGateway';
import type { EntityType, UserRole, OpenEntityModalOptions } from '../types/entities';

export interface ModalContextValue {
  /** Open any entity modal */
  openEntityModal: (
    entityType: EntityType,
    entityId: string,
    options?: OpenEntityModalOptions
  ) => void;

  /** Close current modal */
  closeModal: () => void;

  /** Backwards-compat wrappers */
  openOrderModal: (orderId: string) => void;
  closeOrderModal: () => void;
  openReportModal: (reportId: string, reportType: 'report' | 'feedback') => void;
  closeReportModal: () => void;
  openServiceModal: (serviceId: string) => void;
  closeServiceModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export interface ModalProviderProps {
  children: ReactNode;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's role */
  role: UserRole;
  /** Hub data for orders (optional - required for service modals) */
  ordersData?: any;
}

export function ModalProvider({
  children,
  currentUserId,
  role,
  ordersData,
}: ModalProviderProps) {
  // Single state for current modal
  const [currentModal, setCurrentModal] = useState<{
    entityType: EntityType;
    entityId: string;
    options?: OpenEntityModalOptions;
  } | null>(null);

  // Generic open function
  const openEntityModal = useCallback(
    (entityType: EntityType, entityId: string, options?: OpenEntityModalOptions) => {
      setCurrentModal({ entityType, entityId, options });
    },
    []
  );

  // Close function
  const closeModal = useCallback(() => {
    setCurrentModal(null);
    // Call onClosed callback if provided
    if (currentModal?.options?.onClosed) {
      currentModal.options.onClosed();
    }
  }, [currentModal]);

  // Backwards-compat wrappers
  const openOrderModal = useCallback(
    (orderId: string) => openEntityModal('order', orderId),
    [openEntityModal]
  );

  const openReportModal = useCallback(
    (reportId: string, reportType: 'report' | 'feedback') => {
      const entityType = reportType === 'feedback' ? 'feedback' : 'report';
      openEntityModal(entityType, reportId, {
        context: { reportType },
      });
    },
    [openEntityModal]
  );

  const openServiceModal = useCallback(
    (serviceId: string) => openEntityModal('service', serviceId),
    [openEntityModal]
  );

  const value: ModalContextValue = {
    openEntityModal,
    closeModal,
    openOrderModal,
    closeOrderModal: closeModal,
    openReportModal,
    closeReportModal: closeModal,
    openServiceModal,
    closeServiceModal: closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* Single ModalGateway handles ALL entity types */}
      <ModalGateway
        isOpen={!!currentModal}
        onClose={closeModal}
        entityType={currentModal?.entityType || null}
        entityId={currentModal?.entityId || null}
        role={role}
        currentUserId={currentUserId}
        options={currentModal?.options}
        ordersData={ordersData}
      />
    </ModalContext.Provider>
  );
}

/**
 * Hook to access modal functions
 */
export function useModals(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
}
