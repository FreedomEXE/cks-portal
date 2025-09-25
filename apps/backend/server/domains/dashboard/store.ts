import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubRole } from '../profile/types';
import type { CustomerDashboardPayload, HubDashboardPayload } from './types';

function toCount(row: { count?: string | number } | undefined): number {
  if (!row) {
    return 0;
  }
  const value = typeof row.count === 'number' ? row.count : Number(row.count ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

function normalizeStatus(status: string | null): string | null {
  if (!status) return null;
  // Transform 'assigned' and 'operational' to 'active'
  if (status === 'assigned' || status === 'operational') {
    return 'active';
  }
  return status;
}

async function getCustomerDashboard(cksCode: string): Promise<CustomerDashboardPayload | null> {
  const customerResult = await query<{ status: string | null }>(
    `SELECT status
     FROM customers
     WHERE UPPER(customer_id) = $1
     LIMIT 1`,
    [cksCode],
  );
  if (!customerResult.rowCount) {
    return null;
  }

  const centerResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM centers
     WHERE UPPER(customer_id) = $1`,
    [cksCode],
  );

  const crewResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM crew
     WHERE UPPER(assigned_center) IN (
       SELECT UPPER(center_id)
       FROM centers
       WHERE UPPER(customer_id) = $1
     )`,
    [cksCode],
  );

  const serviceResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM orders
     WHERE UPPER(customer_id) = $1`,
    [cksCode],
  );

  const pendingResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM orders
     WHERE UPPER(customer_id) = $1
       AND LOWER(status) IN ('pending', 'requested', 'in-progress', 'submitted')`,
    [cksCode],
  );

  return {
    role: 'customer',
    cksCode,
    serviceCount: toCount(serviceResult.rows[0]),
    centerCount: toCount(centerResult.rows[0]),
    crewCount: toCount(crewResult.rows[0]),
    pendingRequests: toCount(pendingResult.rows[0]),
    accountStatus: normalizeStatus(customerResult.rows[0]?.status ?? null),
  };
}

async function getManagerDashboard(cksCode: string): Promise<HubDashboardPayload | null> {
  const managerResult = await query<{ status: string | null }>(
    `SELECT status FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
    [cksCode],
  );
  if (!managerResult.rowCount) {
    return null;
  }

  const [contractors, customers, centers, crew, pendingOrders] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM contractors WHERE UPPER(cks_manager) = $1`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM customers WHERE UPPER(cks_manager) = $1`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM centers WHERE UPPER(cks_manager) = $1`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM crew WHERE UPPER(assigned_center) IN (
        SELECT UPPER(center_id) FROM centers WHERE UPPER(cks_manager) = $1
      )`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders
       WHERE UPPER(customer_id) IN (SELECT UPPER(customer_id) FROM customers WHERE UPPER(cks_manager) = $1)
       AND LOWER(status) IN ('pending', 'requested', 'in-progress')`,
      [cksCode],
    ),
  ]);

  return {
    role: 'manager',
    cksCode,
    contractorCount: toCount(contractors.rows[0]),
    customerCount: toCount(customers.rows[0]),
    centerCount: toCount(centers.rows[0]),
    crewCount: toCount(crew.rows[0]),
    pendingOrders: toCount(pendingOrders.rows[0]),
    accountStatus: normalizeStatus(managerResult.rows[0]?.status ?? null),
  };
}

async function getContractorDashboard(cksCode: string): Promise<HubDashboardPayload | null> {
  const contractorResult = await query<{ status: string | null }>(
    `SELECT status FROM contractors WHERE UPPER(contractor_id) = $1 LIMIT 1`,
    [cksCode],
  );
  if (!contractorResult.rowCount) {
    return null;
  }

  const [centers, crew, activeServices, pendingOrders] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM centers WHERE UPPER(contractor_id) = $1`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM crew WHERE UPPER(assigned_center) IN (
        SELECT UPPER(center_id) FROM centers WHERE UPPER(contractor_id) = $1
      )`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders
       WHERE UPPER(center_id) IN (SELECT UPPER(center_id) FROM centers WHERE UPPER(contractor_id) = $1)
       AND LOWER(status) IN ('active', 'in-progress')`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders
       WHERE UPPER(center_id) IN (SELECT UPPER(center_id) FROM centers WHERE UPPER(contractor_id) = $1)
       AND LOWER(status) = 'pending'`,
      [cksCode],
    ),
  ]);

  return {
    role: 'contractor',
    cksCode,
    centerCount: toCount(centers.rows[0]),
    crewCount: toCount(crew.rows[0]),
    activeServices: toCount(activeServices.rows[0]),
    pendingOrders: toCount(pendingOrders.rows[0]),
    accountStatus: normalizeStatus(contractorResult.rows[0]?.status ?? null),
  };
}

