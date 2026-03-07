/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
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

import { useEffect, useMemo, useState } from 'react';
import type { EntityType, UserRole, EntityState, Lifecycle, OpenEntityModalOptions } from '../types/entities';
import { entityRegistry } from '../config/entityRegistry';
import { useOrderDetails } from '../hooks/useOrderDetails';
import { useReportDetails } from '../hooks/useReportDetails';
import { useServiceDetails } from '../hooks/useServiceDetails';
import { useTicketDetails } from '../hooks/useTicketDetails';
import { useEntityActions } from '../hooks/useEntityActions';
import { useCartSafe } from '../contexts/CartContext';
import { filterVisibleTabs } from '../policies/tabs';
import { EntityModalView } from '@cks/domain-widgets';
import ReportHeaderExtras from './ReportHeaderExtras';

/**
 * Extract lifecycle metadata from entity data and archive metadata
 *
 * Unifies lifecycle detection across all entity types.
 * Priority: Deleted > Archived (explicit) > Archived (inferred from status) > Active
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

  // Priority 2: Archived state (explicit metadata)
  if (archiveMetadata?.archivedAt || data?.archivedAt) {
    return {
      state: 'archived',
      archivedAt: archiveMetadata?.archivedAt || data.archivedAt,
      archivedBy: archiveMetadata?.archivedBy || data.archivedBy,
      archiveReason: archiveMetadata?.reason || data.archiveReason,
      scheduledDeletion: archiveMetadata?.scheduledDeletion
    };
  }

  // Priority 3: Infer archived state from data.status (for catalog entities)
  if (data?.status === 'inactive' || data?.status === 'archived') {
    return {
      state: 'archived',
      archivedAt: data.archivedAt,
      archivedBy: data.archivedBy,
      archiveReason: data.archiveReason,
    };
  }

  // Default: Active
  return { state: 'active' };
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
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
  const cart = useCartSafe();
  const [addedToCart, setAddedToCart] = useState(false);
  const [modalProductQuantity, setModalProductQuantity] = useState(1);

  // Reset local "added" feedback when opening a different product
  useEffect(() => {
    setAddedToCart(false);
    setModalProductQuantity(1);
  }, [entityId]);

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

  const ticketDetails = useTicketDetails({
    ticketId: entityType === 'ticket' ? entityId : null,
  });

  // ===== STEP 2: Select the right data based on entityType =====
  // NOTE: User entities (manager/contractor/customer/center/crew/warehouse) are now
  // fetched by ModalProvider.openById and passed via options?.data.
  // No hooks needed for users!
  const detailsMap: Record<string, { data: any; isLoading: boolean; error: Error | null; lifecycle: Lifecycle }> = {
    order: {
      data: {
        ...orderDetails.order,
        // Merge extended fields from useOrderDetails hook
        requestorInfo: orderDetails.requestorInfo,
        destinationInfo: orderDetails.destinationInfo,
        availability: orderDetails.availability,
      },
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
    ticket: {
      data: ticketDetails.ticket,
      isLoading: ticketDetails.isLoading || false,
      error: ticketDetails.error || null,
      lifecycle: extractLifecycle(ticketDetails.ticket, null),
    },
  };

  // Check if we have fetched data OR pre-loaded data
  let dataDetails: { data: any; isLoading: boolean; error: Error | null; lifecycle: Lifecycle };

  if (entityType && detailsMap[entityType]) {
    // Use fetched data (order, report, service)
    dataDetails = detailsMap[entityType];
    console.log('[ModalGateway] Using detailsMap for', entityType, ':', dataDetails);
  } else if (options?.data) {
    // Use pre-loaded data (users, products, etc.)
    console.log('[ModalGateway] Using pre-loaded data for', entityType, options.data);

    // Build lifecycle from options metadata (for users/products fetched by ModalProvider)
    let lifecycle: Lifecycle;
    const opts = options as any; // Type assertion to access lifecycle fields

    // Priority 1: Explicit state from options
    if (opts.state) {
      if (opts.state === 'deleted') {
        lifecycle = {
          state: 'deleted',
          deletedAt: opts.deletedAt,
          deletedBy: opts.deletedBy,
          isTombstone: opts.isTombstone || false
        };
      } else if (opts.state === 'archived') {
        lifecycle = {
          state: 'archived',
          archivedAt: opts.archivedAt,
          archivedBy: opts.archivedBy,
          archiveReason: opts.archiveReason,
          scheduledDeletion: opts.scheduledDeletion,
        };
      } else {
        lifecycle = { state: 'active' };
      }
    }
    // Priority 2: Infer from metadata presence
    else if (opts.deletedAt) {
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
        scheduledDeletion: opts.scheduledDeletion,
      };
    }
    // Priority 3: Infer from data.status (for catalog entities)
    else if (options.data?.status === 'inactive' || options.data?.status === 'archived') {
      lifecycle = {
        state: 'archived',
        archivedAt: options.data.archivedAt,
        archivedBy: options.data.archivedBy,
        scheduledDeletion: options.data.scheduledDeletion,
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
  console.log('[ModalGateway] Final data:', {
    entityType,
    entityId,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    hasPeopleManagers: !!(data as any)?.peopleManagers,
    lifecycle
  });

  // Determine final state (explicit override or detected from lifecycle)
  const state: EntityState = options?.state || lifecycle.state;

  console.log('[ModalGateway] STATE DETERMINATION:', {
    entityType,
    optionsState: options?.state,
    lifecycleState: lifecycle.state,
    finalState: state,
    dataStatus: data?.status
  });

  // Get adapter from registry (before useMemo hooks!)
  const adapter = entityType ? entityRegistry[entityType] : null;
  const productCode =
    entityType === 'product'
      ? ((data?.productId as string | undefined) || entityId || null)
      : null;
  const cartProductItem = useMemo(() => {
    if (!productCode) return null;
    return cart.items.find((item) => item.catalogCode === productCode) || null;
  }, [cart.items, productCode]);
  const cartProductQuantity = cartProductItem?.quantity ?? 0;
  const scheduleContext = options?.context as { onScheduleService?: (serviceData?: any) => void } | undefined;
  const hasScheduleHandler = typeof scheduleContext?.onScheduleService === 'function';

  useEffect(() => {
    if (!productCode) return;
    if (cartProductQuantity > 0) {
      setModalProductQuantity(clampQuantity(cartProductQuantity));
    } else {
      setModalProductQuantity(1);
    }
  }, [productCode, cartProductQuantity]);

  // ===== STEP 3: Get pure descriptors from adapter (NO HOOKS in adapter!) =====
  const descriptors = useMemo(() => {
    console.log('[ModalGateway] getActionDescriptors check:', {
      hasAdapter: !!adapter,
      hasData: !!data,
      entityType,
      entityId,
      role,
      state,
    });

    if (!adapter || !data || !entityType || !entityId) {
      console.warn('[ModalGateway] Skipping getActionDescriptors - missing required data');
      return [];
    }

    console.log('[ModalGateway] Calling adapter.getActionDescriptors for', entityType);
    const descriptors = adapter.getActionDescriptors({
      role,
      state,
      entityId,
      entityType,
      entityData: data,
      viewerId: currentUserId,
    });
    console.log('[ModalGateway] Action descriptors generated:', descriptors);
    return descriptors;
  }, [adapter, role, state, entityId, entityType, data]);

  // ===== STEP 4: Bind descriptors to handlers (hooks called HERE, not in adapters) =====
  const actions = useMemo(() => {
    return descriptors.map((desc) => {
      const scheduleActionMissingHandler =
        desc.key === 'schedule_service' &&
        entityType === 'catalogService' &&
        !hasScheduleHandler;
      const label =
        desc.key === 'add_to_cart' && cartProductQuantity > 0
          ? 'Update Cart'
          : desc.label;

      return {
        id: desc.key,
        label,
        variant: desc.variant,
        size: desc.size,
        disabled: desc.disabled || scheduleActionMissingHandler,
        onClick: async () => {
          console.log('[ModalGateway] Action onClick triggered:', {
            key: desc.key,
            label: desc.label,
            hasConfirm: !!desc.confirm,
            hasPrompt: !!desc.prompt,
            confirm: desc.confirm,
            prompt: desc.prompt
          });

          if (desc.key === 'add_to_cart' && entityType === 'product' && productCode) {
            const requestedQuantity = clampQuantity(modalProductQuantity);
            if (cartProductQuantity > 0) {
              cart.updateQuantity(productCode, requestedQuantity);
            } else {
              cart.addItem({
                code: productCode,
                name: data?.name || 'Product',
                type: 'product',
                category: data?.category || null,
                description: data?.description || null,
                tags: [],
                imageUrl: data?.imageUrl || null,
                unitOfMeasure: data?.unitOfMeasure || null,
                price: data?.price || null,
                metadata: data?.metadata || null,
              }, requestedQuantity);
            }
            setAddedToCart(true);
            return;
          }

          if (desc.key === 'schedule_service' && entityType === 'catalogService') {
            if (typeof scheduleContext?.onScheduleService === 'function') {
              onClose();
              scheduleContext.onScheduleService(data);
            }
            return;
          }

          // Handle confirmation dialog
          if (desc.confirm) {
            console.log('[ModalGateway] Showing window.confirm:', desc.confirm);
            const confirmed = window.confirm(desc.confirm);
            console.log('[ModalGateway] Confirmation result:', confirmed);
            if (!confirmed) {
              console.log('[ModalGateway] User cancelled confirmation, aborting action');
              return;
            }
          }

          // Handle input prompt
          let userInput: string | undefined;
          if (desc.prompt) {
            console.log('[ModalGateway] Showing window.prompt:', desc.prompt);
            const input = window.prompt(desc.prompt)?.trim();
            console.log('[ModalGateway] Prompt input:', input);
            // Only proceed if user provided input OR prompt was optional
            if (!input && !desc.prompt.toLowerCase().includes('optional')) {
              console.log('[ModalGateway] User cancelled required prompt, aborting action');
              return; // User cancelled or didn't provide required input
            }
            userInput = input || undefined;
          }

          console.log('[ModalGateway] Calling handleAction with:', {
            entityId: entityId!,
            actionKey: desc.key,
            notes: userInput
          });

          // Call centralized action handler
          await handleAction(entityId!, desc.key, {
            notes: userInput,
            ...desc.payload,
            onSuccess: async () => {
              console.log('[ModalGateway] Action succeeded, key:', desc.key, 'closeOnSuccess:', desc.closeOnSuccess);

              // Refresh active entity data so tabs and actions update in place
              try {
                if (entityType === 'order') {
                  await orderDetails.refresh?.();
                } else if (entityType === 'service') {
                  await serviceDetails.refresh?.();
                } else if (entityType === 'ticket') {
                  await ticketDetails.refresh?.();
                } else if (entityType === 'report' || entityType === 'feedback') {
                  await reportDetails.refresh?.();
                }
                console.log('[ModalGateway] Entity data refreshed after action');
              } catch (e) {
                console.warn('[ModalGateway] refresh after action failed:', e);
              }

              // For lifecycle actions (archive/restore/delete), close modal after brief delay
              // so directory views have time to update
              const isLifecycleAction = ['archive', 'restore', 'delete'].includes(desc.key);
              if (isLifecycleAction && desc.closeOnSuccess !== false) {
                console.log('[ModalGateway] Closing modal after lifecycle action');
                // Small delay to let SWR propagate to directory/archive views
                setTimeout(() => onClose(), 150);
              } else if (desc.closeOnSuccess !== false) {
                // Immediate close for non-lifecycle actions
                console.log('[ModalGateway] Closing modal immediately');
                onClose();
              }
            },
          });
        },
      };
    });
  }, [
    descriptors,
    entityType,
    hasScheduleHandler,
    handleAction,
    entityId,
    onClose,
    productCode,
    modalProductQuantity,
    cartProductQuantity,
    cart,
    data,
    scheduleContext,
    orderDetails.refresh,
    serviceDetails.refresh,
    reportDetails.refresh,
    ticketDetails.refresh,
  ]);

  // ===== STEP 5: Build tabs from adapter and filter via RBAC policy =====
  const visibleTabs = useMemo(() => {
    if (!adapter || !data || !entityType || !entityId) return [];

    // Get tab descriptors from adapter
    const allTabs = adapter.getTabDescriptors({
      role,
      lifecycle,
      entityType,
      entityData: data,
      entityId,
      viewerId: currentUserId,
      hasActions: actions.length > 0,
      openContext: options?.context,
    }, actions);

    // Filter tabs based on RBAC policy
    const hasActions = actions.length > 0;
    console.log('[ModalGateway] Tab filtering context:', {
      role,
      entityType,
      hasActions,
      actionsCount: actions.length,
      lifecycleState: lifecycle.state,
      allTabsCount: allTabs.length,
    });

    const filtered = filterVisibleTabs(allTabs, {
      role,
      lifecycle,
      entityType,
      entityData: data,
      entityId,
      viewerId: currentUserId,
      hasActions,
      openContext: options?.context,
    });

    console.log('[ModalGateway] Visible tabs after filtering:', filtered.map(t => t.id));
    return filtered;
  }, [adapter, role, lifecycle, entityType, data, actions, entityId, currentUserId]);

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

  // Shopping roles that can add products to cart (not admin/warehouse — they manage inventory)
  const isShoppingRole = role !== 'admin' && role !== 'warehouse';
  const productInCart = entityType === 'product' && cartProductQuantity > 0;

  const headerExtras = useMemo(() => {
    if (!adapter || !data || !entityType || !entityId) {
      return null;
    }

    const extras: JSX.Element[] = [];

    // Quantity stepper for product actions (actual add/update button is in ActionBar)
    if (entityType === 'product' && isShoppingRole && lifecycle?.state !== 'archived' && lifecycle?.state !== 'deleted') {
      extras.push(
        <div
          key="product-quantity"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>Quantity</div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              overflow: 'hidden',
              width: 150,
            }}
          >
            <button
              type="button"
              onClick={() => setModalProductQuantity((prev) => clampQuantity(prev - 1))}
              style={{
                width: 34,
                height: 34,
                border: 'none',
                background: '#f9fafb',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
                color: '#111827',
              }}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={modalProductQuantity}
              onChange={(event) => setModalProductQuantity(clampQuantity(Number(event.target.value)))}
              style={{
                width: 82,
                height: 34,
                border: 'none',
                borderLeft: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
              }}
              aria-label="Product quantity"
            />
            <button
              type="button"
              onClick={() => setModalProductQuantity((prev) => clampQuantity(prev + 1))}
              style={{
                width: 34,
                height: 34,
                border: 'none',
                background: '#f9fafb',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
                color: '#111827',
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            {productInCart
              ? `In cart: ${cartProductQuantity}`
              : addedToCart
                ? 'Added to cart'
                : 'Not in cart yet'}
          </div>
        </div>
      );
    }

    // Report/Feedback extras
    if (entityType === 'report' || entityType === 'feedback') {
      extras.push(
        <ReportHeaderExtras
          key="report-extras"
          acknowledgments={data.acknowledgments}
          resolvedBy={data.resolvedBy}
          resolvedAt={data.resolvedAt}
          resolution={data.resolution}
          resolution_notes={data.resolution_notes}
          currentUserId={currentUserId}
        />
      );
    }

    return extras.length > 0 ? <>{extras}</> : null;
  }, [
    adapter,
    data,
    entityType,
    entityId,
    currentUserId,
    isShoppingRole,
    lifecycle,
    productInCart,
    addedToCart,
    cartProductQuantity,
    modalProductQuantity,
  ]);

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

  const headerWorkflowStages = useMemo(() => {
    const stages = (((data as any)?.approvalStages || (data as any)?.metadata?.approvalStages) as any) || undefined;
    if (!stages) {
      return undefined;
    }

    // Restrict workflow visibility for catalog services that originated
    // from manager/warehouse requests: only requester and admins can view.
    if (entityType === 'catalogService') {
      const metadata = (data as any)?.metadata && typeof (data as any).metadata === 'object'
        ? ((data as any).metadata as Record<string, unknown>)
        : {};
      const requestedByRole = String(
        metadata.requestedByRole || metadata.requesterRole || '',
      ).trim().toLowerCase();
      const requestedById = String(
        metadata.requestedById || metadata.requestedBy || metadata.requesterId || '',
      ).trim().toUpperCase();
      const viewerId = (currentUserId || '').trim().toUpperCase();

      const isRequestWorkflow = requestedByRole === 'manager' || requestedByRole === 'warehouse';
      if (isRequestWorkflow) {
        const isAdminViewer = role === 'admin';
        const isRequesterViewer = Boolean(viewerId && requestedById && viewerId === requestedById);
        return isAdminViewer || isRequesterViewer ? stages : undefined;
      }
    }

    return stages;
  }, [data, entityType, currentUserId, role]);

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
    // Smooth loading: show lightweight skeleton tabs while data fetch resolves
    if (isLoading || !data) {
      const skeletonLine = (w: string) => (
        <div style={{
          height: 12,
          width: w,
          background: '#e5e7eb',
          borderRadius: 4,
          margin: '8px 0'
        }} />
      );

      const skeletonSection = (
        <div style={{ padding: 16 }}>
          {skeletonLine('60%')}
          {skeletonLine('90%')}
          {skeletonLine('75%')}
          {skeletonLine('85%')}
          {skeletonLine('50%')}
        </div>
      );

      const skeletonTabs = [
        { id: 'details' as const, label: 'Details', content: skeletonSection },
        { id: 'history' as const, label: 'History', content: skeletonSection },
        { id: 'actions' as const, label: 'Quick Actions', content: skeletonSection },
      ];

      const placeholderHeader = headerConfig || {
        id: entityId || '',
        type: entityType === 'order' ? 'Order' : entityType === 'service' ? 'Service' : undefined,
        status: 'loading',
        fields: [],
      };

      return (
        <EntityModalView
          key={`${entityType}:${entityId}`}
          isOpen={isOpen}
          onClose={onClose}
          entityType={entityType}
          entityId={entityId}
          lifecycle={lifecycle}
          headerConfig={placeholderHeader}
          headerExtras={headerExtras}
          tabs={skeletonTabs}
        />
      );
    }

    // Data ready: render normal modal view
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
        headerExtras={headerExtras}
        headerActions={actions as any}
        headerWorkflowStages={headerWorkflowStages}
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
 
