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
import type { EntityType, UserRole, EntityState, OpenEntityModalOptions } from '../types/entities';
import { entityRegistry } from '../config/entityRegistry';
import { useOrderDetails } from '../hooks/useOrderDetails';
import { useReportDetails } from '../hooks/useReportDetails';
import { useServiceDetails } from '../hooks/useServiceDetails';
import { useEntityActions } from '../hooks/useEntityActions';

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

  /** Hub data for orders (passed through from ModalProvider) */
  ordersData?: any;
}

export function ModalGateway({
  isOpen,
  onClose,
  entityType,
  entityId,
  role,
  currentUserId,
  options,
  ordersData,
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
    ordersData: ordersData,
  });

  // ===== STEP 2: Select the right data based on entityType =====
  const detailsMap: Record<string, { data: any; isLoading: boolean; error: Error | null; state: EntityState }> = {
    order: {
      data: orderDetails.order,
      isLoading: orderDetails.isLoading,
      error: orderDetails.error || null,
      state: (orderDetails.order?.isDeleted ? 'deleted' :
              orderDetails.archiveMetadata?.archivedAt ? 'archived' : 'active') as EntityState,
    },
    report: {
      data: reportDetails.report,
      isLoading: reportDetails.isLoading || false,
      error: reportDetails.error || null,
      state: (reportDetails.report?.archivedAt ? 'archived' : 'active') as EntityState,
    },
    feedback: {
      data: reportDetails.report,
      isLoading: reportDetails.isLoading || false,
      error: reportDetails.error || null,
      state: (reportDetails.report?.archivedAt ? 'archived' : 'active') as EntityState,
    },
    service: {
      data: serviceDetails.service,
      isLoading: false, // useServiceDetails doesn't return isLoading
      error: null, // useServiceDetails doesn't return error
      state: 'active' as EntityState, // Services don't have isDeleted/archivedAt yet
    },
  };

  const { data, isLoading, error, state: detectedState } = (entityType && detailsMap[entityType]) || {
    data: null,
    isLoading: false,
    error: null,
    state: 'active' as EntityState,
  };

  // Determine final state (explicit override or detected)
  const state: EntityState = options?.state || detectedState;

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

  // Map data to component props (MUST be called unconditionally)
  const componentProps = useMemo(() => {
    if (!adapter) return {};
    return adapter.mapToProps(data, actions, onClose);
  }, [adapter, data, actions, onClose]);

  // ===== STEP 3: Early returns AFTER all hooks =====
  if (!isOpen || !entityType || !entityId) {
    return null;
  }

  if (!adapter) {
    console.error(`[ModalGateway] No adapter found for entity type: ${entityType}`);
    return null;
  }

  // Get the modal component
  const Component = adapter.Component;

  // Handle loading state
  if (isLoading) {
    return (
      <Component
        {...componentProps}
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }

  // Handle error state
  if (error) {
    console.error(`[ModalGateway] Error loading ${entityType}:`, error);
    // Still render modal with error state
  }

  // Render the modal component with all prepared props
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
