/**
 * ModalGateway - Universal Modal Orchestrator
 *
 * Single component that handles ALL entity modals.
 * Uses entity registry to determine how to fetch data, build actions, and render.
 *
 * Usage:
 * ```tsx
 * <ModalGateway
 *   entityType="report"
 *   entityId="CEN-010-RPT-001"
 *   role="admin"
 *   onClose={() => setOpen(false)}
 * />
 * ```
 *
 * This replaces the need for:
 * - ActivityModalGateway (order-specific)
 * - ReportModalGateway
 * - ServiceModalGateway
 * - etc.
 */

import { useMemo } from 'react';
import type { EntityType, UserRole, EntityState, Lifecycle, OpenEntityModalOptions } from '../types/entities';
import { entityRegistry } from '../config/entityRegistry';
import { useOrderDetails } from '../hooks/useOrderDetails';
import { useReportDetails } from '../hooks/useReportDetails';
import { useServiceDetails } from '../hooks/useServiceDetails';
import { useEntityActions } from '../hooks/useEntityActions';
import { filterVisibleTabs } from '../policies/tabs';
import { EntityModalView } from '@cks/domain-widgets';

/**
 * Extract lifecycle metadata from entity data and archive metadata
 *
 * Unifies lifecycle detection across all entity types.
 * Priority: Deleted > Archived > Active
 */
function extractLifecycle(data: any, archiveMetadata: any): Lifecycle {
  // Priority 1: Deleted state
  if (data?.isDeleted || data?.deletedAt) {
    return {
      state: 'deleted',
      deletedAt: data.deletedAt,
      deletedBy: data.deletedBy,
      deletionReason: data.deletionReason,
      isTombstone: data.isTombstone || false
    };
  }

  // Priority 2: Archived state
  if (archiveMetadata?.archivedAt || data?.archivedAt) {
    return {
      state: 'archived',
      archivedAt: archiveMetadata?.archivedAt || data.archivedAt,
      archivedBy: archiveMetadata?.archivedBy || data.archivedBy,
      archiveReason: archiveMetadata?.reason || data.archiveReason,
      scheduledDeletion: archiveMetadata?.scheduledDeletion
    };
  }

  // Default: Active
  return { state: 'active' };
}

export interface ModalGatewayProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Callback when modal closes */
  onClose: () => void;

  /** Type of entity to display */
  entityType: EntityType | null;

  /** ID of the entity */
  entityId: string | null;

  /** Current user's role */
  role: UserRole;

  /** Current user's ID (for permission checks) */
  currentUserId?: string;

  /** Additional options */
  options?: OpenEntityModalOptions;
}

