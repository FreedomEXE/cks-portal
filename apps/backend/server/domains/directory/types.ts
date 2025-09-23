export interface ManagerDirectoryEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  territory: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface ContractorDirectoryEntry {
  id: string;
  companyName: string | null;
  managerId: string | null;
  contactPerson: string | null;
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
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  totalCenters: number | null;
  archivedAt: string | null;
}

export interface CenterDirectoryEntry {
  id: string;
  name: string | null;
  managerId: string | null;
  contractorId: string | null;
  customerId: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  archivedAt: string | null;
}

export interface CrewDirectoryEntry {
  id: string;
  name: string | null;
  status: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  assignedCenter: string | null;
  archivedAt: string | null;
}

export interface WarehouseDirectoryEntry {
  id: string;
  name: string | null;
  managerId: string | null;
  managerName: string | null;
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
  requirements: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderDirectoryEntry {
  id: string;
  customerId: string;
  centerId: string | null;
  serviceId: string | null;
  orderDate: string | null;
  completionDate: string | null;
  totalAmount: string | null;
  status: string | null;
  notes: string | null;
  assignedWarehouse: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductDirectoryEntry {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string | null;
  unit: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TrainingDirectoryEntry {
  id: string;
  crewId: string | null;
  crewName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  date: string | null;
  expense: string | null;
  days: number | null;
  status: string | null;
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
