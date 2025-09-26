import type { HubRole } from '../profile/types';

export interface ManagerScopeContractor {
  contractorId: string;
  name: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerScopeCustomer {
  customerId: string;
  contractorId: string | null;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerScopeCenter {
  centerId: string;
  contractorId: string | null;
  customerId: string | null;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerScopeCrewMember {
  crewId: string;
  assignedCenter: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerRoleScopePayload {
  role: Extract<HubRole, 'manager'>;
  cksCode: string;
  summary: {
    contractorCount: number;
    customerCount: number;
    centerCount: number;
    crewCount: number;
    pendingOrders: number;
    accountStatus: string | null;
  };
  relationships: {
    contractors: ManagerScopeContractor[];
    customers: ManagerScopeCustomer[];
    centers: ManagerScopeCenter[];
    crew: ManagerScopeCrewMember[];
  };
}

export type HubRoleScopePayload = ManagerRoleScopePayload;
export interface HubActivityItem {
  id: string;
  description: string;
  category: string;
  actorId: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ManagerRoleActivitiesPayload {
  role: Extract<HubRole, 'manager'>;
  cksCode: string;
  activities: HubActivityItem[];
}

export type HubRoleActivitiesPayload = ManagerRoleActivitiesPayload;
