export interface CustomerRow {
  customer_id: string;
  cks_manager: string | null;
  name: string | null;
  main_contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  num_centers: number | null;
  created_at: string | null;
  updated_at: string | null;
  archived_at: string | null;
}

export interface CenterRow {
  center_id: string;
  cks_manager: string | null;
  name: string | null;
  contractor_id: string | null;
  customer_id: string | null;
  main_contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived_at: string | null;
}

export interface CrewRow {
  crew_id: string;
  name: string | null;
  status: string | null;
  emergency_contact: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  assigned_center: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived_at: string | null;
}
export interface ManagerDirectoryEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  territory: string | null;
  role: string | null;
  reportsTo: string | null;
  address: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface ContractorDirectoryEntry {
  id: string;
  name: string;
  managerId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface CustomerDirectoryEntry {
  id: string;
  name: string | null;
  managerId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  totalCenters: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface CenterDirectoryEntry {
  id: string;
  name: string | null;
  managerId: string | null;
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface CrewDirectoryEntry {
  id: string;
  name: string | null;
  status: string | null;
  emergencyContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  assignedCenter: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface WarehouseDirectoryEntry {
  id: string;
  name: string | null;
  managerId: string | null;
  managerName: string | null;
  mainContact: string | null;
  warehouseType: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  capacity: number | null;
  utilization: number | null;
  status: string | null;
  dateAcquired: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface ServiceDirectoryEntry {
  id: string;
  name: string | null;
  category: string | null;
  description: string | null;
  pricingModel: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderDirectoryEntry {
  id: string;
  customerId: string | null;
  centerId: string | null;
  serviceId: string | null;
  orderDate: string | null;
  completionDate: string | null;
  totalAmount: number | null;
  status: string | null;
  notes: string | null;
  assignedWarehouse: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Extra fields for better display in Admin Directory
  createdBy?: string | null;
  createdByRole?: string | null;
  destination?: string | null;
  destinationRole?: string | null;
  orderType?: string | null;
  items?: Array<{
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    itemType: string;
    quantity: number;
    unitOfMeasure: string | null;
    unitPrice: string | null;
    currency: string | null;
    totalPrice: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  metadata?: Record<string, unknown> | null;
}

export interface ProductDirectoryEntry {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number | null;
  unit: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  rawId?: string | null;
  source?: 'products' | 'catalog';
}

export interface TrainingDirectoryEntry {
  id: string;
  crewId: string | null;
  crewName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  date: string | null;
  expense: number | null;
  days: number | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProcedureDirectoryEntry {
  id: string;
  serviceId: string | null;
  type: string | null;
  contractorId: string | null;
  customerId: string | null;
  centerId: string | null;
}

export interface ReportDirectoryEntry {
  id: string;
  type: string;
  severity: string | null;
  title: string;
  description: string | null;
  centerId: string | null;
  customerId: string | null;
  status: string;
  createdByRole: string;
  createdById: string;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface FeedbackDirectoryEntry {
  id: string;
  kind: string;
  title: string;
  message: string | null;
  centerId: string | null;
  customerId: string | null;
  createdByRole: string;
  createdById: string;
  createdAt: string | null;
  archivedAt: string | null;
}

export interface ActivityEntry {
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

export interface DirectoryResourceMap {
  managers: ManagerDirectoryEntry;
  contractors: ContractorDirectoryEntry;
  customers: CustomerDirectoryEntry;
  centers: CenterDirectoryEntry;
  crew: CrewDirectoryEntry;
  warehouses: WarehouseDirectoryEntry;
  services: ServiceDirectoryEntry;
  orders: OrderDirectoryEntry;
  products: ProductDirectoryEntry;
  training: TrainingDirectoryEntry;
  procedures: ProcedureDirectoryEntry;
  reports: ReportDirectoryEntry;
  feedback: FeedbackDirectoryEntry;
  activities: ActivityEntry;
}

export type DirectoryResourceKey = keyof DirectoryResourceMap;


