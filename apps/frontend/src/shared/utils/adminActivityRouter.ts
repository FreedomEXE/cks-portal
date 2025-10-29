/**
 * AdminHub Activity Click Router
 *
 * Handles navigation for AdminHub's unique directory-based structure.
 * All entities route through the "directory" tab with appropriate sub-tabs.
 *
 * Flow:
 * 1. User clicks activity → calls handler
 * 2. Fetch entity via GET /api/entity/:type/:id?includeDeleted=1
 * 3. Navigate to directory → sub-tab → open modal
 */

import { fetchJson } from './fetch';
import type { EntityFetchResult } from './activityRouter';

/**
 * Activity Router Mapping for AdminHub
 * Maps entity types to their directory tabs and modal handlers
 */
interface AdminActivityRoute {
  directoryTab: string;
  nestedSubTab?: string;
  modalType: 'order' | 'service' | 'user' | 'report' | 'product';
}

const ADMIN_ACTIVITY_ROUTES: Record<string, AdminActivityRoute> = {
  order: {
    directoryTab: 'orders',
    // nestedSubTab determined by orderType at runtime
    modalType: 'order',
  },
  service: {
    directoryTab: 'services',
    nestedSubTab: 'catalog-services', // Default to catalog
    modalType: 'service',
  },
  manager: {
    directoryTab: 'managers',
    modalType: 'user',
  },
  contractor: {
    directoryTab: 'contractors',
    modalType: 'user',
  },
  customer: {
    directoryTab: 'customers',
    modalType: 'user',
  },
  center: {
    directoryTab: 'centers',
    modalType: 'user',
  },
  crew: {
    directoryTab: 'crew',
    modalType: 'user',
  },
  warehouse: {
    directoryTab: 'warehouses',
    modalType: 'user',
  },
  report: {
    directoryTab: 'reports',
    nestedSubTab: 'reports',
    modalType: 'report',
  },
  feedback: {
    directoryTab: 'reports',
    nestedSubTab: 'feedback',
    modalType: 'report',
  },
  // NEW: Products route mapping (entityType => route)
  product: {
    directoryTab: 'products',
    modalType: 'product',
  },
};

export interface AdminActivityRouterConfig {
  // Tab navigation
  setActiveTab: (tab: string) => void;
  setDirectoryTab: (tab: string) => void;
  setOrdersSubTab: (subTab: string) => void;
  setServicesSubTab: (subTab: string) => void;
  setReportsSubTab: (subTab: string) => void;

  // Current tab states (for idempotent updates)
  activeTab: string;
  directoryTab: string;
  ordersSubTab: string;
  servicesSubTab: string;
  reportsSubTab: string;

  // Modal state setters
  setSelectedOrderForDetails: (order: any) => void;
  setSelectedServiceCatalog: (service: any) => void;
  setShowServiceCatalogModal: (show: boolean) => void;
  setSelectedEntity: (entity: any) => void;
  setShowActionModal: (show: boolean) => void;
  setSelectedReportForDetails: (report: any) => void;

  // NEW: Universal modal opener from ModalProvider
  openEntityModal: (entityType: string, entityId: string, options?: any) => void;

  // Error handling
  onError: (message: string) => void;

  // Optional: User role for includeDeleted param
  userRole?: string;
}

/**
 * Fetch entity from backend with deleted snapshot support
 * Only includes deleted for admin users
 */
async function fetchEntityForActivity(
  entityType: string,
  entityId: string,
  userRole?: string
): Promise<EntityFetchResult> {
  // Only admins can request deleted snapshots
  const includeDeleted = userRole === 'admin' ? '?includeDeleted=1' : '';
  const response = await fetchJson<EntityFetchResult>(
    `/api/entity/${entityType}/${entityId}${includeDeleted}`
  );

  if (!response.ok) {
    throw new Error(response.error?.message || 'Failed to fetch entity');
  }

  return response.data;
}

