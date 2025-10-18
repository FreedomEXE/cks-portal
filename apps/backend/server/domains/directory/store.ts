import { query } from '../../db/connection';
import type {
  ActivityEntry,
  CenterDirectoryEntry,
  CenterRow,
  ContractorDirectoryEntry,
  CrewDirectoryEntry,
  CrewRow,
  CustomerDirectoryEntry,
  CustomerRow,
  DirectoryResourceKey,
  DirectoryResourceMap,
  FeedbackDirectoryEntry,
  ManagerDirectoryEntry,
  OrderDirectoryEntry,
  ProcedureDirectoryEntry,
  ProductDirectoryEntry,
  ReportDirectoryEntry,
  ServiceDirectoryEntry,
  TrainingDirectoryEntry,
  WarehouseDirectoryEntry,
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

function isMissingColumnError(error: unknown, column: string): boolean {
  if (!(error instanceof Error) || typeof error.message !== 'string') {
    return false;
  }
  const sanitizedColumn = column.toLowerCase().replace(/['"]/g, '');
  return error.message.toLowerCase().includes(`column "${sanitizedColumn}" does not exist`);
}
type ManagerRow = {
  manager_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  territory: string | null;
  role: string | null;
  reports_to: string | null;
  address: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  archived_at: Date | null;
};

type ContractorRow = {
  contractor_id: string;
  cks_manager: string | null;
  name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  archived_at: Date | null;
};


type LegacyCrewRow = {
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
  manager_territory?: string | null;
  warehouse_type: string | null;
  main_contact: string | null;
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

type LegacyWarehouseRow = {
  warehouse_id: string;
  name: string | null;
  manager_id: string | null;
  manager: string | null;
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
  order_type: string | null;
  created_by: string | null;
  created_by_role: string | null;
  creator_id?: string | null;
  creator_role?: string | null;
  customer_id: string | null;
  center_id: string | null;
  service_id: string | null;
  order_date: Date | null;
  completion_date: Date | null;
  total_amount: string | number | null;
  status: string | null;
  notes: string | null;
  assigned_warehouse: string | null;
  destination: string | null;
  destination_role: string | null;
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
  // Assignment activities
  assignment_made: 'action',
  manager_assigned: 'action',
  contractor_assigned_to_manager: 'action',
  customer_assigned_to_contractor: 'action',
  center_assigned_to_customer: 'action',
  crew_assigned_to_center: 'action',
  order_assigned_to_warehouse: 'action',

  // Creation activities
  manager_created: 'action',
  contractor_created: 'action',
  customer_created: 'action',
  center_created: 'action',
  crew_created: 'action',
  warehouse_created: 'action',
  order_created: 'action',
  service_created: 'action',

  // Success/completion activities
  order_delivered: 'success',
  order_completed: 'success',
  service_completed: 'success',
  order_accepted: 'success',
  order_approved: 'success',

  // Warning/error activities
  order_cancelled: 'warning',
  order_rejected: 'warning',
  order_failed: 'warning',
  service_cancelled: 'warning',
  support_ticket_updated: 'warning',

  // Update activities
  order_updated: 'info',
  service_updated: 'info',
  profile_updated: 'info',
};

async function listManagers(limit = DEFAULT_LIMIT): Promise<ManagerDirectoryEntry[]> {
  const result = await query<ManagerRow>('SELECT manager_id, name, email, phone, territory, role, reports_to, address, status, created_at, updated_at, archived_at FROM managers WHERE archived_at IS NULL ORDER BY manager_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.manager_id, 'MGR'),
    name: row.name ?? row.manager_id,
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    territory: toNullableString(row.territory),
    role: toNullableString(row.role),
    reportsTo: toNullableString(row.reports_to),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  }));
}

async function listContractors(limit = DEFAULT_LIMIT): Promise<ContractorDirectoryEntry[]> {
  const result = await query<ContractorRow>('SELECT contractor_id, cks_manager, name, contact_person, email, phone, address, status, created_at, updated_at, archived_at FROM contractors WHERE archived_at IS NULL ORDER BY contractor_id LIMIT $1', [limit]);
    return result.rows.map((row) => ({
      id: formatPrefixedId(row.contractor_id, 'CON'),
      managerId: toNullableString(row.cks_manager),
      name: row.name ?? '',
      mainContact: toNullableString(row.contact_person),
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
  try {
    const result = await query<CustomerRow>('SELECT customer_id, cks_manager, name, main_contact, email, phone, address, status, num_centers, created_at, updated_at, archived_at FROM customers WHERE archived_at IS NULL ORDER BY customer_id LIMIT $1', [limit]);
    return result.rows.map((row) => ({
      id: formatPrefixedId(row.customer_id, 'CUS'),
      name: toNullableString(row.name),
      managerId: toNullableString(row.cks_manager),
      mainContact: toNullableString(row.main_contact),
      email: toNullableString(row.email),
      phone: toNullableString(row.phone),
      address: toNullableString(row.address),
      status: toNullableString(row.status),
      totalCenters: toNullableNumber(row.num_centers),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      archivedAt: toIso(row.archived_at),
    }));
  } catch (error) {
    console.error('Error listing customers:', error);
    throw error;
  }
}

async function listCenters(limit = DEFAULT_LIMIT): Promise<CenterDirectoryEntry[]> {
  try {
    const result = await query<CenterRow>('SELECT center_id, name, main_contact, email, phone, address, customer_id, contractor_id, cks_manager, status, created_at, updated_at, archived_at FROM centers WHERE archived_at IS NULL ORDER BY center_id LIMIT $1', [limit]);
    return result.rows.map((row) => ({
      id: formatPrefixedId(row.center_id, 'CEN'),
      name: toNullableString(row.name),
      mainContact: toNullableString(row.main_contact),
      email: toNullableString(row.email),
      phone: toNullableString(row.phone),
      address: toNullableString(row.address),
      customerId: toNullableString(row.customer_id),
      contractorId: toNullableString(row.contractor_id),
      managerId: toNullableString(row.cks_manager),
      status: toNullableString(row.status),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      archivedAt: toIso(row.archived_at),
    }));
  } catch (error) {
    console.error('Error listing centers:', error);
    throw error;
  }
}

async function listCrew(limit = DEFAULT_LIMIT): Promise<CrewDirectoryEntry[]> {
  try {
    const result = await query<
      CrewRow & { manager_territory: string | null }
    >(
      `SELECT c.crew_id, c.name, c.emergency_contact, c.email, c.phone, c.address, c.assigned_center, c.status,
              c.created_at, c.updated_at, c.archived_at,
              m.territory AS manager_territory
       FROM crew c
       LEFT JOIN centers ce ON UPPER(ce.center_id) = UPPER(c.assigned_center)
       LEFT JOIN managers m ON UPPER(m.manager_id) = UPPER(ce.cks_manager)
       WHERE c.archived_at IS NULL
       ORDER BY c.crew_id
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: formatPrefixedId(row.crew_id, 'CRW'),
      name: toNullableString(row.name),
      emergencyContact: toNullableString(row.emergency_contact),
      email: toNullableString(row.email),
      phone: toNullableString(row.phone),
      address: toNullableString(row.address),
      assignedCenter: toNullableString(row.assigned_center),
      territory: toNullableString((row as any).manager_territory ?? null),
      status: toNullableString(row.status),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      archivedAt: toIso(row.archived_at),
    }));
  } catch (error) {
    console.error('Error listing crew:', error);
    throw error;
  }
}

async function listWarehouses(limit = DEFAULT_LIMIT): Promise<WarehouseDirectoryEntry[]> {
  try {
    const result = await query<WarehouseRow>('SELECT warehouse_id, name, manager_id, manager, warehouse_type, main_contact, address, phone, email, capacity, current_utilization, status, date_acquired, created_at, updated_at, archived_at FROM warehouses WHERE archived_at IS NULL ORDER BY warehouse_id LIMIT $1', [limit]);
    return result.rows.map((row) => ({
      id: formatPrefixedId(row.warehouse_id, 'WHS'),
      name: toNullableString(row.name),
      managerId: toNullableString(row.manager_id),
      managerName: toNullableString(row.manager),
      mainContact: toNullableString(row.main_contact),
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
  } catch (error) {
    if (isMissingColumnError(error, 'main_contact')) {
      const fallback = await query<LegacyWarehouseRow>('SELECT warehouse_id, name, manager_id, manager, warehouse_type, address, phone, email, capacity, current_utilization, status, date_acquired, created_at, updated_at, archived_at FROM warehouses ORDER BY warehouse_id LIMIT $1', [limit]);
      return fallback.rows.map((row) => ({
        id: formatPrefixedId(row.warehouse_id, 'WHS'),
        name: toNullableString(row.name),
        managerId: toNullableString(row.manager_id),
        managerName: toNullableString(row.manager),
        mainContact: toNullableString(row.manager),
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
    throw error;
  }
}

async function listServices(limit = DEFAULT_LIMIT): Promise<ServiceDirectoryEntry[]> {
  const allServices: ServiceDirectoryEntry[] = [];

  // Query catalog services (SRV-001, SRV-002, etc.)
  try {
    const catalog = await query<{
      service_id: string;
      name: string;
      category: string | null;
      description: string | null;
      is_active: boolean | null;
      managed_by: string | null;
      created_at: Date | null;
      updated_at: Date | null;
      metadata: any | null;
    }>(
      `SELECT service_id, name, category, description, is_active, managed_by, metadata, created_at, updated_at
       FROM catalog_services
       WHERE is_active = TRUE
       ORDER BY service_id
       LIMIT $1`,
      [limit]
    );
    const catalogServices = catalog.rows.map((row) => ({
      id: formatPrefixedId(row.service_id, 'SRV'),
      name: toNullableString(row.name),
      category: toNullableString(row.category),
      description: toNullableString(row.description),
      pricingModel: null,
      managedBy: toNullableString(row.managed_by),
      status: row.is_active ? 'active' : 'inactive',
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      // extra for admin UI
      metadata: row.metadata ?? null,
    }));
    allServices.push(...catalogServices);
  } catch (err) {
    console.error('[directory] Failed to query catalog_services:', err);
  }

  // Query active service instances (CEN-010-SRV-003, etc.)
  try {
    const result = await query<ServiceRow>(
      'SELECT service_id, service_name, category, description, pricing_model, requirements, status, created_at, updated_at FROM services WHERE archived_at IS NULL ORDER BY service_id LIMIT $1',
      [limit],
    );
    const activeServices = result.rows.map((row) => ({
      id: formatPrefixedId(row.service_id, 'SRV'),
      name: toNullableString(row.service_name),
      category: toNullableString(row.category),
      description: toNullableString(row.description),
      pricingModel: toNullableString(row.pricing_model),
      managedBy: null,
      status: toNullableString(row.status),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    }));
    allServices.push(...activeServices);
  } catch (err) {
    console.error('[directory] Failed to query services table:', err);
  }

  return allServices;
}

async function listOrders(limit = DEFAULT_LIMIT): Promise<OrderDirectoryEntry[]> {
  const result = await query<OrderRow>(
    `SELECT
       order_id,
       order_type,
       created_by,
       created_by_role,
       creator_id,
       creator_role,
       customer_id,
       center_id,
       transformed_id AS service_id,
       requested_date AS order_date,
       delivery_date AS completion_date,
       total_amount,
       status,
       notes,
       assigned_warehouse,
       destination,
       destination_role,
       metadata,
       created_at,
       updated_at
     FROM orders
     WHERE archived_at IS NULL
     ORDER BY order_id
     LIMIT $1`,
    [limit]
  );
  if (!result || !result.rows) {
    return [];
  }

  // Fetch order items for all orders
  const orderIds = result.rows.map(row => row.order_id);
  const itemsResult = await query<any>(
    `SELECT
       order_id,
       line_number,
       catalog_item_code,
       name,
       description,
       item_type,
       quantity,
       unit_of_measure,
       unit_price,
       currency,
       total_price,
       metadata
     FROM order_items
     WHERE order_id = ANY($1::text[])
     ORDER BY order_id, line_number`,
    [orderIds]
  );

  // Map items by order_id
  const itemsMap = new Map<string, any[]>();
  for (const itemRow of itemsResult.rows) {
    const items = itemsMap.get(itemRow.order_id) || [];
    items.push({
      id: `${itemRow.order_id}-${itemRow.line_number}`,
      code: itemRow.catalog_item_code,
      name: itemRow.name,
      description: itemRow.description,
      itemType: itemRow.item_type,
      quantity: itemRow.quantity,
      unitOfMeasure: itemRow.unit_of_measure,
      unitPrice: itemRow.unit_price,
      currency: itemRow.currency,
      totalPrice: itemRow.total_price,
      metadata: itemRow.metadata,
    });
    itemsMap.set(itemRow.order_id, items);
  }

  return result.rows.map((row) => {
    // Derive createdBy/Role when missing
    const rawId = toNullableString(row.created_by) || toNullableString(row.creator_id);
    let createdBy = rawId;
    let createdByRole = toNullableString(row.created_by_role) || toNullableString(row.creator_role);
    if (!createdBy) {
      // Try to derive from order_id prefix like CEN-010-PO-023
      const m = String(row.order_id || '').match(/^[A-Za-z]+-\d+/);
      if (m) {
        createdBy = m[0];
      }
    }
    if (!createdByRole && createdBy) {
      const prefix = createdBy.split('-')[0]?.toLowerCase();
      const roleMap: Record<string, string> = { mgr: 'manager', con: 'contractor', cus: 'customer', cen: 'center', crw: 'crew', whs: 'warehouse' };
      createdByRole = roleMap[prefix] || null;
    }

    return ({
      id: formatPrefixedId(row.order_id, 'ORD'),
      customerId: toNullableString(row.customer_id),
      centerId: toNullableString(row.center_id),
      serviceId: toNullableString(row.service_id),
      orderDate: toIso(row.order_date),
      completionDate: toIso(row.completion_date),
      totalAmount: toNullableNumber(row.total_amount),
      status: toNullableString(row.status),
      notes: toNullableString(row.notes),
      assignedWarehouse: toNullableString(row.assigned_warehouse),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      // extra fields for UI consumption
      createdBy: createdBy,
      createdByRole: createdByRole,
      destination: toNullableString(row.destination),
      destinationRole: toNullableString(row.destination_role),
      orderType: toNullableString(row.order_type),
      items: itemsMap.get(row.order_id) || [],
      metadata: (row as any).metadata ?? null,
    });
  });
}

async function listProducts(limit = DEFAULT_LIMIT): Promise<ProductDirectoryEntry[]> {
  // Primary: live inventory from inventory_items (joined to catalog for details)
  try {
    const inv = await query<{
      product_id: string;
      product_name: string;
      category: string | null;
      description: string | null;
      price: number | string | null;
      unit: string | null;
      status: string | null;
      created_at: Date | null;
      updated_at: Date | null;
    }>(
      `SELECT
         ii.item_id AS product_id,
         ii.item_name AS product_name,
         cp.category,
         cp.description,
         cp.base_price AS price,
         cp.unit_of_measure AS unit,
         'active' AS status,
         ii.created_at,
         COALESCE(ii.updated_at, ii.created_at) AS updated_at
       FROM inventory_items ii
       LEFT JOIN catalog_products cp ON cp.product_id = ii.item_id
       WHERE ii.archived_at IS NULL
       ORDER BY ii.item_id
       LIMIT $1`,
      [limit]
    );
    if (inv.rows && inv.rows.length > 0) {
      return inv.rows.map((row) => ({
        id: formatPrefixedId(row.product_id, 'PRD'),
        rawId: toNullableString(row.product_id),
        name: row.product_name,
        category: toNullableString(row.category),
        description: toNullableString(row.description),
        price: toNullableNumber(row.price),
        unit: toNullableString(row.unit),
        status: toNullableString(row.status),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        source: 'products' as const,
      }));
    }
  } catch (error) {
    // Fall through to catalog fallback
  }

  // Fallback: catalog products (view only)
  const catalog = await query<{
    product_id: string;
    product_name: string;
    category: string | null;
    description: string | null;
    price: number | string | null;
    unit: string | null;
    status: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }>(
    `SELECT
       p.product_id,
       p.name AS product_name,
       p.category,
       p.description,
       p.base_price AS price,
       p.unit_of_measure AS unit,
       CASE WHEN p.is_active THEN 'active' ELSE 'inactive' END AS status,
       p.created_at,
       p.updated_at
     FROM catalog_products p
     WHERE p.is_active = TRUE
     ORDER BY p.product_id
     LIMIT $1`,
    [limit]
  );
  return catalog.rows.map((row) => ({
    id: formatPrefixedId(row.product_id, 'PRD'),
    rawId: toNullableString(row.product_id),
    name: row.product_name,
    category: toNullableString(row.category),
    description: toNullableString(row.description),
    price: toNullableNumber(row.price),
    unit: toNullableString(row.unit),
    status: toNullableString(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    source: 'catalog' as const,
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
    expense: toNullableNumber(row.expense),
    days: toNullableNumber(row.days),
    status: toNullableString(row.status),
    createdAt: null,
    updatedAt: null,
  }));
}

async function listProcedures(limit = DEFAULT_LIMIT): Promise<ProcedureDirectoryEntry[]> {
  const result = await query<ProcedureRow>('SELECT procedure_id, service, type, contractor, customer, center FROM procedures ORDER BY procedure_id LIMIT $1', [limit]);
  if (!result || !result.rows) {
    return [];
  }
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.procedure_id, 'PRC'),
    serviceId: toNullableString(row.service),
    type: toNullableString(row.type),
    contractorId: toNullableString(row.contractor),
    customerId: toNullableString(row.customer),
    centerId: toNullableString(row.center),
  }));
}

async function listReports(limit = DEFAULT_LIMIT): Promise<ReportDirectoryEntry[]> {
  const result = await query<ReportRow>('SELECT report_id, type, severity, title, description, center_id, customer_id, status, created_by_role, created_by_id, created_at, updated_at, archived_at FROM reports WHERE archived_at IS NULL ORDER BY report_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.report_id, 'RPT'),
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
  const result = await query<FeedbackRow>('SELECT feedback_id, kind, title, message, center_id, customer_id, created_by_role, created_by_id, created_at, archived_at FROM feedback WHERE archived_at IS NULL ORDER BY feedback_id LIMIT $1', [limit]);
  return result.rows.map((row) => ({
    id: formatPrefixedId(row.feedback_id, 'FBK'),
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

async function listActivities(limit = DEFAULT_LIMIT): Promise<ActivityEntry[]> {
  const result = await query<ActivityRow>('SELECT activity_id, description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at FROM system_activity ORDER BY created_at DESC', []);
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
