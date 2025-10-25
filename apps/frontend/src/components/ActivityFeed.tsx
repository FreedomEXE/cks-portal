/**
 * ActivityFeed - Smart Modal-Based Activity UX
 *
 * Handles activity clicks internally with zero hub code required.
 * User stays in Recent Activity section, modals open in place.
 *
 * Philosophy: ActivityFeed is self-contained and smart.
 * Hubs only pass modal setters.
 *
 * Usage:
 * ```tsx
 * <ActivityFeed
 *   activities={activities}
 *   hub="admin"
 *   onOpenOrderModal={setSelectedOrderForDetails}
 *   onError={setToast}
 * />
 * ```
 */

import { RecentActivity, type Activity } from '@cks/domain-widgets';
import { useCallback, useMemo } from 'react';
import { fetchOrderForActivity, parseActivityError } from '../shared/utils/activityHelpers';
import { useModals } from '../contexts/ModalProvider';
import { isFeatureEnabled } from '../config/featureFlags';

export interface ActivityFeedProps {
  activities: Activity[];
  hub?: 'admin' | 'manager' | 'center' | 'contractor' | 'customer' | 'crew' | 'warehouse';
  viewerId?: string; // Current user's CKS code for viewer-relative clicks
  isLoading?: boolean;
  error?: Error | null;
  onClearActivity?: (activityId: string) => void;
  onClearAll?: () => void;
  onOpenOrderActions?: (data: { entity: any; state: string; deletedAt?: string; deletedBy?: string }) => void;
  onOpenOrderModal?: (order: any) => void;
  onOpenServiceModal?: (service: any) => void;
  onOpenReportModal?: (report: any) => void;
  onOpenActionableOrder?: (order: any) => void;
  onError?: (message: string) => void;
}

/**
 * ActivityFeed Component
 * Smart component that handles all activity click logic internally
 */
