import React, { useMemo, useState, ReactNode } from 'react';
import styles from './ActivityModal.module.css';
import { ModalRoot } from '../ModalRoot';
import OrderCard from '../../cards/OrderCard';
import Button from '../../buttons/Button';
import ProductOrderContent from '../ProductOrderModal/ProductOrderContent';
import ServiceOrderContent from '../ServiceOrderModal/ServiceOrderContent';
import ApprovalWorkflow from '../../workflows/ApprovalWorkflow';
import { ArchivedBanner } from '../../banners/ArchivedBanner';
import { DeletedBanner } from '../../banners/DeletedBanner';
import HistoryTab from '../../tabs/HistoryTab';

export type ActivityActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ActivityAction {
  label: string;
  onClick: () => void;
  variant?: ActivityActionVariant;
  disabled?: boolean;
}

export interface ContactInfo {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface AvailabilityWindow {
  tz: string | null;
  days: string[];
  window: { start: string; end: string } | null;
}

export interface ArchiveMetadata {
  archivedBy: string | null;
  archivedAt: string | null;
  reason: string | null;
  scheduledDeletion: string | null;
}

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

export interface ActivityModalOrder {
  orderId: string;
  orderType: 'service' | 'product';
  title: string | null;
  requestedBy: string | null;
  destination: string | null;
  requestedDate: string | null;
  expectedDate?: string | null;
  serviceStartDate?: string | null;
  deliveryDate?: string | null;
  status: string | null;
  notes?: string | null;
  approvalStages?: Array<{
    role: string;
    status: string;
    user?: string | null;
    timestamp?: string | null;
  }>;
  transformedId?: string | null;
  isDeleted?: boolean;
}

export interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'user' | 'admin';
  order: ActivityModalOrder | null;

  // Action bar
  actions?: ActivityAction[];
  defaultExpanded?: boolean; // retained for backward-compat; no longer used

  // Optional tab configuration override
  tabs?: Array<{ id: string; label: string; visible: boolean }>;

  // Optional content for complex workflows in Actions tab
  children?: ReactNode;

  // Detail sections
  requestorInfo?: ContactInfo | null;
  destinationInfo?: ContactInfo | null;
  availability?: AvailabilityWindow | null;
  serviceDetails?: {
    serviceId: string;
    serviceName: string | null;
    serviceType: string | null;
    description: string | null;
    status: string | null;
  } | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  archiveMetadata?: ArchiveMetadata | null;

  // NEW: Universal lifecycle support
  lifecycle?: Lifecycle;
  entityType?: string;
  entityId?: string;
}

export default function ActivityModal({
  isOpen,
  onClose,
  role,
  order,
  actions = [],
  defaultExpanded = false,
  tabs,
  children,
  requestorInfo,
  destinationInfo,
  availability,
  serviceDetails,
  cancellationReason,
  cancelledBy,
  cancelledAt,
  rejectionReason,
  rejectedBy,
  rejectedAt,
  archiveMetadata,
  lifecycle,
  entityType = 'order',
  entityId,
}: ActivityModalProps) {
  // Early return BEFORE any hooks to satisfy Rules of Hooks
  if (!isOpen || !order) return null;

  // defaultExpanded kept only for compatibility; no logic uses it now
  const [activeTab, setActiveTab] = useState<string>('details');

  const isService = order.orderType === 'service';

  // Default tabs: Details → History → Quick Actions
  const defaultTabs = useMemo(() => [
    { id: 'details', label: 'Details', visible: true },
    { id: 'history', label: 'History', visible: true },
    { id: 'actions', label: 'Quick Actions', visible: actions.length > 0 },
  ], [actions.length]);

  const visibleTabs = useMemo(() => (tabs || defaultTabs).filter((t) => t.visible), [tabs, defaultTabs]);

  const summary = useMemo(() => {
    return (
      <OrderCard
        orderId={order.orderId}
        orderType={(order.orderType || 'product') as any}
        title={order.title || order.orderId}
        requestedBy={order.requestedBy || undefined}
        destination={order.destination || undefined}
        requestedDate={order.requestedDate || new Date().toISOString()}
        expectedDate={order.expectedDate || undefined}
        serviceStartDate={order.serviceStartDate || undefined}
        deliveryDate={order.deliveryDate || undefined}
        status={(order.status || 'pending') as any}
        approvalStages={(order.approvalStages as any) || []}
        onAction={undefined}
        actions={[]}
        showWorkflow={false}
        collapsible={false}
        defaultExpanded={false}
        transformedId={order.transformedId || undefined}
        variant="embedded"
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }, [order, visibleTabs, activeTab]);

  // Ensure activeTab remains valid when tabs change
  React.useEffect(() => {
    if (!visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'details');
    }
  }, [visibleTabs, activeTab]);

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContainer}>
        <button className={styles.closeX} aria-label="Close" onClick={onClose}>x</button>

        <div className={styles.header}>
          {summary}
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
                entityId={entityId || order.orderId}
              />
            )}
            {lifecycle.state === 'deleted' && (
              <DeletedBanner
                deletedAt={lifecycle.deletedAt}
                deletedBy={lifecycle.deletedBy}
                entityType={entityType}
                entityId={entityId || order.orderId}
                isTombstone={lifecycle.isTombstone}
              />
            )}
          </div>
        )}

        <div className={styles.tabContent}>
          {activeTab === 'actions' && (
            <div className={styles.actionsTab}>
              {/* Approval Workflow */}
              <ApprovalWorkflow stages={order.approvalStages} />

              {/* Actions Section */}
              <div className={styles.actionsSection}>
                <h4 className={styles.actionsTitle}>Actions</h4>
                <div className={styles.actionsGrid}>
                  {actions.map((a, idx) => (
                    <Button
                      key={idx}
                      variant={(a.variant || 'secondary') as any}
                      className={styles.bigButton}
                      onClick={a.onClick}
                      disabled={a.disabled}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>

              {children}
            </div>
          )}

          {activeTab === 'details' && (
            <div className={styles.detailsTab}>
              {isService ? (
                <ServiceOrderContent
                  order={order as any}
                  requestorInfo={requestorInfo}
                  destinationInfo={destinationInfo}
                  availability={availability as any}
                  serviceDetails={serviceDetails}
                  cancellationReason={cancellationReason}
                  cancelledBy={cancelledBy}
                  cancelledAt={cancelledAt}
                  rejectionReason={rejectionReason}
                  rejectedBy={rejectedBy}
                  rejectedAt={rejectedAt}
                  archiveMetadata={archiveMetadata as any}
                />
              ) : (
                <ProductOrderContent
                  order={order as any}
                  requestorInfo={requestorInfo}
                  destinationInfo={destinationInfo}
                  availability={availability as any}
                  cancellationReason={cancellationReason}
                  cancelledBy={cancelledBy}
                  cancelledAt={cancelledAt}
                  rejectionReason={rejectionReason}
                  rejectedBy={rejectedBy}
                  rejectedAt={rejectedAt}
                  archiveMetadata={archiveMetadata as any}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryTab
              entityType={entityType}
              entityId={entityId || order.orderId}
            />
          )}
        </div>
      </div>
    </ModalRoot>
  );
}
