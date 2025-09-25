import type { HubRole } from '../profile/types';

export interface CustomerDashboardPayload {
  role: Extract<HubRole, 'customer'>;
  cksCode: string;
  serviceCount: number;
  centerCount: number;
  crewCount: number;
  pendingRequests: number;
  accountStatus: string | null;
}

export interface ManagerDashboardPayload {
  role: Extract<HubRole, 'manager'>;
  cksCode: string;
  contractorCount: number;
  customerCount: number;
  centerCount: number;
  crewCount: number;
  pendingOrders: number;
  accountStatus: string | null;
}

export interface ContractorDashboardPayload {
  role: Extract<HubRole, 'contractor'>;
  cksCode: string;
  centerCount: number;
  crewCount: number;
  activeServices: number;
  pendingOrders: number;
  accountStatus: string | null;
}

export interface CenterDashboardPayload {
  role: Extract<HubRole, 'center'>;
  cksCode: string;
  crewCount: number;
  activeServices: number;
  pendingRequests: number;
  equipmentCount: number;
  accountStatus: string | null;
  customerId: string | null;
}

export interface CrewDashboardPayload {
  role: Extract<HubRole, 'crew'>;
  cksCode: string;
  activeServices: number;
  completedToday: number;
  trainings: number;
  accountStatus: string | null;
  assignedCenter: string | null;
}

export interface WarehouseDashboardPayload {
  role: Extract<HubRole, 'warehouse'>;
  cksCode: string;
  inventoryCount: number;
  pendingOrders: number;
  deliveriesScheduled: number;
  lowStockItems: number;
  accountStatus: string | null;
}

export type HubDashboardPayload =
  | CustomerDashboardPayload
  | ManagerDashboardPayload
  | ContractorDashboardPayload
  | CenterDashboardPayload
  | CrewDashboardPayload
  | WarehouseDashboardPayload;
