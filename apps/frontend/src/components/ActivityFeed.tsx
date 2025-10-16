/**
 * ActivityFeed - Callback-Based Activity Navigation
 *
 * Wraps RecentActivity with routing logic for all hub types.
 * Keeps @cks/domain-widgets presentational and hubs thin.
 *
 * Usage:
 * ```tsx
 * <ActivityFeed
 *   activities={activities}
 *   hub="admin"
 *   onActivityClick={handleActivityClick}
 * />
 * ```
 */

import { RecentActivity, type Activity } from '@cks/domain-widgets';
import { useCallback, useMemo } from 'react';

export interface ActivityClickData {
  targetType: string;
  targetId: string;
  orderType?: string;
  activity: Activity;
}

export interface ActivityFeedProps {
  activities: Activity[];
  hub: 'admin' | 'manager' | 'center' | 'contractor' | 'customer' | 'crew' | 'warehouse';
  isLoading?: boolean;
  error?: Error | null;
  onClear?: () => void;
  onActivityClick?: (data: ActivityClickData) => void;
  onError?: (message: string) => void;
}

// Removed URL_BUILDERS - now using callback pattern instead

/**
 * ActivityFeed Component
 * Wraps RecentActivity with callback-based navigation
 */
export function ActivityFeed({
  activities,
  hub,
  isLoading = false,
  error = null,
  onClear,
  onActivityClick,
  onError,
}: ActivityFeedProps) {
  const handleActivityClick = useCallback(
    (activity: Activity) => {
      console.log('[ActivityFeed] Activity clicked:', activity);
      const { targetType, targetId, orderType } = activity.metadata || {};

      // Guard: Missing target information
      if (!targetType || !targetId) {
        console.error('[ActivityFeed] Missing target info:', { targetType, targetId });
        onError?.('Cannot open: missing target information');
        return;
      }

      // Call hub's callback with parsed data
      onActivityClick?.({
        targetType,
        targetId,
        orderType,
        activity,
      });
    },
    [onActivityClick, onError]
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
