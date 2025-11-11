import { useMemo } from 'react';
import type { Activity } from '@cks/domain-widgets';
import { useHubActivities, type HubActivityItem } from '../api/hub';

export type UseFormattedActivitiesOptions = {
  limit?: number;
  categories?: string[]; // optional allowlist of backend categories
};

// Category to activity type mapping table (legacy/keyword-based)
const ACTIVITY_TYPE_MAP: Record<string, Activity['type']> = {
  // Success states
  delivered: 'success',
  completed: 'success',
  accepted: 'success',
  approved: 'success',
  verified: 'success',
  // Warning/error states
  rejected: 'warning',
  cancelled: 'warning',
  failed: 'warning',
  denied: 'warning',
  error: 'warning',
  // Action states
  assigned: 'action',
  assignment: 'action',
  created: 'action',
  updated: 'action',
  order: 'action',
  service: 'action',
  started: 'action',  // delivery_started, service_started
  delivery: 'action',
};

function toActivityType(category?: string | null): Activity['type'] {
  if (!category) return 'info';

  const normalized = category.toLowerCase().trim();

  // Primary: trust backend-provided semantic categories when present
  if (normalized === 'success' || normalized === 'warning' || normalized === 'action' || normalized === 'info') {
    return normalized as Activity['type'];
  }

  // Fallbacks: derive from legacy/raw values
  if (ACTIVITY_TYPE_MAP[normalized]) {
    return ACTIVITY_TYPE_MAP[normalized];
  }
  for (const [keyword, type] of Object.entries(ACTIVITY_TYPE_MAP)) {
    if (normalized.includes(keyword)) {
      return type;
    }
  }
  return 'info';
}

function formatRoleLabel(role?: string | null): string {
  if (!role) return 'System';

  const normalized = role.toLowerCase().trim();

  // Map backend roles to display names
  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    contractor: 'Contractor',
    customer: 'Customer',
    center: 'Center',
    crew: 'Crew',
    warehouse: 'Warehouse',
    system: 'System',
  };

  return roleLabels[normalized] || 'System';
}

/**
 * Personalizes activity messages based on viewer's perspective
 *
 * @param item - The activity item from backend
 * @param viewerId - Current user's CKS code (uppercase)
 * @returns Personalized message or original description
 */
