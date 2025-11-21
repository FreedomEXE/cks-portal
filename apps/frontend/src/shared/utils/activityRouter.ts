/**
 * Activity Click Router
 *
 * Handles navigation when user clicks an activity in the Recent Activity feed.
 * Routes to appropriate tab/modal based on entity type and state (active/archived/deleted).
 *
 * Flow:
 * 1. User clicks activity → calls handleActivityClick()
 * 2. Fetch entity via GET /api/entity/:type/:id?includeDeleted=1
 * 3. Based on entity.state:
 *    - 'active': Navigate to main tab → open modal
 *    - 'archived': Navigate to archive tab → open modal
 *    - 'deleted': Stay on current view → open modal with DeletedBanner
 */

import { fetchJson } from './fetch';

export interface EntityFetchResult {
  entity: any;
  state: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
  deletedBy?: string;
}

export interface ActivityRouterConfig {
  // Tab navigation callbacks
  setActiveTab: (tab: string) => void;
  setOrdersSubTab?: (subTab: 'all' | 'service' | 'product' | 'archive') => void;
  setServicesSubTab?: (subTab: 'my' | 'active' | 'history') => void;

  // Modal state setters
  setSelectedOrder?: (order: any) => void;
  setSelectedService?: (service: any) => void;
  setSelectedUser?: (user: any) => void;
  setSelectedReport?: (report: any) => void;

  // Error handling
  onError: (message: string) => void;

  // Optional: toast notifications
  onSuccess?: (message: string) => void;
}

/**
 * Fetch entity from backend with deleted snapshot support
 */
async function fetchEntityForActivity(
  entityType: string,
  entityId: string
): Promise<EntityFetchResult> {
  // Always request deleted entities (backend will gate based on role)
  const response = await fetchJson<EntityFetchResult>(
    `/api/entity/${entityType}/${entityId}?includeDeleted=1`
  );

  if (!response.ok) {
    throw new Error(response.error?.message || 'Failed to fetch entity');
  }

  return response.data;
}

/**
 * Create activity click handler with navigation hooks
 *
 * Usage:
 * ```tsx
 * const handleActivityClick = createActivityClickHandler({
 *   setActiveTab,
 *   setOrdersSubTab,
 *   setSelectedOrder,
 *   onError: (msg) => toast.error(msg)
 * });
 *
 * <RecentActivity
 *   activities={activities.map(a => ({ ...a, onClick: () => handleActivityClick(a) }))}
 * />
 * ```
 */
