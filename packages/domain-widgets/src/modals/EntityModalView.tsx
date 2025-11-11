/**
 * EntityModalView - Universal Modal Shell
 *
 * THE ONLY MODAL in the system. All entities (orders, reports, services, users, etc.)
 * use this single shell with different content.
 *
 * What it owns:
 * - Modal shell (BaseViewModal from @cks/ui)
 * - Header summary region (passed as render-prop)
 * - Lifecycle banners (archived/deleted)
 * - Tab navigation
 * - Tab content rendering
 * - Active tab state
 *
 * What adapters provide:
 * - Header renderer (the visual summary)
 * - Tab descriptors (RBAC-filtered)
 * - Tab content renderers
 * - Actions (RBAC-filtered)
 *
 * Philosophy:
 * - ID determines entity type (via catalog)
 * - RBAC determines what you see (via policy)
 * - Adapters provide structure (header + tabs + content)
 * - This modal just renders it
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { BaseViewModal, EntityHeader, EntityHeaderCard, type HeaderConfig, ActionBar, ApprovalWorkflow } from '@cks/ui';
import type { ActionDescriptor, ApprovalStage } from '@cks/ui';
import { getEntityAccentColor } from '../shared/colors';

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

// Tab descriptor
export interface TabDescriptor {
  id: string;
  label: string;
  content: ReactNode;
}

export interface EntityModalViewProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Callback when modal closes */
  onClose: () => void;

  /** Entity type (for context) */
  entityType: string;

  /** Entity ID (for context) */
  entityId: string;

  /** Lifecycle metadata */
  lifecycle?: Lifecycle;

  /** Header configuration (data-only) */
  headerConfig: HeaderConfig;

  /** Tab descriptors (RBAC-filtered) */
  tabs: TabDescriptor[];
  /** Header actions rendered as an ActionBar under the summary */
  headerActions?: ActionDescriptor[];
  /** Optional approval workflow stages rendered beneath actions */
  headerWorkflowStages?: ApprovalStage[];

  /** @deprecated Legacy support for ReactNode header */
  header?: ReactNode;
}

/**
 * EntityModalView - The universal modal shell
 *
 * Usage:
 * ```tsx
 * <EntityModalView
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   entityType="order"
 *   entityId="PO-001"
 *   lifecycle={lifecycle}
 *   header={<OrderHeader orderId="PO-001" status="pending" />}
 *   tabs={[
 *     { id: 'details', label: 'Details', content: <OrderDetails /> },
 *     { id: 'history', label: 'History', content: <HistoryTab /> },
 *     { id: 'actions', label: 'Actions', content: <OrderActions /> }
 *   ]}
 * />
 * ```
 */
export function EntityModalView({
  isOpen,
  onClose,
  entityType,
  entityId,
  lifecycle,
  headerConfig,
  header, // Legacy support
  tabs,
  headerActions,
  headerWorkflowStages,
}: EntityModalViewProps) {
  // Get accent color for this entity type
  const accentColor = getEntityAccentColor(entityType);

  // Render EntityHeaderCard from configuration (new pattern)
  // Fall back to legacy EntityHeader or header prop for backward compatibility
  const nameField = headerConfig?.fields?.find(f => f.label === 'Name');
  const nameValue = nameField?.value;
  const nameString = typeof nameValue === 'string' ? nameValue : undefined;

  // Compute display status with lifecycle priority
  // Lifecycle state overrides data status for badge display
  const displayStatus = lifecycle
    ? lifecycle.state === 'deleted'
      ? 'deleted'
      : lifecycle.state === 'archived'
        ? 'archived'
        : headerConfig.status
    : headerConfig.status;

  const displayStatusText = lifecycle
    ? lifecycle.state === 'deleted'
      ? 'DELETED'
      : lifecycle.state === 'archived'
        ? 'ARCHIVED'
        : headerConfig.statusText || headerConfig.status?.toUpperCase()
    : headerConfig.statusText || headerConfig.status?.toUpperCase();

  const headerContent = headerConfig ? (
    <EntityHeaderCard
      id={headerConfig.id}
      typeLabel={headerConfig.type?.toUpperCase() || entityType.toUpperCase()}
      name={nameString}
      accentColor={accentColor}
      status={
        displayStatus
          ? { value: displayStatus, text: displayStatusText || displayStatus.toUpperCase() }
          : undefined
      }
    >
      {headerActions && headerActions.length ? (
        <div style={{ marginTop: 12 }}>
          <ActionBar actions={headerActions} />
        </div>
      ) : null}
      {headerWorkflowStages && headerWorkflowStages.length ? (
        <div style={{ marginTop: 12 }}>
          <ApprovalWorkflow stages={headerWorkflowStages} variant="compact" />
        </div>
      ) : null}
    </EntityHeaderCard>
  ) : header;

  return (
    <BaseViewModal
      isOpen={isOpen}
      onClose={onClose}
      card={headerContent}
      tabs={tabs}
      lifecycle={lifecycle}
      entityType={entityType}
      entityId={entityId}
      accentColor={accentColor}
    />
  );
}

export default EntityModalView;
