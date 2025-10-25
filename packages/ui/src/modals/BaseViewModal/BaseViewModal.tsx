import React, { ReactNode, useState, useEffect } from 'react';
import styles from './BaseViewModal.module.css';
import { ModalRoot } from '../ModalRoot';
import { ArchivedBanner } from '../../banners/ArchivedBanner';
import { DeletedBanner } from '../../banners/DeletedBanner';
import { TabContainer } from '../../navigation/TabContainer';
import { NavigationTab } from '../../navigation/NavigationTab';

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

// Tab ID type (must match frontend types)
export type TabId = string;

// Tab descriptor
export interface TabDescriptor {
  id: TabId;
  label: string;
  content: ReactNode;
}

export interface BaseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The card component to render in the header (OrderCard, UserCard, etc.) */
  card: ReactNode;
  /** Tab descriptors for universal tab rendering (NEW) */
  tabs?: TabDescriptor[];
  /** Tab content rendered based on activeTab (LEGACY - for backward compat) */
  children?: ReactNode;
  /** Lifecycle metadata for universal banner rendering */
  lifecycle?: Lifecycle;
  /** Entity type for banner context */
  entityType?: string;
  /** Entity ID for banner context */
  entityId?: string;
  /** Accent color for active tab underline (optional, defaults to blue) */
  accentColor?: string;
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
  tabs,
  children,
  lifecycle,
  entityType = 'entity',
  entityId,
  accentColor = '#3b82f6',
}: BaseViewModalProps) {
  // Universal tab state management
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Consolidated tab state effect: guards against transient empty tabs
  useEffect(() => {
    // Guard: ignore transient empty tabs array (mid-render churn)
    if (!tabs || tabs.length === 0) return;

    // Only set activeTabId if:
    // 1. It's null (first init), OR
    // 2. Current tab no longer exists in tabs array
    if (!activeTabId || !tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
    // Otherwise: leave activeTabId unchanged (prevents snap-back glitch)
  }, [tabs, activeTabId]);

  if (!isOpen) return null;

  // Find active tab content
  const activeTab = tabs?.find((t) => t.id === activeTabId);

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

        {/* Universal Tab Buttons (if tabs provided) */}
        {tabs && tabs.length > 0 && (
          <TabContainer>
            {tabs.map((tab) => (
              <NavigationTab
                key={tab.id}
                label={tab.label}
                isActive={activeTabId === tab.id}
                onClick={() => setActiveTabId(tab.id)}
                variant="underline"
                activeColor={accentColor}
              />
            ))}
          </TabContainer>
        )}

        <div className={styles.tabContent}>
          {/* Render tab content if using universal tabs */}
          {tabs && activeTab ? activeTab.content : children}
        </div>
      </div>
    </ModalRoot>
  );
}