export function createActivityClickHandler(config: ActivityRouterConfig) {
  return async (activity: {
    metadata?: {
      targetId?: string;
      targetType?: string;
      [key: string]: any;
    };
  }) => {
    const metadata = activity.metadata ?? {};
    const targetIdOriginal = metadata.targetId;
    const targetTypeOriginal = metadata.targetType;
    const activityType = metadata.activityType;

    let targetId = targetIdOriginal;
    let targetType = targetTypeOriginal;

    if (activityType === 'service_crew_requested') {
      const orderId = metadata.orderId || metadata.serviceOrderId || metadata.service_id || metadata.order_id;
      const serviceId = metadata.serviceId || metadata.service_id;
      if (orderId) {
        targetId = orderId;
        targetType = 'order';
      } else if (
        serviceId &&
        (!targetTypeOriginal || targetTypeOriginal === 'crew')
      ) {
        targetId = serviceId;
        targetType = 'service';
      }
    }

    if (!targetId || !targetType) {
      config.onError('Cannot open: missing target information');
      return;
    }

    try {
      const result = await fetchEntityForActivity(targetType, targetId);

      // Route based on entity type
      switch (targetType) {
        case 'order':
          routeOrder(result, config);
          break;
        case 'service':
          routeService(result, config);
          break;
        case 'manager':
        case 'contractor':
        case 'customer':
        case 'center':
        case 'crew':
        case 'warehouse':
          routeUser(result, config);
          break;
        case 'report':
        case 'feedback':
          routeReport(result, config);
          break;
        default:
          config.onError(`Unknown entity type: ${targetType}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load entity';

      // Handle 403 gracefully (entity not in scope or deleted without permission)
      if (message.includes('403') || message.includes('Forbidden')) {
        config.onError('You do not have permission to view this entity');
      } else if (message.includes('404')) {
        config.onError('Entity not found');
      } else {
        config.onError(message);
      }
    }
  };
}

/**
 * Route order entity based on state
 */
function routeOrder(result: EntityFetchResult, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  if (state === 'deleted') {
    // Deleted: Open modal immediately with tombstone banner
    if (config.setSelectedOrder) {
      config.setSelectedOrder({
        ...entity,
        isDeleted: true,
        deletedAt,
        deletedBy,
      });
    }
    return;
  }

  // Navigate to Orders tab
  config.setActiveTab('orders');

  if (state === 'archived') {
    // Archived: Navigate to archive sub-tab
    if (config.setOrdersSubTab) {
      config.setOrdersSubTab('archive');
    }

    // Open modal after tab switch
    setTimeout(() => {
      if (config.setSelectedOrder) {
        config.setSelectedOrder({
          ...entity,
          isArchived: true,
        });
      }
    }, 150);
  } else {
    // Active: Navigate to appropriate sub-tab based on order type
    if (config.setOrdersSubTab) {
      const orderType = entity.order_type || entity.orderType;
      if (orderType === 'service') {
        config.setOrdersSubTab('service');
      } else if (orderType === 'product') {
        config.setOrdersSubTab('product');
      } else {
        config.setOrdersSubTab('all');
      }
    }

    // Open modal after tab switch
    setTimeout(() => {
      if (config.setSelectedOrder) {
        config.setSelectedOrder(entity);
      }
    }, 150);
  }
}

/**
 * Route service entity based on state
 */
function routeService(result: EntityFetchResult, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  if (state === 'deleted') {
    // Deleted: Open modal immediately with tombstone banner
    if (config.setSelectedService) {
      config.setSelectedService({
        ...entity,
        isDeleted: true,
        deletedAt,
        deletedBy,
      });
    }
    return;
  }

  // Navigate to Services tab
  config.setActiveTab('services');

  if (state === 'archived') {
    // Archived services might show in history tab
    if (config.setServicesSubTab) {
      config.setServicesSubTab('history');
    }

    setTimeout(() => {
      if (config.setSelectedService) {
        config.setSelectedService({
          ...entity,
          isArchived: true,
        });
      }
    }, 150);
  } else {
    // Active service
    if (config.setServicesSubTab) {
      config.setServicesSubTab('active');
    }

    setTimeout(() => {
      if (config.setSelectedService) {
        config.setSelectedService(entity);
      }
    }, 150);
  }
}

/**
 * Route user entity (manager, contractor, etc.) based on state
 */
function routeUser(result: EntityFetchResult, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  // User entities typically just open modals without tab navigation
  // (Users are shown in ecosystem tree, not in separate tabs)
  if (config.setSelectedUser) {
    config.setSelectedUser({
      ...entity,
      isDeleted: state === 'deleted',
      isArchived: state === 'archived',
      deletedAt,
      deletedBy,
    });
  }
}

/**
 * Route report/feedback entity based on state
 */
function routeReport(result: EntityFetchResult, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  if (state === 'deleted') {
    // Deleted: Open modal immediately with tombstone banner
    if (config.setSelectedReport) {
      config.setSelectedReport({
        ...entity,
        isDeleted: true,
        deletedAt,
        deletedBy,
      });
    }
    return;
  }

  // Navigate to Reports tab
  config.setActiveTab('reports');

  // Open modal after tab switch
  setTimeout(() => {
    if (config.setSelectedReport) {
      config.setSelectedReport({
        ...entity,
        isArchived: state === 'archived',
      });
    }
  }, 150);
}
