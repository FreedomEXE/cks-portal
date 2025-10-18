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

// Manager
export function buildManagerOverviewData(inputs: {
  dashboard: Nullable<ManagerDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  orders?: readonly HubOrderItem[] | null;
}) {
  const { dashboard, scope, certifiedServices, orders } = inputs;
  const myServices = certifiedServices?.length ?? 0;
  const myCenters =
    (dashboard as any)?.centerCount ?? scope?.summary?.centerCount ?? safeLength(scope?.relationships?.centers) ?? 0;
  const myCrew = (dashboard as any)?.crewCount ?? scope?.summary?.crewCount ?? safeLength(scope?.relationships?.crew) ?? 0;
  const pendingOrders =
    (dashboard as any)?.pendingOrders ?? countPendingOrdersFromOrders(orders ?? null);
  const accountStatus = capitalizeLabel((dashboard as any)?.accountStatus ?? inputs.profile?.status, 'Active');
  return { myServices, myCenters, myCrew, pendingOrders, accountStatus } as const;
}

// Contractor
export function buildContractorOverviewData(inputs: {
  dashboard: Nullable<ContractorDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  orders?: readonly HubOrderItem[] | null;
}) {
  const { dashboard, scope, certifiedServices } = inputs;
  const myServices = certifiedServices?.length ?? 0;
  const myCustomers =
    (dashboard as any)?.customerCount ?? scope?.summary?.customerCount ?? safeLength(scope?.relationships?.customers) ?? 0;
  const pendingOrders = (dashboard as any)?.pendingOrders ?? 0;
  const accountStatus = capitalizeLabel((dashboard as any)?.accountStatus ?? inputs.profile?.status, 'Active');
  return { myServices, myCustomers, pendingOrders, accountStatus } as const;
}

// Customer
export function buildCustomerOverviewData(inputs: {
  dashboard: Nullable<CustomerDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
}) {
  const { dashboard, scope, certifiedServices } = inputs;
  const myServices = certifiedServices?.length ?? 0;
  const myCenters = (dashboard as any)?.centerCount ?? scope?.summary?.centerCount ?? safeLength(scope?.relationships?.centers) ?? 0;
  const pendingOrders = (dashboard as any)?.pendingRequests ?? 0;
  const accountStatus = capitalizeLabel((dashboard as any)?.accountStatus ?? inputs.profile?.status, 'Active');
  return { myServices, myCenters, pendingOrders, accountStatus } as const;
}

// Center
export function buildCenterOverviewData(inputs: {
  dashboard: Nullable<CenterDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
}) {
  const { dashboard, scope } = inputs;
  const activeServices = (dashboard as any)?.activeServices ?? scope?.summary?.activeServices ?? 0;
  const activeCrew = (dashboard as any)?.crewCount ?? scope?.summary?.crewCount ?? safeLength(scope?.relationships?.crew) ?? 0;
  const pendingOrders = (dashboard as any)?.pendingRequests ?? 0;
  const accountStatus = capitalizeLabel((dashboard as any)?.accountStatus ?? inputs.profile?.status, 'Active');
  return { activeServices, activeCrew, pendingOrders, accountStatus } as const;
}

// Crew
export function buildCrewOverviewData(inputs: {
  dashboard: Nullable<CrewDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
}) {
  const { dashboard, certifiedServices } = inputs;
  const myServices = certifiedServices?.length ?? 0;
  const myTasks = 0;
  const timecard = 0;
  const accountStatus = capitalizeLabel((dashboard as any)?.accountStatus ?? inputs.profile?.status, 'Active');
  return { myServices, myTasks, timecard, accountStatus } as const;
}

// Warehouse
export function buildWarehouseOverviewData(inputs: {
  dashboard: Nullable<WarehouseDashboardResponse>;
  profile: Nullable<HubProfileResponse>;
  scope: any;
  certifiedServices: readonly any[];
  inventory?: { activeItems?: readonly any[] } | null;
}) {
  const { dashboard, certifiedServices, inventory } = inputs;
  const myServices = certifiedServices?.length ?? 0;
  // Fallback to counting active inventory items if dashboard doesn't provide count
  const inventoryCount = (dashboard as any)?.inventoryCount ?? inventory?.activeItems?.length ?? 0;
  const lowStockItems = (dashboard as any)?.lowStockItems ?? (inventory?.activeItems?.filter((i: any) => i.isLow)?.length ?? 0);
  const pendingOrders = (dashboard as any)?.pendingOrders ?? 0;
  const accountStatus = capitalizeLabel((dashboard as any)?.accountStatus ?? inputs.profile?.status, 'Active');
  return { myServices, inventoryCount, lowStockItems, pendingOrders, accountStatus } as const;
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

