import { query } from '../../db/connection';
import type {
  ActivityEntry,
  ContractorDirectoryEntry,
  CustomerDirectoryEntry,
  DirectoryResourceKey,
  DirectoryResourceMap,
  ManagerDirectoryEntry,
  CenterDirectoryEntry,
  CrewDirectoryEntry,
  WarehouseDirectoryEntry,
  ServiceDirectoryEntry,
  OrderDirectoryEntry,
  ProductDirectoryEntry,
  TrainingDirectoryEntry,
  ProcedureDirectoryEntry,
  ReportDirectoryEntry,
  FeedbackDirectoryEntry,
} from './types';
const DEFAULT_LIMIT = 250;



const toIso = (date: Date | string | null | undefined): string | null => {
  if (!date) {
    return null;
  }
  const value = typeof date === 'string' ? new Date(date) : date;
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
};


function formatPrefixedId(value: string | null | undefined, fallbackPrefix?: string): string {
  if (!value) {
    return fallbackPrefix ? `${fallbackPrefix}-???` : 'N/A';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return fallbackPrefix ? `${fallbackPrefix}-???` : 'N/A';
  }
  const match = trimmed.match(/^([A-Za-z]+)-?(\d+)$/);
  if (match) {
    const prefix = (fallbackPrefix ?? match[1]).toUpperCase();
    const digits = match[2].padStart(3, '0');
    return `${prefix}-${digits}`;
  }
  return trimmed;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

type ManagerRow = {
  manager_id: string;
  manager_name: string;
  email: string | null;
  phone: string | null;
  territory: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  archived_at: Date | null;
};

type ContractorRow = {
  contractor_id: string;
  cks_manager: string | null;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  archived_at: Date | null;
};

type CustomerRow = {
  customer_id: string;
  cks_manager: string | null;
  company_name: string | null;
  main_contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  num_centers: number | null;
  archived_at: Date | null;
};

type CenterRow = {
  center_id: string;
  cks_manager: string | null;
  name: string | null;
  contractor_id: string | null;
  customer_id: string | null;
  main_contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  archived_at: Date | null;
};

type CrewRow = {
  crew_id: string;
  name: string | null;
  status: string | null;
  role: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  assigned_center: string | null;
  archived_at: Date | null;
};

type WarehouseRow = {
  warehouse_id: string;
  name: string | null;
  manager_id: string | null;
  manager: string | null;
  warehouse_name: string | null;
  warehouse_type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  capacity: number | null;
  current_utilization: number | null;
  status: string | null;
  date_acquired: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  archived_at: Date | null;
};

type ServiceRow = {
  service_id: string;
  service_name: string | null;
  category: string | null;
  description: string | null;
  pricing_model: string | null;
  requirements: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type OrderRow = {
  order_id: string;
  customer_id: string;
  center_id: string | null;
  service_id: string | null;
  order_date: Date | null;
  completion_date: Date | null;
  total_amount: string | number | null;
  status: string | null;
  notes: string | null;
  assigned_warehouse: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type ProductRow = {
  product_id: string;
  product_name: string;
  category: string | null;
  description: string | null;
  price: string | number | null;
  unit: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type TrainingRow = {
  training_id: string;
  crew_id: string | null;
  crew_name: string | null;
  service_id: string | null;
  service_name: string | null;
  date: Date | null;
  expense: string | number | null;
  days: number | null;
  status: string | null;
};

type ProcedureRow = {
  procedure_id: string;
  service: string | null;
  type: string | null;
  contractor: string | null;
  customer: string | null;
  center: string | null;
};

type ReportRow = {
  report_id: string;
  type: string;
  severity: string | null;
  title: string;
  description: string | null;
  center_id: string | null;
  customer_id: string | null;
  status: string;
  created_by_role: string;
  created_by_id: string;
  created_at: Date | null;
  updated_at: Date | null;
  archived_at: Date | null;
};

type FeedbackRow = {
  feedback_id: string;
  kind: string;
  title: string;
  message: string | null;
  center_id: string | null;
  customer_id: string | null;
  created_by_role: string;
  created_by_id: string;
  created_at: Date | null;
  archived_at: Date | null;
};

type ActivityRow = {
  activity_id: number;
  activity_type: string;
  actor_id: string | null;
  actor_role: string | null;
  target_id: string | null;
  target_type: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

const activityTypeCategory: Record<string, string> = {
  assignment_made: 'action',
  support_ticket_updated: 'warning',
  manager_assigned: 'info',
};

async function listManagers(limit = DEFAULT_LIMIT): Promise<ManagerDirectoryEntry[]> {
  const result = await query<ManagerRow>('SELECT manager_id, manager_name, email, phone, territory, status, created_at, updated_at, archived_at FROM managers ORDER BY manager_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.manager_id, 'MGR'),
    name: row.manager_name ?? row.manager_id,
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    territory: toNullableString(row.territory),
    status: toNullableString(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listContractors(limit = DEFAULT_LIMIT): Promise<ContractorDirectoryEntry[]> {
  const result = await query<ContractorRow>('SELECT contractor_id, cks_manager, company_name, contact_person, email, phone, address, status, created_at, updated_at, archived_at FROM contractors ORDER BY contractor_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.contractor_id, 'CON'),
    managerId: toNullableString(row.cks_manager),
    companyName: toNullableString(row.company_name),
    contactPerson: toNullableString(row.contact_person),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listCustomers(limit = DEFAULT_LIMIT): Promise<CustomerDirectoryEntry[]> {
  const result = await query<CustomerRow>('SELECT customer_id, cks_manager, company_name, main_contact, email, phone, address, num_centers, archived_at FROM customers ORDER BY customer_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.customer_id, 'CUS'),
    managerId: toNullableString(row.cks_manager),
    name: toNullableString(row.company_name),
    contactName: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    totalCenters: toNullableNumber(row.num_centers),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listCenters(limit = DEFAULT_LIMIT): Promise<CenterDirectoryEntry[]> {
  const result = await query<CenterRow>('SELECT center_id, cks_manager, name, contractor_id, customer_id, main_contact, email, phone, address, archived_at FROM centers ORDER BY center_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.center_id, 'CEN'),
    managerId: toNullableString(row.cks_manager),
    name: toNullableString(row.name),
    contractorId: toNullableString(row.contractor_id),
    customerId: toNullableString(row.customer_id),
    contactName: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listCrew(limit = DEFAULT_LIMIT): Promise<CrewDirectoryEntry[]> {
  const result = await query<CrewRow>('SELECT crew_id, name, status, role, address, phone, email, assigned_center, archived_at FROM crew ORDER BY crew_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.crew_id, 'CRW'),
    name: toNullableString(row.name),
    status: toNullableString(row.status),
    role: toNullableString(row.role),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    assignedCenter: toNullableString(row.assigned_center),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listWarehouses(limit = DEFAULT_LIMIT): Promise<WarehouseDirectoryEntry[]> {
  const result = await query<WarehouseRow>('SELECT warehouse_id, COALESCE(warehouse_name, name) AS warehouse_name, manager_id, manager, warehouse_type, address, phone, email, capacity, current_utilization, status, date_acquired, created_at, updated_at, archived_at FROM warehouses ORDER BY warehouse_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.warehouse_id, 'WHS'),
    name: toNullableString(row.warehouse_name ?? row.name),
    managerId: toNullableString(row.manager_id),
    managerName: toNullableString(row.manager),
    warehouseType: toNullableString(row.warehouse_type),
    address: toNullableString(row.address),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    capacity: toNullableNumber(row.capacity),
    utilization: toNullableNumber(row.current_utilization),
    status: toNullableString(row.status),
    dateAcquired: toIso(row.date_acquired),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listServices(limit = DEFAULT_LIMIT): Promise<ServiceDirectoryEntry[]> {
  const result = await query<ServiceRow>('SELECT service_id, service_name, category, description, pricing_model, requirements, status, created_at, updated_at FROM services ORDER BY service_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.service_id, 'SRV'),
    name: toNullableString(row.service_name),
    category: toNullableString(row.category),
    description: toNullableString(row.description),
    pricingModel: toNullableString(row.pricing_model),
    requirements: toNullableString(row.requirements),
    status: toNullableString(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }));
}

async function listOrders(limit = DEFAULT_LIMIT): Promise<OrderDirectoryEntry[]> {
  const result = await query<OrderRow>('SELECT order_id, customer_id, center_id, service_id, order_date, completion_date, total_amount, status, notes, assigned_warehouse, created_at, updated_at FROM orders ORDER BY order_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: row.order_id,
    customerId: formatPrefixedId(row.customer_id, 'CUS'),
    centerId: toNullableString(row.center_id),
    serviceId: toNullableString(row.service_id),
    orderDate: toIso(row.order_date),
    completionDate: toIso(row.completion_date),
    totalAmount: toNullableString(row.total_amount),
    status: toNullableString(row.status),
    notes: toNullableString(row.notes),
    assignedWarehouse: toNullableString(row.assigned_warehouse),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }));
}

async function listProducts(limit = DEFAULT_LIMIT): Promise<ProductDirectoryEntry[]> {
  const result = await query<ProductRow>('SELECT product_id, product_name, category, description, price, unit, status, created_at, updated_at FROM products ORDER BY product_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.product_id, 'PRD'),
    name: row.product_name,
    category: toNullableString(row.category),
    description: toNullableString(row.description),
    price: toNullableString(row.price),
    unit: toNullableString(row.unit),
    status: toNullableString(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }));
}

async function listTraining(limit = DEFAULT_LIMIT): Promise<TrainingDirectoryEntry[]> {
  const result = await query<TrainingRow>('SELECT training_id, crew_id, crew_name, service_id, service_name, date, expense, days, status FROM training ORDER BY training_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.training_id, 'TRN'),
    crewId: toNullableString(row.crew_id),
    crewName: toNullableString(row.crew_name),
    serviceId: toNullableString(row.service_id),
    serviceName: toNullableString(row.service_name),
    date: toIso(row.date),
    expense: toNullableString(row.expense),
    days: toNullableNumber(row.days),
    status: toNullableString(row.status),
  }));
}

async function listProcedures(limit = DEFAULT_LIMIT): Promise<ProcedureDirectoryEntry[]> {
  const result = await query<ProcedureRow>('SELECT procedure_id, service, type, contractor, customer, center FROM procedures ORDER BY procedure_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: row.procedure_id,
    serviceId: toNullableString(row.service),
    type: toNullableString(row.type),
    contractorId: toNullableString(row.contractor),
    customerId: toNullableString(row.customer),
    centerId: toNullableString(row.center),
  }));
}

async function listReports(limit = DEFAULT_LIMIT): Promise<ReportDirectoryEntry[]> {
  const result = await query<ReportRow>('SELECT report_id, type, severity, title, description, center_id, customer_id, status, created_by_role, created_by_id, created_at, updated_at, archived_at FROM reports ORDER BY report_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: row.report_id,
    type: row.type,
    severity: toNullableString(row.severity),
    title: row.title,
    description: toNullableString(row.description),
    centerId: toNullableString(row.center_id),
    customerId: toNullableString(row.customer_id),
    status: row.status,
    createdByRole: row.created_by_role,
    createdById: row.created_by_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listFeedback(limit = DEFAULT_LIMIT): Promise<FeedbackDirectoryEntry[]> {
  const result = await query<FeedbackRow>('SELECT feedback_id, kind, title, message, center_id, customer_id, created_by_role, created_by_id, created_at, archived_at FROM feedback ORDER BY feedback_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: row.feedback_id,
    kind: row.kind,
    title: row.title,
    message: toNullableString(row.message),
    centerId: toNullableString(row.center_id),
    customerId: toNullableString(row.customer_id),
    createdByRole: row.created_by_role,
    createdById: row.created_by_id,
    createdAt: toIso(row.created_at),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listActivities(limit = 25): Promise<ActivityEntry[]> {
  const result = await query<ActivityRow>('SELECT activity_id, activity_type, actor_id, actor_role, target_id, target_type, description, metadata, created_at FROM system_activity ORDER BY created_at DESC LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: String(row.activity_id),
    description: row.description,
    category: activityTypeCategory[row.activity_type] ?? "info",
    actorId: toNullableString(row.actor_id),
    actorRole: toNullableString(row.actor_role),
    targetId: toNullableString(row.target_id),
    targetType: toNullableString(row.target_type),
    metadata: row.metadata ?? null,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  }));
}

type DirectoryLoaderMap = {
  [K in DirectoryResourceKey]: (limit?: number) => Promise<DirectoryResourceMap[K][]>;
};

const loaders: DirectoryLoaderMap = {
  managers: listManagers,
  contractors: listContractors,
  customers: listCustomers,
  centers: listCenters,
  crew: listCrew,
  warehouses: listWarehouses,
  services: listServices,
  orders: listOrders,
  products: listProducts,
  training: listTraining,
  procedures: listProcedures,
  reports: listReports,
  feedback: listFeedback,
  activities: listActivities,
};

export async function listDirectoryResource<K extends DirectoryResourceKey>(key: K, limit?: number): Promise<DirectoryResourceMap[K][]> {
  const loader = loaders[key];
  return loader(limit);
}




