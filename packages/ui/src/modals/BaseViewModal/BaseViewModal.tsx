import React, { ReactNode } from 'react';
import styles from './BaseViewModal.module.css';
import { ModalRoot } from '../ModalRoot';
import { ArchivedBanner } from '../../banners/ArchivedBanner';
import { DeletedBanner } from '../../banners/DeletedBanner';

// Lifecycle interface (matches frontend types)
interface Lifecycle {
  state: 'active' | 'archived' | 'deleted';
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  scheduledDeletion?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  isTombstone?: boolean;
}

export interface BaseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The card component to render in the header (OrderCard, UserCard, etc.) */
  card: ReactNode;
  /** Tab content rendered based on activeTab */
  children: ReactNode;
  /** Lifecycle metadata for universal banner rendering */
  lifecycle?: Lifecycle;
  /** Entity type for banner context */
  entityType?: string;
  /** Entity ID for banner context */
  entityId?: string;
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
  lifecycle,
  entityType = 'entity',
  entityId,
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

        {/* UNIVERSAL LIFECYCLE BANNER - renders for ANY entity */}
        {lifecycle && lifecycle.state !== 'active' && (
          <div style={{ padding: '0 16px', marginTop: '16px' }}>
            {lifecycle.state === 'archived' && (
              <ArchivedBanner
                archivedAt={lifecycle.archivedAt}
                archivedBy={lifecycle.archivedBy}
                reason={lifecycle.archiveReason}
                scheduledDeletion={lifecycle.scheduledDeletion}
                entityType={entityType}
                entityId={entityId}
              />
            )}
            {lifecycle.state === 'deleted' && (
              <DeletedBanner
                deletedAt={lifecycle.deletedAt}
                deletedBy={lifecycle.deletedBy}
                entityType={entityType}
                entityId={entityId}
                isTombstone={lifecycle.isTombstone}
              />
            )}
          </div>
        )}

        <div className={styles.tabContent}>
          {children}
        </div>
      </div>
    </ModalRoot>
  );
}
