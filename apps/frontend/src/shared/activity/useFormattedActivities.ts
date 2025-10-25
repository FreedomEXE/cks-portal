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

  // Assignment activities: {entity}_assigned_to_{target}
  if (activityType === 'crew_assigned_to_center') {
    const crewId = metadata.crewId as string | undefined;

    if (crewId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a center!`;
    }
    if (item.targetId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned a crew member!`;
    }
  }

  if (activityType === 'contractor_assigned_to_manager') {
    const contractorId = metadata.contractorId as string | undefined;

    if (contractorId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a manager!`;
    }
    if (item.targetId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned a contractor!`;
    }
  }

  if (activityType === 'customer_assigned_to_contractor') {
    const customerId = metadata.customerId as string | undefined;

    if (customerId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a contractor!`;
    }
    if (item.targetId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned a customer!`;
    }
  }

  if (activityType === 'center_assigned_to_customer') {
    const centerId = metadata.centerId as string | undefined;

    if (centerId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned to a customer!`;
    }
    if (item.targetId?.toUpperCase() === normalizedViewerId) {
      return `You have been assigned a center!`;
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
    const filtered = normalizedCategories.length
      ? items.filter((a) => normalizedCategories.includes((a.category || '').toLowerCase()))
      : items;

    const mapped = filtered.map((item) => mapHubItemToActivity(item, cksCode));
    mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return mapped.slice(0, limit);
  }, [data?.activities, limit, normalizedCategories, cksCode]);

  return { activities, isLoading, error, mutate, raw: data?.activities ?? [] };
}
