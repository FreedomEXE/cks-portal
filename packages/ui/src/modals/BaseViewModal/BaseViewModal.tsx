import React, { ReactNode } from 'react';
import styles from './BaseViewModal.module.css';
import { ModalRoot } from '../ModalRoot';

export interface BaseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The card component to render in the header (OrderCard, UserCard, etc.) */
  card: ReactNode;
  /** Tab content rendered based on activeTab */
  children: ReactNode;
}

/**
 * BaseViewModal - Reusable modal skeleton for all view modals
 *
 * Provides consistent layout, spacing, and behavior for:
 * - OrderModal, UserModal, ServiceModal, ProductModal, etc.
 *
 * Structure:
 * - ModalRoot (backdrop, portal, animations)
 * - Close button (top-right, no border separator)
 * - Header with embedded card (OrderCard/UserCard with tabs)
 * - Tab content area (scrollable, renders children)
 *
 * Usage:
 * ```tsx
 * <BaseViewModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   card={<OrderCard {...props} variant="embedded" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}
 * >
 *   {activeTab === 'actions' && <QuickActions />}
 *   {activeTab === 'details' && <DetailsContent />}
 * </BaseViewModal>
 * ```
 */
export default function BaseViewModal({
  isOpen,
  onClose,
  card,
  children,
}: BaseViewModalProps) {
  if (!isOpen) return null;

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContainer}>
        <button className={styles.closeX} aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className={styles.header}>
          {card}
        </div>

        <div className={styles.tabContent}>
          {children}
        </div>
      </div>
    </ModalRoot>
  );
}
