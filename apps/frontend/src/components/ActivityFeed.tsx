/**
 * ActivityFeed - URL-Driven Activity Navigation
 *
 * Wraps RecentActivity with routing logic for all hub types.
 * Keeps @cks/domain-widgets presentational and hubs thin.
 *
 * Usage:
 * ```tsx
 * <ActivityFeed activities={activities} hub="admin" />
 * ```
 */

import { RecentActivity, type Activity } from '@cks/domain-widgets';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface ActivityFeedProps {
  activities: Activity[];
  hub: 'admin' | 'manager' | 'center' | 'contractor' | 'customer' | 'crew' | 'warehouse';
  isLoading?: boolean;
  error?: Error | null;
  onClear?: () => void;
  onError?: (message: string) => void;
}

/**
 * Build URL for activity click based on hub type
 */
type ActivityUrlBuilder = (activity: Activity) => string | null;

const URL_BUILDERS: Record<string, ActivityUrlBuilder> = {
  admin: (activity) => {
    const { targetType, targetId, orderType } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'order': {
        const subTab = orderType === 'service' ? 'service-orders' : 'product-orders';
        return `?tab=directory&dirTab=orders&subTab=${subTab}&modal=order&id=${targetId}&entityType=${targetType}`;
      }
      case 'service':
        return `?tab=directory&dirTab=services&subTab=catalog-services&modal=service&id=${targetId}&entityType=${targetType}`;
      case 'manager':
        return `?tab=directory&dirTab=managers&modal=user&id=${targetId}&entityType=${targetType}`;
      case 'contractor':
        return `?tab=directory&dirTab=contractors&modal=user&id=${targetId}&entityType=${targetType}`;
      case 'customer':
        return `?tab=directory&dirTab=customers&modal=user&id=${targetId}&entityType=${targetType}`;
      case 'center':
        return `?tab=directory&dirTab=centers&modal=user&id=${targetId}&entityType=${targetType}`;
      case 'crew':
        return `?tab=directory&dirTab=crew&modal=user&id=${targetId}&entityType=${targetType}`;
      case 'warehouse':
        return `?tab=directory&dirTab=warehouses&modal=user&id=${targetId}&entityType=${targetType}`;
      case 'report':
        return `?tab=directory&dirTab=reports&subTab=reports&modal=report&id=${targetId}&entityType=${targetType}`;
      case 'feedback':
        return `?tab=directory&dirTab=reports&subTab=feedback&modal=report&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },

  manager: (activity) => {
    const { targetType, targetId, orderType } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'order': {
        const subTab = orderType === 'service' ? 'service' : 'product';
        return `?tab=orders&subTab=${subTab}&modal=order&id=${targetId}&entityType=${targetType}`;
      }
      case 'service':
        return `?tab=services&subTab=active&modal=service&id=${targetId}&entityType=${targetType}`;
      case 'report':
        return `?tab=reports&modal=report&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },

  center: (activity) => {
    const { targetType, targetId, orderType } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'order': {
        const subTab = orderType === 'service' ? 'service' : 'product';
        return `?tab=orders&subTab=${subTab}&modal=order&id=${targetId}&entityType=${targetType}`;
      }
      case 'service':
        return `?tab=services&subTab=active&modal=service&id=${targetId}&entityType=${targetType}`;
      case 'report':
        return `?tab=reports&modal=report&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },

  contractor: (activity) => {
    const { targetType, targetId, orderType } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'order': {
        const subTab = orderType === 'service' ? 'service' : 'product';
        return `?tab=orders&subTab=${subTab}&modal=order&id=${targetId}&entityType=${targetType}`;
      }
      case 'service':
        return `?tab=services&subTab=active&modal=service&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },

  customer: (activity) => {
    const { targetType, targetId, orderType } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'order': {
        const subTab = orderType === 'service' ? 'service' : 'product';
        return `?tab=orders&subTab=${subTab}&modal=order&id=${targetId}&entityType=${targetType}`;
      }
      case 'service':
        return `?tab=services&subTab=active&modal=service&id=${targetId}&entityType=${targetType}`;
      case 'report':
        return `?tab=reports&modal=report&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },

  crew: (activity) => {
    const { targetType, targetId } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'service':
        return `?tab=services&subTab=assigned&modal=service&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },

  warehouse: (activity) => {
    const { targetType, targetId, orderType } = activity.metadata || {};

    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'order': {
        const subTab = orderType === 'service' ? 'service' : 'product';
        return `?tab=orders&subTab=${subTab}&modal=order&id=${targetId}&entityType=${targetType}`;
      }
      case 'service':
        return `?tab=services&subTab=active&modal=service&id=${targetId}&entityType=${targetType}`;
      default:
        return null;
    }
  },
};

/**
 * ActivityFeed Component
 * Wraps RecentActivity with URL-driven navigation
 */
export function ActivityFeed({
  activities,
  hub,
  isLoading = false,
  error = null,
  onClear,
  onError,
}: ActivityFeedProps) {
  const navigate = useNavigate();

  const handleActivityClick = useCallback(
    (activity: Activity) => {
      const { targetType, targetId } = activity.metadata || {};

      // Guard: Missing target information
      if (!targetType || !targetId) {
        onError?.('Cannot open: missing target information');
        return;
      }

      // Build URL for this hub
      const buildUrl = URL_BUILDERS[hub];
      if (!buildUrl) {
        console.error(`[ActivityFeed] Unknown hub type: ${hub}`);
        onError?.(`Unknown hub type: ${hub}`);
        return;
      }

      const url = buildUrl(activity);
      if (!url) {
        console.warn(`[ActivityFeed] Could not build URL for activity:`, activity);
        onError?.(`Cannot open ${targetType} (unsupported entity type)`);
        return;
      }

      // Navigate to URL
      console.log(`[ActivityFeed] Navigating to: ${url}`);
      navigate(url);
    },
    [hub, navigate, onError]
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