function personalizeMessage(item: HubActivityItem, viewerId?: string | null): string {
  if (!viewerId || !item.activityType) {
    return item.description;
  }

  const normalizedViewerId = viewerId.toUpperCase();
  const metadata = item.metadata || {};
  const activityType = item.activityType;
  const actorIdUC = item.actorId ? item.actorId.toUpperCase() : undefined;
  const actorRole = (item.actorRole || '').toLowerCase();
  const isActor = actorIdUC === normalizedViewerId;

  // Order flow activities
  if (activityType === 'order_created') {
    const orderType = String((metadata.orderType as string | undefined) || '').toLowerCase();
    const isService = orderType === 'service';
    if (isActor) return isService ? 'You created a service order!' : 'You created a product order!';
    // Hide order ID for non-actors
    return isService ? 'Created Service Order' : 'Created Product Order';
  }

  if (activityType === 'order_assigned' || activityType === 'order_assigned_to_warehouse') {
    const whId = (metadata.warehouseId as string | undefined)?.toUpperCase();
    if (whId === normalizedViewerId) return 'You have been assigned a new order';
    return 'Warehouse assigned to order';
  }

  if (activityType === 'order_accepted') {
    if (isActor && actorRole === 'warehouse') return 'You accepted an order';
    return 'Warehouse accepted the order';
  }

  if (activityType === 'delivery_started') {
    if (isActor && actorRole === 'warehouse') return 'You started delivery';
    return 'Delivery started';
  }

  if (activityType === 'delivery_completed' || activityType === 'order_delivered' || activityType === 'order_completed') {
    if (isActor && actorRole === 'warehouse') return 'You completed delivery';
    return 'Delivery completed';
  }

  if (activityType === 'delivery_cancelled') {
    if (isActor && actorRole === 'warehouse') return 'You cancelled the delivery';
    return 'Delivery cancelled';
  }

  if (activityType === 'order_cancelled') {
    if (isActor) return 'You cancelled the order';
    return 'Order cancelled';
  }

  // Assignment activities: {entity}_assigned_to_{target}
  if (activityType === 'crew_assigned_to_center') {
    const crewId = metadata.crewId as string | undefined;
    const centerId = (metadata as any).centerId as string | undefined;

    if (crewId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a center!`;
    }
    if (centerId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned a crew member!`;
    }
  }

  if (activityType === 'contractor_assigned_to_manager') {
    const contractorId = metadata.contractorId as string | undefined;
    const managerId = (metadata as any).managerId as string | undefined;

    if (contractorId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a manager!`;
    }
    if (managerId?.toUpperCase() === normalizedViewerId) {
      return `A contractor has been assigned to you!`;
    }
  }

  if (activityType === 'customer_assigned_to_contractor') {
    const customerId = metadata.customerId as string | undefined;
    const contractorId = (metadata as any).contractorId as string | undefined;

    if (customerId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a contractor!`;
    }
    if (contractorId?.toUpperCase() === normalizedViewerId) {
      return `A customer has been assigned to you!`;
    }
  }

  if (activityType === 'center_assigned_to_customer') {
    const centerId = metadata.centerId as string | undefined;
    const customerId = (metadata as any).customerId as string | undefined;

    if (centerId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a customer!`;
    }
    if (customerId?.toUpperCase() === normalizedViewerId) {
      return `A center has been assigned to you!`;
    }
  }

  if (activityType === 'order_assigned_to_warehouse') {
    const warehouseId = metadata.warehouseId as string | undefined;

    if (warehouseId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned an order!`;
    }
  }

  // User creation activities
  if (activityType === 'crew_created' && item.targetId?.toUpperCase() === normalizedViewerId) {
    return `Welcome to your new account!`;
  }

  if (activityType === 'manager_created' && item.targetId?.toUpperCase() === normalizedViewerId) {
    return `Welcome to your new account!`;
  }

  if (activityType === 'contractor_created' && item.targetId?.toUpperCase() === normalizedViewerId) {
    return `Welcome to your new account!`;
  }

  if (activityType === 'customer_created' && item.targetId?.toUpperCase() === normalizedViewerId) {
    return `Welcome to your new account!`;
  }

  if (activityType === 'center_created' && item.targetId?.toUpperCase() === normalizedViewerId) {
    return `Welcome to your new account!`;
  }

  if (activityType === 'warehouse_created' && item.targetId?.toUpperCase() === normalizedViewerId) {
    return `Welcome to your new account!`;
  }

  // Report/Feedback activities
  if (activityType === 'report_created') {
    // Actor is the report creator
    if (isActor) return `You Filed a Report`;
    return `Filed a Report`;
  }

  if (activityType === 'report_acknowledged') {
    // Actor is the acknowledger
    if (isActor) return `You acknowledged this report`;
    // Personalize for original creator if backend included it
    const createdBy = (metadata.reportCreatedById as string | undefined)?.toUpperCase();
    if (createdBy && createdBy === normalizedViewerId) {
      return `Your report was acknowledged`;
    }
    return `Report acknowledged`;
  }

  if (activityType === 'report_resolved') {
    // Actor is the resolver (managers perform this)
    if (isActor) return `You Marked a Report as Resolved`;
    // Personalize for original creator if backend included it
    const createdBy = (metadata.reportCreatedById as string | undefined)?.toUpperCase();
    if (createdBy && createdBy === normalizedViewerId) {
      return `Your report was resolved`;
    }
    return `Marked Report as Resolved`;
  }

  if (activityType === 'feedback_created') {
    // Actor is the feedback submitter
    if (isActor) return `You Submitted a Feedback`;
    return `Submitted a Feedback`;
  }

  if (activityType === 'feedback_acknowledged') {
    // Actor is the acknowledger
    if (isActor) return `You acknowledged this feedback`;
    const createdBy = (metadata.feedbackCreatedById as string | undefined)?.toUpperCase();
    if (createdBy && createdBy === normalizedViewerId) {
      return `Your feedback was acknowledged`;
    }
    return `Feedback acknowledged`;
  }

  // Order activities
  if (activityType === 'order_created') {
    const crewId = (metadata.crewId as string | undefined)?.toUpperCase();
    const centerId = (metadata.centerId as string | undefined)?.toUpperCase();
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    const warehouseId = (metadata.warehouseId as string | undefined)?.toUpperCase();

    if (crewId === normalizedViewerId) {
      return `You created an order!`;
    }
    if (centerId === normalizedViewerId) {
      return `An order was created at your center!`;
    }
    if (customerId === normalizedViewerId) {
      return `An order was created for your customer!`;
    }
    if (warehouseId === normalizedViewerId) {
      return `You've been assigned a new order!`;
    }
    if (item.actorId?.toUpperCase() === normalizedViewerId) {
      return `You created an order!`;
    }
  }

  if (activityType === 'order_assigned_to_warehouse') {
    const warehouseId = (metadata.warehouseId as string | undefined)?.toUpperCase();
    if (warehouseId === normalizedViewerId) {
      return `You've been assigned an order!`;
    }
  }

  if (activityType === 'order_delivered') {
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    if (customerId === normalizedViewerId) {
      return `Your order was delivered!`;
    }
  }

  if (activityType === 'order_completed') {
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    if (customerId === normalizedViewerId) {
      return `Your order is complete!`;
    }
  }

  if (activityType === 'order_cancelled') {
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    if (customerId === normalizedViewerId) {
      return `Your order was cancelled`;
    }
  }

  // Service activities
  if (activityType === 'service_started') {
    const managerId = (metadata.managerId as string | undefined)?.toUpperCase();
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    if (managerId === normalizedViewerId || customerId === normalizedViewerId) {
      return `Your service has been started!`;
    }
  }

  if (activityType === 'service_completed') {
    const managerId = (metadata.managerId as string | undefined)?.toUpperCase();
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    if (managerId === normalizedViewerId || customerId === normalizedViewerId) {
      return `Your service is complete!`;
    }
  }

  if (activityType === 'service_cancelled') {
    const managerId = (metadata.managerId as string | undefined)?.toUpperCase();
    const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
    if (managerId === normalizedViewerId || customerId === normalizedViewerId) {
      return `Your service was cancelled`;
    }
  }

  // Service lifecycle
  if (activityType === 'service_created') {
    if (isActor) return 'You created a service';
    return 'Service created';
  }
  if (activityType === 'service_started') {
    if (isActor) return 'You started the service';
    return 'Service started';
  }
  if (activityType === 'service_completed') {
    if (isActor) return 'You completed the service';
    return 'Service completed';
  }

  if (activityType === 'service_crew_requested') {
    const crewCodes = (metadata.crewCodes as string[] | undefined) || [];
    const crewId = (metadata.crewId as string | undefined)?.toUpperCase();
    const isRequested = (crewId === normalizedViewerId) || crewCodes.some(code => (code || '').toUpperCase() === normalizedViewerId);
    if (isRequested) {
      return `You've been requested for a service!`;
    }
    if (isActor && actorRole === 'manager') {
      return `You requested a crew member for a service`;
    }
  }

  if (activityType === 'service_crew_response') {
    const managerId = (metadata.managerId as string | undefined)?.toUpperCase();
    const response = (metadata.response as string | undefined)?.toLowerCase();
    if (managerId === normalizedViewerId) {
      return response === 'accepted'
        ? `Crew member accepted your request!`
        : `Crew member declined your request`;
    }
  }

  if (activityType === 'crew_assigned_to_service') {
    const assignedCrew = (metadata.crewId as string | undefined)?.toUpperCase();
    if (assignedCrew === normalizedViewerId) {
      return 'You have been assigned to a service';
    }
    return 'Crew assigned to a service';
  }

  // Archive/Restore/Delete activities
  if (item.actorId?.toUpperCase() === normalizedViewerId) {
    if (activityType?.endsWith('_archived')) {
      return `You archived ${item.targetId || 'an item'}`;
    }
    if (activityType?.endsWith('_restored')) {
      return `You restored ${item.targetId || 'an item'}`;
    }
    if (activityType?.endsWith('_hard_deleted')) {
      return `You permanently deleted ${item.targetId || 'an item'}`;
    }
  }

  // Default: return backend message unchanged
  return item.description;
}

