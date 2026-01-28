import type {
  ManagerDashboardResponse,
  ContractorDashboardResponse,
  CustomerDashboardResponse,
  CenterDashboardResponse,
  CrewDashboardResponse,
  WarehouseDashboardResponse,
  HubOrderItem,
  HubProfileResponse,
} from '../api/hub';
import { capitalizeLabel, countPendingOrdersFromOrders, safeLength } from './metrics';

type Nullable<T> = T | null | undefined;

function formatAccessTier(tier: string | null | undefined): string | null {
  const normalized = (tier ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'standard') {
    return 'Free';
  }
  if (normalized === 'premium') {
    return 'Premium';
  }
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveAccountStatus({
  accessStatus,
  accessTier,
  fallbackStatus,
}: {
  accessStatus?: string | null;
  accessTier?: string | null;
  fallbackStatus?: string | null;
}): string {
  const fallback = capitalizeLabel(fallbackStatus ?? null, 'Active');
  const normalizedFallback = (fallbackStatus ?? '').trim().toLowerCase();
  if (normalizedFallback === 'paused') {
    return 'Paused';
  }
  if (normalizedFallback === 'pending' || normalizedFallback === 'unassigned') {
    return 'Pending';
  }
  if (normalizedFallback === 'cancelled' || normalizedFallback === 'canceled') {
    return 'Cancelled';
  }

  const normalizedAccess = (accessStatus ?? '').trim().toLowerCase();
  const baseStatus = normalizedAccess === 'active' ? 'Active' : 'Pending';
  const tierLabel = formatAccessTier(accessTier);
  return tierLabel ? `${baseStatus} · ${tierLabel}` : baseStatus;
}

// Manager
export function buildManagerOverviewData(inputs: {
  dashboard: Nullable<ManagerDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  activeServicesCount?: number;
  orders?: readonly HubOrderItem[] | null;
  accessStatus?: string | null;
  accessTier?: string | null;
}) {
  const { dashboard, scope, orders } = inputs;
  const activeServices =
    inputs.activeServicesCount ??
    (dashboard as any)?.activeServices ??
    scope?.summary?.activeServices ??
    0;
  const myCenters =
    (dashboard as any)?.centerCount ?? scope?.summary?.centerCount ?? safeLength(scope?.relationships?.centers) ?? 0;
  const myCrew = (dashboard as any)?.crewCount ?? scope?.summary?.crewCount ?? safeLength(scope?.relationships?.crew) ?? 0;
  const pendingOrders =
    (dashboard as any)?.pendingOrders ?? countPendingOrdersFromOrders(orders ?? null);
  const accountStatus = resolveAccountStatus({
    accessStatus: inputs.accessStatus ?? null,
    accessTier: inputs.accessTier ?? null,
    fallbackStatus: (dashboard as any)?.accountStatus ?? inputs.profile?.status ?? null,
  });
  return { activeServices, myCenters, myCrew, pendingOrders, accountStatus } as const;
}

// Contractor
export function buildContractorOverviewData(inputs: {
  dashboard: Nullable<ContractorDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  activeServicesCount?: number;
  orders?: readonly HubOrderItem[] | null;
  accessStatus?: string | null;
  accessTier?: string | null;
}) {
  const { dashboard, scope } = inputs;
  const activeServices =
    inputs.activeServicesCount ??
    (dashboard as any)?.activeServices ??
    scope?.summary?.activeServices ??
    0;
  const myCustomers =
    (dashboard as any)?.customerCount ?? scope?.summary?.customerCount ?? safeLength(scope?.relationships?.customers) ?? 0;
  const pendingOrders = (dashboard as any)?.pendingOrders ?? 0;
  const accountStatus = resolveAccountStatus({
    accessStatus: inputs.accessStatus ?? null,
    accessTier: inputs.accessTier ?? null,
    fallbackStatus: (dashboard as any)?.accountStatus ?? inputs.profile?.status ?? null,
  });
  return { activeServices, myCustomers, pendingOrders, accountStatus } as const;
}

// Customer
export function buildCustomerOverviewData(inputs: {
  dashboard: Nullable<CustomerDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  activeServicesCount?: number;
  accessStatus?: string | null;
  accessTier?: string | null;
}) {
  const { dashboard, scope } = inputs;
  const activeServices =
    inputs.activeServicesCount ??
    (dashboard as any)?.activeServices ??
    scope?.summary?.activeServices ??
    0;
  const myCenters = (dashboard as any)?.centerCount ?? scope?.summary?.centerCount ?? safeLength(scope?.relationships?.centers) ?? 0;
  const pendingOrders = (dashboard as any)?.pendingRequests ?? 0;
  const accountStatus = resolveAccountStatus({
    accessStatus: inputs.accessStatus ?? null,
    accessTier: inputs.accessTier ?? null,
    fallbackStatus: (dashboard as any)?.accountStatus ?? inputs.profile?.status ?? null,
  });
  return { activeServices, myCenters, pendingOrders, accountStatus } as const;
}

// Center
export function buildCenterOverviewData(inputs: {
  dashboard: Nullable<CenterDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  activeServicesCount?: number;
  accessStatus?: string | null;
  accessTier?: string | null;
}) {
  const { dashboard, scope } = inputs;
  const activeServices =
    inputs.activeServicesCount ??
    (dashboard as any)?.activeServices ??
    scope?.summary?.activeServices ??
    0;
  const activeCrew = (dashboard as any)?.crewCount ?? scope?.summary?.crewCount ?? safeLength(scope?.relationships?.crew) ?? 0;
  const pendingOrders = (dashboard as any)?.pendingRequests ?? 0;
  const accountStatus = resolveAccountStatus({
    accessStatus: inputs.accessStatus ?? null,
    accessTier: inputs.accessTier ?? null,
    fallbackStatus: (dashboard as any)?.accountStatus ?? inputs.profile?.status ?? null,
  });
  return { activeServices, activeCrew, pendingOrders, accountStatus } as const;
}

// Crew
export function buildCrewOverviewData(inputs: {
  dashboard: Nullable<CrewDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  activeServicesCount?: number;
  orders?: readonly HubOrderItem[] | null;
  viewerId?: string | null;
  accessStatus?: string | null;
  accessTier?: string | null;
}) {
  const { dashboard, orders, viewerId } = inputs;
  const activeServices =
    inputs.activeServicesCount ??
    (dashboard as any)?.activeServices ??
    0;

  // Compute today's tasks: assigned to viewer, for services in progress, and scheduled for today
  const today = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayNames[today.getDay()];
  const me = (viewerId || '').toUpperCase();
  let myTasks = 0;
  if (me && Array.isArray(orders)) {
    for (const o of orders) {
      const meta: any = o?.metadata || {};
      const status = String(meta.serviceStatus || meta.service_status || '').toLowerCase();
      if (status !== 'in_progress') continue; // only active services
      const tasks: any[] = Array.isArray(meta.tasks) ? meta.tasks : [];
      for (const t of tasks) {
        const assigned = Array.isArray(t?.assignedTo) ? t.assignedTo.map((x: any) => String(x).toUpperCase()) : [];
        if (!assigned.includes(me)) continue;
        const days: string[] = Array.isArray(t?.days) ? t.days.map((d: any) => String(d).toLowerCase()) : [];
        const freq = String(t?.frequency || '').toLowerCase();
        const dueToday = (days.length > 0 && days.includes(todayKey)) || freq === 'daily' || days.length === 0;
        if (dueToday && !t?.completedAt) {
          myTasks += 1;
        }
      }
    }
  }

  const timecard = 0;
  const accountStatus = resolveAccountStatus({
    accessStatus: inputs.accessStatus ?? null,
    accessTier: inputs.accessTier ?? null,
    fallbackStatus: (dashboard as any)?.accountStatus ?? inputs.profile?.status ?? null,
  });
  return { activeServices, myTasks, timecard, accountStatus } as const;
}

// Warehouse
export function buildWarehouseOverviewData(inputs: {
  dashboard: Nullable<WarehouseDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  activeServicesCount?: number;
  inventory?: { activeItems?: readonly any[] } | null;
  accessStatus?: string | null;
  accessTier?: string | null;
}) {
  const { dashboard, inventory } = inputs;
  const activeServices =
    inputs.activeServicesCount ??
    (dashboard as any)?.activeServices ??
    0;
  // Fallback to counting active inventory items if dashboard doesn't provide count
  const inventoryCount = (dashboard as any)?.inventoryCount ?? inventory?.activeItems?.length ?? 0;
  const lowStockItems = (dashboard as any)?.lowStockItems ?? (inventory?.activeItems?.filter((i: any) => i.isLow)?.length ?? 0);
  const pendingOrders = (dashboard as any)?.pendingOrders ?? 0;
  const accountStatus = resolveAccountStatus({
    accessStatus: inputs.accessStatus ?? null,
    accessTier: inputs.accessTier ?? null,
    fallbackStatus: (dashboard as any)?.accountStatus ?? inputs.profile?.status ?? null,
  });
  return { activeServices, inventoryCount, lowStockItems, pendingOrders, accountStatus } as const;
}

// Admin
export function buildAdminOverviewData(inputs: {
  adminUsers?: readonly any[] | null;
  managers?: readonly any[] | null;
  contractors?: readonly any[] | null;
  customers?: readonly any[] | null;
  centers?: readonly any[] | null;
  crew?: readonly any[] | null;
  warehouses?: readonly any[] | null;
  reports?: readonly any[] | null;
  goLiveTimestamp?: number | null;
}) {
  const { adminUsers, managers, contractors, customers, centers, crew, warehouses, reports, goLiveTimestamp } = inputs;

  // Calculate days online from GO_LIVE_TIMESTAMP
  let daysOnline = 0;
  if (goLiveTimestamp) {
    const now = Date.now();
    daysOnline = Math.max(0, Math.floor((now - goLiveTimestamp) / (1000 * 60 * 60 * 24)));
  }

  // Total users: sum all user arrays
  const userCount =
    (adminUsers?.length ?? 0) +
    (managers?.length ?? 0) +
    (contractors?.length ?? 0) +
    (customers?.length ?? 0) +
    (centers?.length ?? 0) +
    (crew?.length ?? 0) +
    (warehouses?.length ?? 0);

  // Open support tickets: count open reports
  const ticketCount = Array.isArray(reports)
    ? reports.filter((r: any) => r.status === 'open').length
    : 0;

  // High priority tickets: count reports with severity 'high'
  const highPriorityCount = Array.isArray(reports)
    ? reports.filter((r: any) => r.severity === 'high').length
    : 0;

  return {
    userCount,
    ticketCount,
    highPriorityCount,
    daysOnline,
  } as const;
}
