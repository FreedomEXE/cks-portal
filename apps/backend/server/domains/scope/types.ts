import type { HubRole } from '../profile/types';

export type HubScopeNodeRole = HubRole | 'service' | 'product' | 'order' | 'inventory';

export interface HubScopeNode<Role extends HubScopeNodeRole = HubScopeNodeRole> {
  id: string;
  role: Role;
  name: string | null;
  status: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  parentId?: string | null;
  parentRole?: HubScopeNodeRole | null;
  metadata?: Record<string, unknown> | null;
}

export type HubScopeReference<Role extends HubRole = HubRole> = Pick<
  HubScopeNode<Role>,
  'id' | 'role' | 'name' | 'status' | 'email' | 'phone'
>;

export interface ManagerScopeContractor extends HubScopeNode<'contractor'> {
  contactPerson: string | null;
  address: string | null;
}

export interface ManagerScopeCustomer extends HubScopeNode<'customer'> {
  contractorId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ManagerScopeCenter extends HubScopeNode<'center'> {
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ManagerScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ManagerScopeRelationships {
  contractors: ManagerScopeContractor[];
  customers: ManagerScopeCustomer[];
  centers: ManagerScopeCenter[];
  crew: ManagerScopeCrewMember[];
}

export interface ManagerScopeSummary {
  contractorCount: number;
  customerCount: number;
  centerCount: number;
  crewCount: number;
  pendingOrders: number;
  accountStatus: string | null;
}

export interface ContractorScopeCustomer extends HubScopeNode<'customer'> {
  contractorId: string | null;
  mainContact: string | null;
}

export interface ContractorScopeCenter extends HubScopeNode<'center'> {
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
}

export interface ContractorScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
}

export interface ContractorScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  customers: ContractorScopeCustomer[];
  centers: ContractorScopeCenter[];
  crew: ContractorScopeCrewMember[];
}

export interface ContractorScopeSummary {
  customerCount: number;
  centerCount: number;
  crewCount: number;
  serviceCount: number;
  accountStatus: string | null;
}

export interface CustomerScopeCenter extends HubScopeNode<'center'> {
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
}

export interface CustomerScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
}

export interface CustomerScopeService extends HubScopeNode<'service'> {
  category?: string | null;
}

export interface CustomerScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  contractor: HubScopeReference<'contractor'> | null;
  centers: CustomerScopeCenter[];
  crew: CustomerScopeCrewMember[];
  services: CustomerScopeService[];
}

export interface CustomerScopeSummary {
  centerCount: number;
  crewCount: number;
  serviceCount: number;
  accountStatus: string | null;
}

export interface CenterScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
}

export interface CenterScopeService extends HubScopeNode<'service'> {
  category?: string | null;
}

export interface CenterScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  contractor: HubScopeReference<'contractor'> | null;
  customer: HubScopeReference<'customer'> | null;
  crew: CenterScopeCrewMember[];
  services: CenterScopeService[];
}

export interface CenterScopeSummary {
  crewCount: number;
  activeServices: number;
  pendingRequests: number;
  accountStatus: string | null;
}

export interface CrewScopeService extends HubScopeNode<'service'> {
  category?: string | null;
}

export interface CrewScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  contractor: HubScopeReference<'contractor'> | null;
  customer: HubScopeReference<'customer'> | null;
  center: HubScopeReference<'center'> | null;
  services: CrewScopeService[];
}

export interface CrewScopeSummary {
  activeServices: number;
  completedToday: number;
  trainings: number;
  accountStatus: string | null;
}

export interface WarehouseScopeOrder extends HubScopeNode<'order'> {
  status: string | null;
  destination?: string | null;
}

export interface WarehouseScopeInventoryItem extends HubScopeNode<'product'> {
  quantity?: number | null;
}

export interface WarehouseScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  orders: WarehouseScopeOrder[];
  inventory: WarehouseScopeInventoryItem[];
}

export interface WarehouseScopeSummary {
  inventoryCount: number;
  pendingOrders: number;
  deliveriesScheduled: number;
  lowStockItems: number;
  accountStatus: string | null;
}

interface HubRoleScopePayloadBase<
  Role extends HubRole,
  Summary,
  Relationships
> {
  role: Role;
  cksCode: string;
  summary: Summary;
  relationships: Relationships;
}

export interface ManagerRoleScopePayload
  extends HubRoleScopePayloadBase<'manager', ManagerScopeSummary, ManagerScopeRelationships> {}

export interface ContractorRoleScopePayload
  extends HubRoleScopePayloadBase<'contractor', ContractorScopeSummary, ContractorScopeRelationships> {}

export interface CustomerRoleScopePayload
  extends HubRoleScopePayloadBase<'customer', CustomerScopeSummary, CustomerScopeRelationships> {}

export interface CenterRoleScopePayload
  extends HubRoleScopePayloadBase<'center', CenterScopeSummary, CenterScopeRelationships> {}

export interface CrewRoleScopePayload
  extends HubRoleScopePayloadBase<'crew', CrewScopeSummary, CrewScopeRelationships> {}

export interface WarehouseRoleScopePayload
  extends HubRoleScopePayloadBase<'warehouse', WarehouseScopeSummary, WarehouseScopeRelationships> {}

export type HubRoleScopePayload =
  | ManagerRoleScopePayload
  | ContractorRoleScopePayload
  | CustomerRoleScopePayload
  | CenterRoleScopePayload
  | CrewRoleScopePayload
  | WarehouseRoleScopePayload;

export interface HubActivityItem {
  id: string;
  description: string;
  activityType: string; // Specific type like "crew_assigned_to_center"
  category: string;
  actorId: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface HubRoleActivitiesPayload {
  role: HubRole;
  cksCode: string;
  activities: HubActivityItem[];
}
