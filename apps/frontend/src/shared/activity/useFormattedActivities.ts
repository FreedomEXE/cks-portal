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

function mapHubItemToActivity(item: HubActivityItem): Activity {
  const timestamp = new Date(item.createdAt);
  const validDate = isNaN(timestamp.getTime()) ? new Date() : timestamp;

  const role = (item.actorRole || 'system').toLowerCase();
  const roleLabel = formatRoleLabel(item.actorRole);

  return {
    id: item.id,
    message: item.description,
    timestamp: validDate,
    type: toActivityType(item.category),
    metadata: {
      role, // Used for color coding in ActivityItem
      title: roleLabel, // Header displayed above the activity
      targetId: item.targetId || undefined,
      targetType: item.targetType || undefined,
      actorId: item.actorId || undefined,
      category: item.category || undefined,
      // spread backend-provided metadata last for transparency
      ...(item.metadata ?? undefined),
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

    const mapped = filtered.map(mapHubItemToActivity);
    mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return mapped.slice(0, limit);
  }, [data?.activities, limit, normalizedCategories]);

  return { activities, isLoading, error, mutate, raw: data?.activities ?? [] };
}