async function getCenterDashboard(cksCode: string): Promise<HubDashboardPayload | null> {
  const centerResult = await query<{ status: string | null; customer_id: string | null }>(
    `SELECT status, customer_id FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
    [cksCode],
  );
  if (!centerResult.rowCount) {
    return null;
  }

  const [crew, activeServices, pendingRequests, equipment] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM crew WHERE UPPER(assigned_center) = $1`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders WHERE UPPER(center_id) = $1 AND LOWER(status) = 'active'`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders WHERE UPPER(center_id) = $1 AND LOWER(status) = 'pending'`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products WHERE UPPER(assigned_center) = $1`,
      [cksCode],
    ),
  ]);

  return {
    role: 'center',
    cksCode,
    crewCount: toCount(crew.rows[0]),
    activeServices: toCount(activeServices.rows[0]),
    pendingRequests: toCount(pendingRequests.rows[0]),
    equipmentCount: toCount(equipment.rows[0]),
    accountStatus: normalizeStatus(centerResult.rows[0]?.status ?? null),
    customerId: centerResult.rows[0]?.customer_id ?? null,
  };
}

async function getCrewDashboard(cksCode: string): Promise<HubDashboardPayload | null> {
  const crewResult = await query<{ status: string | null; assigned_center: string | null }>(
    `SELECT status, assigned_center FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
    [cksCode],
  );
  if (!crewResult.rowCount) {
    return null;
  }

  const [activeServices, completedToday, trainings] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders
       WHERE UPPER(center_id) = $1 AND LOWER(status) = 'active'`,
      [crewResult.rows[0]?.assigned_center ?? ''],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders
       WHERE UPPER(center_id) = $1 AND DATE(completion_date) = CURRENT_DATE`,
      [crewResult.rows[0]?.assigned_center ?? ''],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM training WHERE UPPER(crew_member_id) = $1`,
      [cksCode],
    ),
  ]);

  return {
    role: 'crew',
    cksCode,
    activeServices: toCount(activeServices.rows[0]),
    completedToday: toCount(completedToday.rows[0]),
    trainings: toCount(trainings.rows[0]),
    accountStatus: normalizeStatus(crewResult.rows[0]?.status ?? null),
    assignedCenter: crewResult.rows[0]?.assigned_center ?? null,
  };
}

async function getWarehouseDashboard(cksCode: string): Promise<HubDashboardPayload | null> {
  const warehouseResult = await query<{ status: string | null }>(
    `SELECT status FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
    [cksCode],
  );
  if (!warehouseResult.rowCount) {
    return null;
  }

  const [inventory, pendingOrders, deliveriesScheduled, lowStock] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products WHERE UPPER(warehouse_id) = $1`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders WHERE UPPER(assigned_warehouse) = $1 AND LOWER(status) = 'pending'`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM deliveries WHERE UPPER(warehouse_id) = $1 AND delivery_date >= CURRENT_DATE`,
      [cksCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products WHERE UPPER(warehouse_id) = $1 AND stock_level < reorder_point`,
      [cksCode],
    ),
  ]);

  return {
    role: 'warehouse',
    cksCode,
    inventoryCount: toCount(inventory.rows[0]),
    pendingOrders: toCount(pendingOrders.rows[0]),
    deliveriesScheduled: toCount(deliveriesScheduled.rows[0]),
    lowStockItems: toCount(lowStock.rows[0]),
    accountStatus: normalizeStatus(warehouseResult.rows[0]?.status ?? null),
  };
}

export async function getHubDashboard(role: HubRole, cksCode: string): Promise<HubDashboardPayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  switch (role) {
    case 'customer':
      return getCustomerDashboard(normalizedCode);
    case 'manager':
      return getManagerDashboard(normalizedCode);
    case 'contractor':
      return getContractorDashboard(normalizedCode);
    case 'center':
      return getCenterDashboard(normalizedCode);
    case 'crew':
      return getCrewDashboard(normalizedCode);
    case 'warehouse':
      return getWarehouseDashboard(normalizedCode);
    default:
      return null;
  }
}