function mapHubItemToActivity(item: HubActivityItem, viewerId?: string | null): Activity {
  const timestamp = new Date(item.createdAt);
  const validDate = isNaN(timestamp.getTime()) ? new Date() : timestamp;

  const role = (item.actorRole || 'system').toLowerCase();
  const roleLabel = formatRoleLabel(item.actorRole);

  // Personalize message based on viewer
  const personalizedMessage = personalizeMessage(item, viewerId);

  return {
    id: item.id,
    message: personalizedMessage, // Use personalized message instead of raw description
    timestamp: validDate,
    type: toActivityType(item.category),
    metadata: {
      role, // Used for color coding in ActivityItem
      title: roleLabel, // Header displayed above the activity
      targetId: item.targetId || undefined,
      targetType: item.targetType || undefined,
      actorId: item.actorId || undefined,
      category: item.category || undefined,
      // spread backend-provided metadata FIRST
      ...(item.metadata ?? undefined),
      // Then override with activityType from top-level field (prevent overwrite)
      activityType: item.activityType, // Add activityType to metadata for click handler
    },
  };
}

export function useFormattedActivities(
  cksCode?: string | null,
  options?: UseFormattedActivitiesOptions,
) {
  const { data, isLoading, error, mutate } = useHubActivities(cksCode);
  const { limit = 20, categories } = options ?? {};

  // Memoize normalized categories to prevent new array reference on every render
  const normalizedCategories = useMemo(
    () => (categories ?? []).map((c) => c.toLowerCase()),
    [categories]
  );

  const activities: Activity[] = useMemo(() => {
    const items = data?.activities ?? [];
    const filteredByCategory = normalizedCategories.length
      ? items.filter((a) => normalizedCategories.includes((a.category || '').toLowerCase()))
      : items;

    // Frontend guardrail (non-admin hubs):
    // Hide other users' creation events while still showing own creation event.
    // Only filter user entity creations; orders/reports/feedback are shared context.
    const viewer = cksCode?.toUpperCase() ?? '';
    const userCreatedTypes = new Set([
      'manager_created',
      'contractor_created',
      'customer_created',
      'center_created',
      'crew_created',
      'warehouse_created',
    ]);
    const filtered = filteredByCategory.filter((a) => {
      const type = (a.activityType || '').toLowerCase();
      // Only filter user-entity creations by targetId; let order/report/feedback creations through
      if (userCreatedTypes.has(type)) {
        return (a.targetId || '').toUpperCase() === viewer;
      }
      return true;
    });

    const mapped = filtered.map((item) => mapHubItemToActivity(item, cksCode));
    mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return mapped.slice(0, limit);
  }, [data?.activities, limit, normalizedCategories, cksCode]);

  return { activities, isLoading, error, mutate, raw: data?.activities ?? [] };
}
