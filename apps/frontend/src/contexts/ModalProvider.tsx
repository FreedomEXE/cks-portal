/**
 * ModalProvider - Simplified Universal Modal Management
 *
 * New architecture using ModalGateway for all entity types.
 * Eliminates need for entity-specific logic in the provider.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ModalGateway from '../components/ModalGateway';
import type { EntityType, UserRole, OpenEntityModalOptions } from '../types/entities';
import { parseEntityId, isValidId } from '../shared/utils/parseEntityId';

export interface ModalContextValue {
  /**
   * Open modal by ID only - type detected automatically
   * This is the ID-first architecture entrypoint
   *
   * @param id - The entity ID (e.g., "CON-010-FBK-001")
   * @param options - Optional modal configuration
   * @example modals.openById('CON-010-FBK-001')
   */
  openById: (id: string, options?: OpenEntityModalOptions) => void;

  /** Open any entity modal (internal - use openById instead) */
  openEntityModal: (
    entityType: EntityType,
    entityId: string,
    options?: OpenEntityModalOptions
  ) => void;

  /** Close current modal */
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export interface ModalProviderProps {
  children: ReactNode;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's role */
  role: UserRole;
}

export function ModalProvider({
  children,
  currentUserId,
  role,
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

  // ID-first open function - automatic type detection
  const openById = useCallback(
    (id: string, options?: OpenEntityModalOptions) => {
      // Validate ID format
      if (!isValidId(id)) {
        console.error(`[ModalProvider] Invalid ID format: "${id}"`);
        return;
      }

      // Parse ID to determine type
      const { type, subtype } = parseEntityId(id);

      // Handle unknown types
      if (type === 'unknown') {
        console.error(`[ModalProvider] Unknown entity type for ID: "${id}"`);
        return;
      }

      // For orders, always use 'order' type (subtype is just metadata: product/service)
      // For reports, use subtype ('feedback' vs 'report')
      // Everything else uses type
      const entityType = (type === 'order' ? type : (subtype || type)) as EntityType;

      console.log(`[ModalProvider] Opening ${entityType} modal for ID: ${id}`);

      // Delegate to openEntityModal
      openEntityModal(entityType, id, options);
    },
    [openEntityModal]
  );

  // Close function
  const closeModal = useCallback(() => {
    setCurrentModal(null);
    // Call onClosed callback if provided
    if (currentModal?.options?.onClosed) {
      currentModal.options.onClosed();
    }
  }, [currentModal]);

  const value: ModalContextValue = {
    openById,
    openEntityModal,
    closeModal,
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