export function ActivityFeed({
  activities,
  viewerId,
  isLoading = false,
  error = null,
  onClearActivity,
  onClearAll,
  onOpenOrderActions,
  onOpenOrderModal,
  onOpenServiceModal,
  onOpenReportModal,
  onOpenActionableOrder,
  onError,
}: ActivityFeedProps) {
  const modals = useModals();

  const handleActivityClick = useCallback(
    async (activity: Activity) => {
      // 🔍 DEBUG: Log everything at click time
      console.log('[ActivityFeed CLICK DEBUG]', {
        viewerId,
        activityType: activity.metadata?.activityType,
        category: activity.metadata?.category,
        keys: Object.keys(activity.metadata || {}),
        actorId: activity.metadata?.crewId,        // for crew_assigned_to_center
        targetEntityId: activity.metadata?.centerId,
        targetType: activity.metadata?.targetType,
        targetId: activity.metadata?.targetId,
      });

      const { targetType, targetId } = activity.metadata || {};

      // Guard: Missing target information
      if (!targetType || !targetId) {
        onError?.('Cannot open: missing target information');
        return;
      }

      // Handle order activities
      if (targetType === 'order') {
        // Phase 2: ID-first modal opening (with feature flag)
        if (isFeatureEnabled('ID_FIRST_MODALS')) {
          console.log('[ActivityFeed] Phase 2: Opening order via openById():', targetId);
          modals.openById(targetId);
          return;
        }

        // Legacy path (backwards compatibility)
        try {
          // Fetch order with state detection
          const result = await fetchOrderForActivity(targetId);
          const { entity, state, deletedAt, deletedBy } = result;

          if (state === 'deleted') {
            // Deleted orders: Go straight to OrderDetailsModal with banner
            if (!onOpenOrderModal) {
              console.warn('[ActivityFeed] onOpenOrderModal not provided, ignoring deleted order click');
              return;
            }

            const orderData = {
              ...entity,
              isDeleted: true,
              deletedAt,
              deletedBy,
            };

            console.log('[ActivityFeed] Opening deleted order modal:', { orderId: targetId });
            onOpenOrderModal(orderData);
          } else {
            // Admin pattern (if provided): delegate to onOpenOrderActions
            if (onOpenOrderActions) {
              console.log('[ActivityFeed] Admin order actions:', { orderId: targetId, state });
              onOpenOrderActions({ entity, state, deletedAt, deletedBy });
              return;
            }

            // Non-admin pattern: If order has actions, open OrderActionModal; else open OrderDetailsModal
            const hasActions = Array.isArray((entity as any)?.availableActions) && (entity as any).availableActions.length > 0;

            if (hasActions && onOpenActionableOrder) {
              console.log('[ActivityFeed] Opening actionable order modal:', { orderId: targetId });
              onOpenActionableOrder(entity);
              return;
            }

            if (onOpenOrderModal) {
              console.log('[ActivityFeed] Opening order details (view-only):', { orderId: targetId });
              onOpenOrderModal(entity);
            } else {
              console.warn('[ActivityFeed] onOpenOrderModal not provided, cannot open order');
            }
          }
        } catch (error) {
          const message = parseActivityError(error);
          console.error('[ActivityFeed] Failed to fetch order:', error);
          onError?.(message);
        }
        return;
      }

      // Handle service activities
      if (targetType === 'service') {
        // Phase 3: ID-first modal opening (requires BOTH flags)
        // Only proceed if backend /services/:serviceId/details endpoint is ready
        if (isFeatureEnabled('ID_FIRST_MODALS') && isFeatureEnabled('SERVICE_DETAIL_FETCH')) {
          console.log('[ActivityFeed] Phase 3: Opening service via openById():', targetId);
          modals.openById(targetId);
          return;
        }

        // Legacy path (or gated until backend ready)
        if (!onOpenServiceModal) {
          console.warn('[ActivityFeed] Service modals not yet available');
          onError?.('Service activities not yet implemented');
          return;
        }
        // TODO: Implement legacy service fetching if needed
        onError?.('Service activities not yet implemented');
        return;
      }

      // Handle report and feedback activities
      if (targetType === 'report' || targetType === 'feedback') {
        // Phase 2: ID-first modal opening (with feature flag)
        if (isFeatureEnabled('ID_FIRST_MODALS')) {
          console.log('[ActivityFeed] Phase 2: Opening via openById():', targetId);
          modals.openById(targetId);
        } else {
          // Legacy path (backwards compatibility) - use openEntityModal directly
          modals.openEntityModal(targetType, targetId, { context: { reportType: targetType } });
        }
        return;
      }

      // Handle assignment activities with viewer-relative clicks
      const activityType = activity.metadata?.activityType || activity.metadata?.category;
      const assignmentTypes = [
        'crew_assigned_to_center',
        'contractor_assigned_to_manager',
        'customer_assigned_to_contractor',
        'center_assigned_to_customer',
        'order_assigned_to_warehouse'
      ];

      if (activityType && assignmentTypes.includes(activityType) && viewerId) {
        const metadata = activity.metadata;

        // Extract actor ID (the entity being assigned) and target ID (the recipient)
        let actorId: string | undefined;
        let targetEntityId: string | undefined;

        switch (activityType) {
          case 'crew_assigned_to_center':
            actorId = metadata?.crewId as string;
            targetEntityId = metadata?.centerId as string;
            break;
          case 'contractor_assigned_to_manager':
            actorId = metadata?.contractorId as string;
            targetEntityId = metadata?.managerId as string;
            break;
          case 'customer_assigned_to_contractor':
            actorId = metadata?.customerId as string;
            targetEntityId = metadata?.contractorId as string;
            break;
          case 'center_assigned_to_customer':
            actorId = metadata?.centerId as string;
            targetEntityId = metadata?.customerId as string;
            break;
          case 'order_assigned_to_warehouse':
            actorId = targetId; // Order ID
            targetEntityId = metadata?.warehouseId as string;
            break;
        }

        // Viewer-relative click logic
        const normalizedViewerId = viewerId?.toUpperCase();
        const normalizedActorId = actorId?.toUpperCase();
        const normalizedTargetId = targetEntityId?.toUpperCase();

        if (normalizedViewerId === normalizedActorId) {
          // Actor viewing: "You have been assigned to..." → Open target entity
          console.log('[ActivityFeed] Assignment: Actor viewing, opening target:', targetEntityId);
          modals.openById(targetEntityId!);
        } else if (normalizedViewerId === normalizedTargetId) {
          // Target viewing: "X has been assigned to you!" → Open actor entity
          console.log('[ActivityFeed] Assignment: Target viewing, opening actor:', actorId);
          modals.openById(actorId!);
        } else {
          // Admin/others: Default to opening target entity (recipient)
          console.log('[ActivityFeed] Assignment: Admin viewing, opening target:', targetEntityId);
          modals.openById(targetEntityId!);
        }

        return;
      }

      // Handle user activities (manager, contractor, customer, center, crew, warehouse)
      const userTypes = ['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];
      if (userTypes.includes(targetType)) {
        console.log('[ActivityFeed] Opening user modal via openById():', { targetType, targetId });
        // openById() will:
        // 1. Parse ID to get concrete type (MGR-012 → manager)
        // 2. Fetch fresh from /api/profile/manager/MGR-012
        // 3. Pass data to modal (no stale directory cache!)
        modals.openById(targetId);
        return;
      }

      // Handle other entity types (future implementation)
      console.warn('[ActivityFeed] Unsupported entity type:', targetType);
      onError?.(`Cannot open ${targetType} entities yet`);
    },
    [onOpenOrderActions, onOpenOrderModal, onOpenServiceModal, onOpenActionableOrder, onError, modals, viewerId]
  );

  // Map activities with onClick and onClear handlers
  const activitiesWithHandlers = useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        onClick: () => handleActivityClick(activity),
        onClear: onClearActivity ? () => {
          console.log('[ActivityFeed] Clearing activity:', activity.id);
          onClearActivity(activity.id);
        } : undefined,
      })),
    [activities, handleActivityClick, onClearActivity]
  );

  return (
    <RecentActivity
      activities={activitiesWithHandlers}
      isLoading={isLoading}
      error={error}
      onClearAll={onClearAll}
      emptyMessage={
        error
          ? 'Failed to load activity feed.'
          : isLoading
            ? 'Loading recent activity...'
            : 'No recent activity yet.'
      }
    />
  );
}