export function ModalGateway({
  isOpen,
  onClose,
  entityType,
  entityId,
  role,
  currentUserId,
  options,
}: ModalGatewayProps) {

  // ===== STEP 1: Call ALL hooks unconditionally (React requirement) =====
  // We must call hooks at the top level, not conditionally based on entityType

  // Get action handler hook at top level (NO LONGER in adapters!)
  const { handleAction } = useEntityActions();

  const orderDetails = useOrderDetails({
    orderId: entityType === 'order' ? entityId : null
  });

  const reportDetails = useReportDetails({
    reportId: (entityType === 'report' || entityType === 'feedback') ? entityId : null,
    reportType: entityType === 'feedback' ? 'feedback' : 'report',
  });

  const serviceDetails = useServiceDetails({
    serviceId: entityType === 'service' ? entityId : null,
  });

  // ===== STEP 2: Select the right data based on entityType =====
  // NOTE: User entities (manager/contractor/customer/center/crew/warehouse) are now
  // fetched by ModalProvider.openById and passed via options?.data.
  // No hooks needed for users!
  const detailsMap: Record<string, { data: any; isLoading: boolean; error: Error | null; lifecycle: Lifecycle }> = {
    order: {
      data: orderDetails.order,
      isLoading: orderDetails.isLoading,
      error: orderDetails.error || null,
      lifecycle: extractLifecycle(orderDetails.order, orderDetails.archiveMetadata),
    },
    report: {
      data: reportDetails.report,
      isLoading: reportDetails.isLoading || false,
      error: reportDetails.error || null,
      lifecycle: extractLifecycle(reportDetails.report, null),
    },
    feedback: {
      data: reportDetails.report,
      isLoading: reportDetails.isLoading || false,
      error: reportDetails.error || null,
      lifecycle: extractLifecycle(reportDetails.report, null),
    },
    service: {
      data: serviceDetails.service,
      isLoading: serviceDetails.isLoading || false,
      error: serviceDetails.error || null,
      lifecycle: extractLifecycle(serviceDetails.service, null),
    },
  };

  // Check if we have fetched data OR pre-loaded data
  let dataDetails: { data: any; isLoading: boolean; error: Error | null; lifecycle: Lifecycle };

  if (entityType && detailsMap[entityType]) {
    // Use fetched data (order, report, service)
    dataDetails = detailsMap[entityType];
  } else if (options?.data) {
    // Use pre-loaded data (users, products, etc.)
    console.log('[ModalGateway] Using pre-loaded data for', entityType, options.data);

    // Build lifecycle from options metadata (for users fetched by ModalProvider)
    let lifecycle: Lifecycle;
    const opts = options as any; // Type assertion to access lifecycle fields

    if (opts.deletedAt) {
      lifecycle = {
        state: 'deleted',
        deletedAt: opts.deletedAt,
        deletedBy: opts.deletedBy,
        isTombstone: false
      };
    } else if (opts.archivedAt) {
      lifecycle = {
        state: 'archived',
        archivedAt: opts.archivedAt,
        archivedBy: opts.archivedBy,
      };
    } else {
      lifecycle = { state: 'active' };
    }

    dataDetails = {
      data: options.data,
      isLoading: false,
      error: null,
      lifecycle,
    };
  } else {
    // No data available
    console.warn('[ModalGateway] No data available for', entityType, entityId);
    dataDetails = {
      data: null,
      isLoading: false,
      error: null,
      lifecycle: { state: 'active' } as Lifecycle,
    };
  }

  const { data, isLoading, error, lifecycle } = dataDetails;
  console.log('[ModalGateway] Final data:', { entityType, entityId, data, lifecycle });

  // Determine final state (explicit override or detected from lifecycle)
  const state: EntityState = options?.state || lifecycle.state;

  // Get adapter from registry (before useMemo hooks!)
  const adapter = entityType ? entityRegistry[entityType] : null;

  // ===== STEP 3: Get pure descriptors from adapter (NO HOOKS in adapter!) =====
  const descriptors = useMemo(() => {
    if (!adapter || !data || !entityType || !entityId) return [];

    return adapter.getActionDescriptors({
      role,
      state,
      entityId,
      entityType,
      entityData: data,
    });
  }, [adapter, role, state, entityId, entityType, data]);

  // ===== STEP 4: Bind descriptors to handlers (hooks called HERE, not in adapters) =====
  const actions = useMemo(() => {
    return descriptors.map((desc) => {
      return {
        label: desc.label,
        variant: desc.variant,
        disabled: desc.disabled,
        onClick: async () => {
          // Handle confirmation dialog
          if (desc.confirm && !window.confirm(desc.confirm)) {
            return;
          }

          // Handle input prompt
          let userInput: string | undefined;
          if (desc.prompt) {
            const input = window.prompt(desc.prompt)?.trim();
            // Only proceed if user provided input OR prompt was optional
            if (!input && !desc.prompt.toLowerCase().includes('optional')) {
              return; // User cancelled or didn't provide required input
            }
            userInput = input || undefined;
          }

          // Call centralized action handler
          await handleAction(entityId!, desc.key, {
            notes: userInput,
            ...desc.payload,
            onSuccess: () => {
              // Close modal if closeOnSuccess is true (default behavior)
              if (desc.closeOnSuccess !== false) {
                onClose();
              }
            },
          });
        },
      };
    });
  }, [descriptors, handleAction, entityId, onClose]);

  // ===== STEP 5: Build tabs from adapter and filter via RBAC policy =====
  const visibleTabs = useMemo(() => {
    if (!adapter || !data || !entityType || !entityId) return [];

    // Get tab descriptors from adapter
    const allTabs = adapter.getTabDescriptors({
      role,
      lifecycle,
      entityType,
      entityData: data,
      hasActions: actions.length > 0,
    }, actions);

    // Filter tabs based on RBAC policy
    const filtered = filterVisibleTabs(allTabs, {
      role,
      lifecycle,
      entityType,
      entityData: data,
      hasActions: actions.length > 0,
    });

    return filtered;
  }, [adapter, role, lifecycle, entityType, data, actions, entityId]);

  // ===== STEP 6: Get header config from adapter =====
  const headerConfig = useMemo(() => {
    if (!adapter || !data || !entityType || !entityId) return null;

    if (adapter.getHeaderConfig) {
      return adapter.getHeaderConfig({
        role,
        lifecycle,
        entityType,
        entityData: data,
        hasActions: actions.length > 0,
      });
    }

    // Legacy fallback (deprecated)
    return null;
  }, [adapter, role, lifecycle, entityType, data, actions, entityId]);

  // LEGACY: Map data to component props (for backward compatibility with old modals)
  const componentProps = useMemo(() => {
    if (!adapter || !adapter.mapToProps) return {};
    const props = adapter.mapToProps(data, actions, onClose, lifecycle);
    // Add visibleTabs to props for universal tab composition
    return {
      ...props,
      tabs: visibleTabs,
    };
  }, [adapter, data, actions, onClose, lifecycle, visibleTabs]);

  // ===== STEP 7: Early returns AFTER all hooks =====
  if (!isOpen || !entityType || !entityId) {
    return null;
  }

  if (!adapter) {
    console.error(`[ModalGateway] No adapter found for entity type: ${entityType}`);
    return null;
  }

  // Handle error state
  if (error) {
    console.error(`[ModalGateway] Error loading ${entityType}:`, error);
    // Still render modal with error state
  }

  // ===== NEW PATTERN: Render EntityModalView directly =====
  if (adapter.getHeaderConfig) {
    return (
      <EntityModalView
        key={`${entityType}:${entityId}`}
        isOpen={isOpen}
        onClose={onClose}
        entityType={entityType}
        entityId={entityId}
        lifecycle={lifecycle}
        headerConfig={headerConfig || { id: '', status: 'pending', fields: [] }}
        tabs={visibleTabs}
      />
    );
  }

  // ===== LEGACY FALLBACK: Render old wrapper modals =====
  // This path will be removed after cleanup
  const Component = adapter.Component;

  if (!Component) {
    console.error(`[ModalGateway] No Component or getHeader found for entity type: ${entityType}`);
    return null;
  }

  // Handle loading state (legacy)
  if (isLoading) {
    return (
      <Component
        {...componentProps}
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }

  // Render the modal component with all prepared props (legacy)
  // key prop forces remount when entity changes (keeps hook order consistent)
  return (
    <Component
      key={`${entityType}:${entityId}`}
      {...componentProps}
      isOpen={isOpen}
      onClose={onClose}
      role={role}
      currentUser={currentUserId}
    />
  );
}

export default ModalGateway;