/**
 * Create AdminHub-specific activity click handler
 *
 * Usage:
 * ```tsx
 * const handleActivityClick = createAdminActivityClickHandler({
 *   setActiveTab,
 *   setDirectoryTab,
 *   setOrdersSubTab,
 *   setServicesSubTab,
 *   setReportsSubTab,
 *   activeTab,
 *   directoryTab,
 *   ordersSubTab,
 *   servicesSubTab,
 *   reportsSubTab,
 *   setSelectedOrderForDetails,
 *   setSelectedServiceCatalog,
 *   setShowServiceCatalogModal,
 *   setSelectedEntity,
 *   setShowActionModal,
 *   setSelectedReportForDetails,
 *   onError: (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); },
 *   userRole: 'admin'
 * });
 * ```
 */
export function createAdminActivityClickHandler(config: AdminActivityRouterConfig) {
  return async (activity: {
    metadata?: {
      targetId?: string;
      targetType?: string;
      orderType?: string;
      [key: string]: any;
    };
  }) => {
    const targetId = activity.metadata?.targetId;
    const targetType = activity.metadata?.targetType;

    // Guard: Missing target information
    if (!targetId || !targetType) {
      config.onError('Cannot open: missing target information');
      return;
    }

    // Check if we have a route for this entity type
    const route = ADMIN_ACTIVITY_ROUTES[targetType];
    if (!route) {
      config.onError(`Unknown entity type: ${targetType}`);
      return;
    }

    try {
      // Fetch entity with deleted snapshot support (admin only)
      const result = await fetchEntityForActivity(targetType, targetId, config.userRole);
      const { entity, state, deletedAt, deletedBy } = result;

      // Navigate to appropriate tabs (idempotent - only set if different)
      if (config.activeTab !== 'directory') {
        config.setActiveTab('directory');
      }
      if (config.directoryTab !== route.directoryTab) {
        config.setDirectoryTab(route.directoryTab);
      }

      // Handle nested sub-tabs
      if (route.directoryTab === 'orders') {
        // Determine product vs service from orderType or metadata
        const orderType = entity.order_type || entity.orderType || activity.metadata?.orderType || 'product';
        const targetSubTab = orderType === 'service' ? 'service-orders' : 'product-orders';
        if (config.ordersSubTab !== targetSubTab) {
          config.setOrdersSubTab(targetSubTab);
        }
      } else if (route.directoryTab === 'services' && route.nestedSubTab) {
        if (config.servicesSubTab !== route.nestedSubTab) {
          config.setServicesSubTab(route.nestedSubTab);
        }
      } else if (route.directoryTab === 'reports' && route.nestedSubTab) {
        if (config.reportsSubTab !== route.nestedSubTab) {
          config.setReportsSubTab(route.nestedSubTab);
        }
      }

      // Open appropriate modal based on type
      // Add slight delay to allow tab transitions
      setTimeout(() => {
        if (route.modalType === 'order') {
          config.setSelectedOrderForDetails({
            ...entity,
            isDeleted: state === 'deleted',
            deletedAt,
            deletedBy,
          });
        } else if (route.modalType === 'report') {
          config.setSelectedReportForDetails({
            ...entity,
            isDeleted: state === 'deleted',
            deletedAt,
            deletedBy,
            _entityType: targetType,
          });
        } else if (route.modalType === 'service') {
          config.setSelectedServiceCatalog({
            serviceId: entity.id || targetId,
            name: entity.name ?? null,
            category: entity.category ?? null,
            status: entity.status ?? null,
            description: entity.description ?? null,
            metadata: entity.metadata ?? null,
          });
          config.setShowServiceCatalogModal(true);
        } else if (route.modalType === 'user') {
          // For user entities, open the action modal
          config.setSelectedEntity({
            ...entity,
            isDeleted: state === 'deleted',
            deletedAt,
            deletedBy,
          });
          config.setShowActionModal(true);
        } else if (route.modalType === 'product') {
          // Use universal modal for products
          const options = state === 'deleted' ? { isDeleted: true, deletedAt, deletedBy } : undefined;
          // targetId is guaranteed earlier, but fall back to entity.id
          const id = (entity && (entity.productId || entity.id)) || targetId;
          if (!id) {
            config.onError('Cannot identify product from activity');
            return;
          }
          config.openEntityModal('product', id, options);
        }
      }, 150);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load entity';

      // Handle 403/404 gracefully
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
