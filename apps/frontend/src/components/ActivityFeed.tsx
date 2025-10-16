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

export interface ActivityFeedProps {
  activities: Activity[];
  hub?: 'admin' | 'manager' | 'center' | 'contractor' | 'customer' | 'crew' | 'warehouse';
  isLoading?: boolean;
  error?: Error | null;
  onClear?: () => void;
  onOpenOrderActions?: (data: { entity: any; state: string; deletedAt?: string; deletedBy?: string }) => void;
  onOpenOrderModal?: (order: any) => void;
  onOpenServiceModal?: (service: any) => void;
  onError?: (message: string) => void;
}

/**
 * ActivityFeed Component
 * Smart component that handles all activity click logic internally
 */
export function ActivityFeed({
  activities,
  isLoading = false,
  error = null,
  onClear,
  onOpenOrderActions,
  onOpenOrderModal,
  onOpenServiceModal,
  onError,
}: ActivityFeedProps) {
  const handleActivityClick = useCallback(
    async (activity: Activity) => {
      console.log('[ActivityFeed] Activity clicked:', activity);
      const { targetType, targetId } = activity.metadata || {};

      // Guard: Missing target information
      if (!targetType || !targetId) {
        console.error('[ActivityFeed] Missing target info:', { targetType, targetId });
        onError?.('Cannot open: missing target information');
        return;
      }

      // Handle order activities
      if (targetType === 'order') {
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
            // Active or Archived orders: Open ActionModal first
            if (!onOpenOrderActions) {
              console.warn('[ActivityFeed] onOpenOrderActions not provided, ignoring order click');
              return;
            }

            console.log('[ActivityFeed] Opening order actions:', { orderId: targetId, state });
            onOpenOrderActions({
              entity,
              state,
              deletedAt,
              deletedBy,
            });
          }
        } catch (error) {
          const message = parseActivityError(error);
          console.error('[ActivityFeed] Failed to fetch order:', error);
          onError?.(message);
        }
        return;
      }

      // Handle service activities (future implementation)
      if (targetType === 'service') {
        if (!onOpenServiceModal) {
          console.warn('[ActivityFeed] onOpenServiceModal not provided, ignoring click');
          return;
        }
        // TODO: Implement service fetching
        onError?.('Service activities not yet implemented');
        return;
      }

      // Handle other entity types (future implementation)
      console.warn('[ActivityFeed] Unsupported entity type:', targetType);
      onError?.(`Cannot open ${targetType} entities yet`);
    },
    [onOpenOrderActions, onOpenOrderModal, onOpenServiceModal, onError]
  );

  // Map activities with onClick handlers
  const activitiesWithHandlers = useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        onClick: () => handleActivityClick(activity),
      })),
    [activities, handleActivityClick]
  );

  return (
    <RecentActivity
      activities={activitiesWithHandlers}
      isLoading={isLoading}
      error={error}
      onClear={onClear}
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
