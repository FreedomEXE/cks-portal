import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubRole } from '../profile/types';
import type {
  HubOrderItem,
  HubOrdersPayload,
  OrderStatus,
  OrderViewerStatus,
} from './types';

const FINAL_STATUSES = new Set<OrderStatus>(['rejected', 'cancelled', 'delivered', 'service-created']);

type LegacyOrderRow = {
  order_id: string;
  customer_id: string | null;
  center_id: string | null;
  service_id: string | null;
  order_date: Date | string | null;
  completion_date: Date | string | null;
  total_amount: string | number | null;
  status: string | null;
  notes: string | null;
  assigned_warehouse: string | null;
};

function toIso(input: Date | string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  const value = input instanceof Date ? input : new Date(input);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function normalizeStatus(value: string | null | undefined): OrderStatus {
  const normalized = (value ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'in-progress':
    case 'approved':
    case 'rejected':
    case 'cancelled':
    case 'delivered':
    case 'service-created':
      return normalized;
    default:
      return 'pending';
  }
}

function viewerStatusFrom(status: OrderStatus): OrderViewerStatus {
  if (status === 'pending') {
    return 'pending';
  }
  if (FINAL_STATUSES.has(status)) {
    return status as OrderViewerStatus;
  }
  return 'in-progress';
}

function formatMoney(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toFixed(2) : null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? trimmed : parsed.toFixed(2);
}

function mapLegacyOrder(row: LegacyOrderRow): HubOrderItem {
  const orderType = row.service_id ? 'service' : 'product';
  const status = normalizeStatus(row.status);

  return {
    orderId: row.order_id,
    orderType,
    title: row.service_id ?? row.order_id,
    requestedBy: row.customer_id ?? null,
    requesterRole: null,
    destination: row.center_id ?? null,
    destinationRole: row.center_id ? 'center' : null,
    requestedDate: toIso(row.order_date),
    expectedDate: toIso(row.completion_date),
    serviceStartDate: null,
    deliveryDate: null,
    status,
    viewerStatus: viewerStatusFrom(status),
    approvalStages: [],
    items: [],
    totalAmount: formatMoney(row.total_amount),
    currency: null,
    transformedId: row.service_id ?? null,
    nextActorRole: null,
    rejectionReason: null,
    notes: row.notes ?? null,
  };
}

async function fetchLegacyOrders(queryText: string, params: readonly unknown[]): Promise<HubOrderItem[]> {
  const result = await query<LegacyOrderRow>(queryText, params);
  return result.rows.map(mapLegacyOrder);
}

async function getCustomerOrders(cksCode: string): Promise<HubOrdersPayload> {
  const normalized = normalizeIdentity(cksCode);
  const orders = await fetchLegacyOrders(
    `SELECT order_id, customer_id, center_id, service_id, order_date, completion_date,
            total_amount, status, notes, assigned_warehouse
     FROM orders
     WHERE UPPER(customer_id) = $1
     ORDER BY order_date DESC NULLS LAST, order_id DESC`,
    [normalized],
  );

  const serviceOrders = orders.filter((order) => order.orderType === 'service');
  const productOrders = orders.filter((order) => order.orderType === 'product');

  return {
    role: 'customer',
    cksCode: normalized,
    serviceOrders,
    productOrders,
  };
}

async function getManagerOrders(cksCode: string): Promise<HubOrdersPayload> {
  const normalized = normalizeIdentity(cksCode);
  const orders = await fetchLegacyOrders(
    `SELECT order_id, customer_id, center_id, service_id, order_date, completion_date,
            total_amount, status, notes, assigned_warehouse
     FROM orders
     WHERE UPPER(customer_id) IN (
       SELECT UPPER(customer_id) FROM customers WHERE UPPER(manager_id) = $1
     )
     ORDER BY order_date DESC NULLS LAST, order_id DESC`,
    [normalized],
  );

  return {
    role: 'manager',
    cksCode: normalized,
    serviceOrders: orders.filter((order) => order.orderType === 'service'),
    productOrders: orders.filter((order) => order.orderType === 'product'),
  };
}

async function getContractorOrders(cksCode: string): Promise<HubOrdersPayload> {
  const normalized = normalizeIdentity(cksCode);
  const orders = await fetchLegacyOrders(
    `SELECT order_id, customer_id, center_id, service_id, order_date, completion_date,
            total_amount, status, notes, assigned_warehouse
     FROM orders
     WHERE UPPER(center_id) IN (
       SELECT UPPER(center_id) FROM centers WHERE UPPER(contractor_id) = $1
     )
     ORDER BY order_date DESC NULLS LAST, order_id DESC`,
    [normalized],
  );

  return {
    role: 'contractor',
    cksCode: normalized,
    serviceOrders: orders.filter((order) => order.orderType === 'service'),
    productOrders: orders.filter((order) => order.orderType === 'product'),
  };
}

async function getCenterOrders(cksCode: string): Promise<HubOrdersPayload> {
  const normalized = normalizeIdentity(cksCode);
  const orders = await fetchLegacyOrders(
    `SELECT order_id, customer_id, center_id, service_id, order_date, completion_date,
            total_amount, status, notes, assigned_warehouse
     FROM orders
     WHERE UPPER(center_id) = $1
     ORDER BY order_date DESC NULLS LAST, order_id DESC`,
    [normalized],
  );

  return {
    role: 'center',
    cksCode: normalized,
    serviceOrders: orders.filter((order) => order.orderType === 'service'),
    productOrders: orders.filter((order) => order.orderType === 'product'),
  };
}

async function getCrewOrders(cksCode: string): Promise<HubOrdersPayload> {
  const normalized = normalizeIdentity(cksCode);
  const crewRow = await query<{ assigned_center: string | null }>(
    `SELECT assigned_center FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
    [normalized],
  );

  const assignedCenter = crewRow.rows[0]?.assigned_center;
  if (!assignedCenter) {
    return {
      role: 'crew',
      cksCode: normalized,
      serviceOrders: [],
      productOrders: [],
    };
  }

  const orders = await fetchLegacyOrders(
    `SELECT order_id, customer_id, center_id, service_id, order_date, completion_date,
            total_amount, status, notes, assigned_warehouse
     FROM orders
     WHERE UPPER(center_id) = $1
     ORDER BY order_date DESC NULLS LAST, order_id DESC`,
    [assignedCenter.toUpperCase()],
  );

  return {
    role: 'crew',
    cksCode: normalized,
    serviceOrders: orders.filter((order) => order.orderType === 'service'),
    productOrders: orders.filter((order) => order.orderType === 'product'),
  };
}

async function getWarehouseOrders(cksCode: string): Promise<HubOrdersPayload> {
  const normalized = normalizeIdentity(cksCode);
  const orders = await fetchLegacyOrders(
    `SELECT order_id, customer_id, center_id, service_id, order_date, completion_date,
            total_amount, status, notes, assigned_warehouse
     FROM orders
     WHERE UPPER(assigned_warehouse) = $1
     ORDER BY order_date DESC NULLS LAST, order_id DESC`,
    [normalized],
  );

  return {
    role: 'warehouse',
    cksCode: normalized,
    serviceOrders: orders.filter((order) => order.orderType === 'service'),
    productOrders: orders.filter((order) => order.orderType === 'product'),
  };
}

export async function getHubOrders(role: HubRole, cksCode: string): Promise<HubOrdersPayload | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) {
    return null;
  }

  switch (role) {
    case 'customer':
      return getCustomerOrders(normalized);
    case 'manager':
      return getManagerOrders(normalized);
    case 'contractor':
      return getContractorOrders(normalized);
    case 'center':
      return getCenterOrders(normalized);
    case 'crew':
      return getCrewOrders(normalized);
    case 'warehouse':
      return getWarehouseOrders(normalized);
    default:
      return null;
  }
}

export interface CreateOrderItemInput {
  catalogCode: string;
  quantity: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateOrderInput {
  orderType: 'service' | 'product';
  creator: {
    code: string;
    role: HubRole;
  };
  title?: string | null;
  destination?: {
    code: string | null;
    role: HubRole | null;
  } | null;
  expectedDate?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  participants?: Partial<Record<HubRole, string | readonly string[]>>;
  items: readonly CreateOrderItemInput[];
}

export async function createOrder(): Promise<HubOrderItem> {
  throw new Error('Order creation is not available in this build.');
}

export type OrderActionType = 'accept' | 'reject' | 'deliver' | 'cancel' | 'create-service';

export interface OrderActionInput {
  orderId: string;
  actorRole: HubRole;
  actorCode: string;
  action: OrderActionType;
  transformedId?: string | null;
  notes?: string | null;
}

export async function applyOrderAction(): Promise<HubOrderItem | null> {
  throw new Error('Order actions are not available in this build.');
}
