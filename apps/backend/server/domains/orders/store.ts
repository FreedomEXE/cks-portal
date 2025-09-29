import { query } from "../../db/connection";
import { normalizeIdentity } from "../identity";
import type { HubRole } from "../profile/types";
import type {
  HubOrderItem,
  HubOrdersPayload,
  OrderApprovalStage,
  OrderStatus,
  OrderViewerStatus,
} from "./types";

const FINAL_STATUSES = new Set<OrderStatus>(["rejected", "cancelled", "delivered", "service_completed", "service-created"]);
const HUB_ROLES: readonly HubRole[] = ["manager", "contractor", "customer", "center", "crew", "warehouse"];
const HUB_ROLE_SET = new Set<string>(HUB_ROLES);
const ACTOR_ROLES = new Set<HubRole>(['warehouse', 'manager', 'contractor', 'crew']);

type ParticipationType = 'creator' | 'destination' | 'actor' | 'watcher';

const ORDER_TYPE_MAP = new Map<string, "product" | "service">([
  ["product", "product"],
  ["service", "service"],
  ["prd", "product"],
  ["srv", "service"],
]);

const PRODUCT_SEQUENCE = "order_product_sequence";
const SERVICE_SEQUENCE = "order_service_sequence";
const PRODUCT_PREFIX = "PO";
const SERVICE_PREFIX = "SO";

interface OrderRow {
  order_id: string;
  order_type: string | null;
  title: string | null;
  status: string;
  next_actor_role: string | null;
  creator_id: string;
  creator_role: string | null;
  customer_id: string | null;
  center_id: string | null;
  contractor_id: string | null;
  manager_id: string | null;
  crew_id: string | null;
  assigned_warehouse: string | null;
  destination: string | null;
  destination_role: string | null;
  requested_date: Date | string | null;
  expected_date: Date | string | null;
  service_start_date: Date | string | null;
  delivery_date: Date | string | null;
  total_amount: string | number | null;
  currency: string | null;
  transformed_id: string | null;
  rejection_reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  line_number: number;
  catalog_item_code: string | null;
  name: string;
  item_type: "product" | "service";
  description: string | null;
  quantity: number | string | null;
  unit_of_measure: string | null;
  unit_price: number | string | null;
  currency: string | null;
  total_price: number | string | null;
  metadata: Record<string, unknown> | null;
}

interface CatalogProductRow {
  product_id: string;
  name: string;
  description: string | null;
  unit_of_measure: string | null;
  package_size: string | null;
  metadata: Record<string, unknown> | null;
}

interface CatalogServiceRow {
  service_id: string;
  name: string;
  description: string | null;
  unit_of_measure: string | null;
  duration_minutes: number | null;
  metadata: Record<string, unknown> | null;
}

interface CreateOrderItemInput {
  catalogCode: string;
  quantity: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateOrderInput {
  orderType: "service" | "product";
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

export type OrderActionType = "accept" | "reject" | "deliver" | "cancel" | "create-service";

export interface OrderActionInput {
  orderId: string;
  actorRole: HubRole;
  actorCode: string;
  action: OrderActionType;
  transformedId?: string | null;
  notes?: string | null;
}

function normalizeStatus(value: string | null | undefined): OrderStatus {
  const normalized = (value ?? "").trim().toLowerCase().replace(/_/g, '_');
  switch (normalized) {
    // New statuses
    case "pending_warehouse":
    case "awaiting_delivery":
    case "delivered":
    case "pending_manager":
    case "pending_contractor":
    case "pending_crew":
    case "service_in_progress":
    case "service_completed":
    case "cancelled":
    case "rejected":
      return normalized as OrderStatus;
    // Legacy statuses (map to new ones)
    case "pending":
      return "pending_warehouse"; // Default to product flow for legacy
    case "in-progress":
      return "awaiting_delivery";
    case "approved":
      return "pending_contractor";
    case "service-created":
      return "service_completed";
    default:
      return "pending_warehouse";
  }
}

function normalizeRole(value: string | null | undefined): HubRole | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return HUB_ROLE_SET.has(normalized) ? (normalized as HubRole) : null;
}

function normalizeCodeValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = normalizeIdentity(value);
  if (normalized) {
    return normalized;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function parseOrderType(raw: string | null | undefined): "product" | "service" {
  if (!raw) {
    return "product";
  }
  const normalized = raw.trim().toLowerCase();
  return ORDER_TYPE_MAP.get(normalized) ?? "product";
}

function toIso(input: Date | string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  const value = input instanceof Date ? input : new Date(input);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function formatMoney(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(2) : null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? trimmed : parsed.toFixed(2);
}

function viewerStatusFrom(options: {
  status: OrderStatus;
  nextActorRole: HubRole | null;
  nextActorCode: string | null;
  viewerRole: HubRole | null;
  viewerCode: string | null;
  creatorCode: string | null;
}): OrderViewerStatus {
  const { status, nextActorRole, nextActorCode, viewerRole, viewerCode, creatorCode } = options;

  // Terminal statuses map directly
  if (status === 'cancelled') return 'cancelled';
  if (status === 'rejected') return 'rejected';
  if (status === 'delivered' || status === 'service_completed') return 'completed';

  const normalizedViewerCode = viewerCode ? viewerCode : null;
  const normalizedCreator = creatorCode ? creatorCode : null;
  const normalizedNextActorCode = nextActorCode ? nextActorCode : null;

  // Check if viewer needs to act (they are the next actor)
  const statusIsPending = status.startsWith('pending_') || status === 'awaiting_delivery';
  const needsToAct =
    statusIsPending &&
    !!nextActorRole &&
    viewerRole === nextActorRole &&
    (!normalizedNextActorCode || normalizedNextActorCode === normalizedViewerCode);

  if (needsToAct) {
    return 'pending';
  }

  // Check if viewer is the requester/creator
  const isRequester =
    !!normalizedCreator &&
    !!normalizedViewerCode &&
    normalizedCreator === normalizedViewerCode;

  if (isRequester) {
    return 'in-progress';
  }

  // For everyone else, show in-progress for active orders
  return 'in-progress';
}
function deriveCreatorStageStatus(status: OrderStatus): OrderApprovalStage['status'] {
  switch (status) {
    case 'cancelled':
      return 'cancelled';
    case 'rejected':
      return 'rejected';
    case 'delivered':
      return 'delivered';
    case 'service-created':
      return 'service-created';
    default:
      return 'requested';
  }
}

function deriveFulfillmentStageStatus(
  orderType: 'product' | 'service',
  status: OrderStatus,
): OrderApprovalStage['status'] {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'in-progress':
      return orderType === 'product' ? 'accepted' : 'waiting';
    case 'approved':
      return orderType === 'product' ? 'accepted' : 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'delivered':
      return 'delivered';
    case 'service-created':
      return 'service-created';
    default:
      return 'pending';
  }
}

function determineNextActorCode(row: OrderRow, nextActorRole: HubRole | null): string | null {
  switch (nextActorRole) {
    case 'warehouse':
      return normalizeCodeValue(row.assigned_warehouse);
    case 'manager':
      return normalizeCodeValue(row.manager_id);
    case 'contractor':
      return normalizeCodeValue(row.contractor_id);
    case 'crew':
      return normalizeCodeValue(row.crew_id);
    case 'customer':
      return normalizeCodeValue(row.customer_id);
    case 'center':
      return normalizeCodeValue(row.center_id);
    default:
      return null;
  }
}

function coerceQuantity(value: number | string | null): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildApprovalStages(
  row: OrderRow,
  orderType: 'product' | 'service',
  status: OrderStatus,
): OrderApprovalStage[] {
  const stages: OrderApprovalStage[] = [];
  const creatorRole = normalizeRole(row.creator_role) ?? 'center';
  const creatorStatus = deriveCreatorStageStatus(status);
  stages.push({
    role: creatorRole,
    status: creatorStatus,
    userId: normalizeCodeValue(row.creator_id),
    timestamp: toIso(row.requested_date),
  });

  const fallbackFulfillmentRole: HubRole = orderType === 'service' ? 'manager' : 'warehouse';
  const fulfillmentRole = normalizeRole(row.next_actor_role) ?? fallbackFulfillmentRole;
  const fulfillmentStatus = deriveFulfillmentStageStatus(orderType, status);

  let fulfillmentUserId: string | null = null;
  switch (fulfillmentRole) {
    case 'warehouse':
      fulfillmentUserId = normalizeCodeValue(row.assigned_warehouse);
      break;
    case 'manager':
      fulfillmentUserId = normalizeCodeValue(row.manager_id);
      break;
    case 'contractor':
      fulfillmentUserId = normalizeCodeValue(row.contractor_id);
      break;
    case 'crew':
      fulfillmentUserId = normalizeCodeValue(row.crew_id);
      break;
    case 'customer':
      fulfillmentUserId = normalizeCodeValue(row.customer_id) ?? null;
      break;
    case 'center':
      fulfillmentUserId = normalizeCodeValue(row.center_id) ?? null;
      break;
    default:
      fulfillmentUserId = null;
  }

  const fulfillmentTimestamp =
    FINAL_STATUSES.has(status) || fulfillmentStatus === 'accepted' || fulfillmentStatus === 'approved'
      ? toIso(row.delivery_date ?? row.service_start_date ?? row.updated_at)
      : null;

  stages.push({
    role: fulfillmentRole,
    status: fulfillmentStatus,
    userId: fulfillmentUserId,
    timestamp: fulfillmentTimestamp,
  });

  return stages;
}

function mapOrderRow(
  row: OrderRow,
  items: OrderItemRow[],
  context?: { viewerRole?: HubRole | null; viewerCode?: string | null },
): HubOrderItem {
  const creatorCode = normalizeCodeValue(row.creator_id);
  const orderType = parseOrderType(row.order_type);
  const status = normalizeStatus(row.status);
  const nextActorRole = normalizeRole(row.next_actor_role);
  const viewerRole = context?.viewerRole ?? null;
  const viewerCode = context?.viewerCode ? normalizeCodeValue(context.viewerCode) : null;
  const normalizedDestination = normalizeCodeValue(row.destination);
  const normalizedCenter = normalizeCodeValue(row.center_id);
  const normalizedCustomer = normalizeCodeValue(row.customer_id);
  const nextActorCode = determineNextActorCode(row, nextActorRole);

  const lineItems = items.map((item, index) => ({
    id: item.id ?? `${row.order_id}-${index + 1}`,
    code: item.catalog_item_code,
    name: item.name,
    description: item.description ?? null,
    itemType: item.item_type,
    quantity: coerceQuantity(item.quantity),
    unitOfMeasure: item.unit_of_measure ?? null,
    unitPrice: formatMoney(item.unit_price),
    currency: item.currency ?? row.currency ?? 'USD',
    totalPrice: formatMoney(item.total_price),
    metadata: item.metadata ?? null,
  }));

  const approvalStages = buildApprovalStages(row, orderType, status);

  return {
    orderId: row.order_id,
    orderType,
    title: row.title ?? (orderType === 'product' ? 'Product Order' : 'Service Order'),
    requestedBy: creatorCode ?? row.creator_id ?? null,
    requesterRole: normalizeRole(row.creator_role),
    destination: normalizedDestination ?? normalizedCenter ?? null,
    destinationRole: normalizeRole(row.destination_role) ?? (row.center_id ? 'center' : null),
    requestedDate: toIso(row.requested_date ?? row.created_at),
    expectedDate: toIso(row.expected_date),
    serviceStartDate: toIso(row.service_start_date),
    deliveryDate: toIso(row.delivery_date),
    status,
    viewerStatus: viewerStatusFrom({
      status,
      nextActorRole,
      nextActorCode,
      viewerRole,
      viewerCode,
      creatorCode,
    }),
    approvalStages,
    items: lineItems,
    totalAmount: formatMoney(row.total_amount),
    currency: row.currency ?? 'USD',
    transformedId: row.transformed_id ?? null,
    nextActorRole,
    rejectionReason: row.rejection_reason ?? null,
    notes: row.notes ?? null,
    id: row.order_id,
    customerId: normalizedCustomer ?? null,
    centerId: normalizedCenter ?? null,
    serviceId: orderType === 'service' ? row.transformed_id ?? null : null,
    assignedWarehouse: normalizeCodeValue(row.assigned_warehouse),
    orderDate: toIso(row.requested_date ?? row.created_at),
    completionDate: toIso(row.delivery_date ?? row.updated_at),
  };
}

async function loadOrderItems(orderIds: readonly string[]): Promise<Map<string, OrderItemRow[]>> {
  const map = new Map<string, OrderItemRow[]>();
  if (orderIds.length === 0) {
    return map;
  }
  const result = await query<OrderItemRow>(
    `SELECT
       id::text,
       order_id,
       line_number,
       catalog_item_code,
       name,
       item_type::text AS item_type,
       description,
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

  for (const row of result.rows) {
    const bucket = map.get(row.order_id) ?? [];
    bucket.push(row);
    map.set(row.order_id, bucket);
  }
  return map;
}

async function fetchOrders(whereClause: string, params: readonly unknown[], context?: { viewerRole?: HubRole | null; viewerCode?: string | null }): Promise<HubOrderItem[]> {
  const result = await query<OrderRow>(
    `SELECT
       order_id,
       order_type,
       title,
       status,
       next_actor_role,
       creator_id,
       creator_role,
       customer_id,
       center_id,
       contractor_id,
       manager_id,
       crew_id,
       assigned_warehouse,
       destination,
       destination_role,
       requested_date,
       expected_date,
       service_start_date,
       delivery_date,
       total_amount,
       currency,
       transformed_id,
       rejection_reason,
       notes,
       metadata,
       created_at,
       updated_at
     FROM orders
     WHERE ${whereClause}
     ORDER BY requested_date DESC NULLS LAST, created_at DESC NULLS LAST, order_id DESC`,
    params
  );

  if (result.rows.length === 0) {
    return [];
  }

  const orderIds = result.rows.map((row) => row.order_id);
  const itemsMap = await loadOrderItems(orderIds);
  return result.rows.map((row) => mapOrderRow(row, itemsMap.get(row.order_id) ?? [], context));
}

function buildRoleFilter(role: HubRole, cksCode: string): { clause: string; params: unknown[] } {
  // Eventually this should use order_participants table
  // For now, using creator_id and legacy fields for compatibility
  switch (role) {
    case "customer":
      return { clause: "creator_id = $1 OR customer_id = $1", params: [cksCode] };
    case "center":
      return { clause: "creator_id = $1 OR center_id = $1 OR destination = $1", params: [cksCode] };
    case "manager":
      return { clause: "manager_id = $1 OR creator_id = $1", params: [cksCode] };
    case "contractor":
      return { clause: "contractor_id = $1 OR creator_id = $1", params: [cksCode] };
    case "crew":
      return { clause: "crew_id = $1 OR creator_id = $1", params: [cksCode] };
    case "warehouse":
      return { clause: "assigned_warehouse = $1 OR destination = $1", params: [cksCode] };
    default:
      return { clause: "creator_id = $1", params: [cksCode] };
  }
}

async function getOrdersForRole(role: HubRole, cksCode: string): Promise<HubOrderItem[]> {
  const normalized = normalizeCodeValue(cksCode);
  if (!normalized) {
    throw new Error("Invalid CKS code");
  }
  const { clause, params } = buildRoleFilter(role, normalized);
  return fetchOrders(clause, params, { viewerRole: role, viewerCode: normalized });
}

async function ensureParticipant(options: {
  orderId: string;
  role: HubRole;
  code: string | null | undefined;
  participationType: ParticipationType;
}): Promise<void> {
  const normalizedCode = normalizeCodeValue(options.code ?? null);
  if (!normalizedCode) {
    return;
  }
  await query(
    `INSERT INTO order_participants (order_id, participant_id, participant_role, participation_type)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (order_id, participant_id, participant_role)
     DO UPDATE SET participation_type = EXCLUDED.participation_type`,
    [options.orderId, normalizedCode, options.role, options.participationType]
  );
}

async function ensureParticipantList(
  orderId: string,
  participants: Partial<Record<HubRole, string | readonly string[]>> | undefined,
): Promise<void> {
  if (!participants) {
    return;
  }
  for (const [roleKey, codes] of Object.entries(participants)) {
    const role = normalizeRole(roleKey);
    if (!role || !codes) {
      continue;
    }
    const entries = Array.isArray(codes) ? codes : [codes];
    const participationType: ParticipationType = ACTOR_ROLES.has(role) ? 'actor' : 'watcher';
    for (const code of entries) {
      await ensureParticipant({ orderId, role, code, participationType });
    }
  }
}

async function fetchProducts(codes: readonly string[]): Promise<Map<string, CatalogProductRow>> {
  if (codes.length === 0) {
    return new Map();
  }
  const result = await query<CatalogProductRow>(
    `SELECT product_id, name, description, unit_of_measure, package_size, metadata
     FROM catalog_products
     WHERE product_id = ANY($1::text[])`,
    [codes]
  );
  const map = new Map<string, CatalogProductRow>();
  for (const row of result.rows) {
    map.set(row.product_id, row);
  }
  return map;
}

async function fetchServices(codes: readonly string[]): Promise<Map<string, CatalogServiceRow>> {
  if (codes.length === 0) {
    return new Map();
  }
  const result = await query<CatalogServiceRow>(
    `SELECT service_id, name, description, unit_of_measure, duration_minutes, metadata
     FROM catalog_services
     WHERE service_id = ANY($1::text[])`,
    [codes]
  );
  const map = new Map<string, CatalogServiceRow>();
  for (const row of result.rows) {
    map.set(row.service_id, row);
  }
  return map;
}

async function findDefaultWarehouse(): Promise<string | null> {
  const result = await query<{ warehouse_id: string }>(
    `SELECT warehouse_id
     FROM warehouses
     ORDER BY warehouse_id ASC
     LIMIT 1`
  );
  return result.rows[0]?.warehouse_id ?? null;
}

async function insertOrderItems(
  orderId: string,
  orderType: "product" | "service",
  items: readonly CreateOrderItemInput[],
): Promise<void> {
  const trimmedCodes = Array.from(new Set(items.map((item) => item.catalogCode.trim())));
  if (orderType === "product") {
    const products = await fetchProducts(trimmedCodes);
    let line = 1;
    for (const item of items) {
      const code = item.catalogCode.trim();
      const product = products.get(code);
      if (!product) {
        throw new Error(`Product ${item.catalogCode} not found in catalog.`);
      }
      const metadata = JSON.stringify(item.metadata ?? product.metadata ?? {});
      await query(
        `INSERT INTO order_items (
           order_id,
           line_number,
           catalog_item_code,
           name,
           item_type,
           description,
           quantity,
           unit_of_measure,
           unit_price,
           currency,
           total_price,
           metadata
         ) VALUES ($1, $2, $3, $4, 'product', $5, $6, $7, NULL, 'USD', NULL, $8::jsonb)` ,
        [
          orderId,
          line++,
          product.product_id,
          product.name,
          product.description ?? null,
          item.quantity,
          product.unit_of_measure ?? product.package_size ?? null,
          metadata,
        ]
      );
    }
    return;
  }

  const services = await fetchServices(trimmedCodes);
  let line = 1;
  for (const item of items) {
    const code = item.catalogCode.trim();
    const service = services.get(code);
    if (!service) {
      throw new Error(`Service ${item.catalogCode} not found in catalog.`);
    }
    const metadata = JSON.stringify(item.metadata ?? service.metadata ?? {});
    await query(
      `INSERT INTO order_items (
         order_id,
         line_number,
         catalog_item_code,
         name,
         item_type,
         description,
         quantity,
         unit_of_measure,
         unit_price,
         currency,
         total_price,
         metadata
       ) VALUES ($1, $2, $3, $4, 'service', $5, $6, $7, NULL, 'USD', NULL, $8::jsonb)` ,
      [
        orderId,
        line++,
        service.service_id,
        service.name,
        service.description ?? null,
        item.quantity,
        service.unit_of_measure ?? null,
        metadata,
      ]
    );
  }
}

export async function getHubOrders(role: HubRole, cksCode: string): Promise<HubOrdersPayload | null> {
  const normalized = normalizeCodeValue(cksCode);
  if (!normalized) {
    return null;
  }
  const orders = await getOrdersForRole(role, normalized);
  const serviceOrders = orders.filter((order) => order.orderType === "service");
  const productOrders = orders.filter((order) => order.orderType === "product");
  return {
    role,
    cksCode: normalized,
    serviceOrders,
    productOrders,
    orders: [...serviceOrders, ...productOrders],
  };
}

export async function createOrder(input: CreateOrderInput): Promise<HubOrderItem> {
  if (!input.items || input.items.length === 0) {
    throw new Error("At least one order item is required.");
  }
  const creatorCode = normalizeCodeValue(input.creator.code);
  if (!creatorCode) {
    throw new Error("Invalid creator code.");
  }

  const sequenceName = input.orderType === "product" ? PRODUCT_SEQUENCE : SERVICE_SEQUENCE;
  const typePrefix = input.orderType === "product" ? PRODUCT_PREFIX : SERVICE_PREFIX;

  const seqResult = await query<{ nextval: string }>(`SELECT nextval('${sequenceName}')::text AS nextval`);
  const seqNum = seqResult.rows[0]?.nextval ?? "1";
  const orderId = `${creatorCode}-${typePrefix}-${seqNum.padStart(3, "0")}`;

  const destinationCode = normalizeCodeValue(input.destination?.code ?? null);
  const destinationRole = input.destination?.role ?? null;

  let assignedWarehouse: string | null = null;
  let nextActorRole: HubRole | null = null;
  let status: string;

  if (input.orderType === "product") {
    if (destinationRole === "warehouse" && destinationCode) {
      assignedWarehouse = destinationCode;
    } else {
      const defaultWarehouse = await findDefaultWarehouse();
      assignedWarehouse = normalizeCodeValue(defaultWarehouse);
    }
    nextActorRole = "warehouse";
    status = "pending_warehouse";

  } else {
    nextActorRole = "manager";
    status = "pending_manager";
  }

  const now = new Date();
  const expectedDateValue = input.expectedDate ? new Date(input.expectedDate) : null;
  if (expectedDateValue && Number.isNaN(expectedDateValue.getTime())) {
    throw new Error("Invalid expected date.");
  }

  // Legacy fields - keeping as null for now to avoid breaking existing queries
  // These will be removed in a future migration
  const customerId: string | null = null;
  const centerId: string | null = null;
  const contractorId: string | null = null;
  const managerId: string | null = null;
  const crewId: string | null = null;

  const metadataValue = input.metadata ? JSON.stringify(input.metadata) : null;

  await query("BEGIN");
  try {
    await query(
      `INSERT INTO orders (
         order_id,
         order_type,
         title,
         status,
         next_actor_role,
         creator_id,
         creator_role,
         customer_id,
         center_id,
         contractor_id,
         manager_id,
         crew_id,
         assigned_warehouse,
         destination,
         destination_role,
         requested_date,
         expected_date,
         service_start_date,
         delivery_date,
         total_amount,
         currency,
         transformed_id,
         rejection_reason,
         notes,
         metadata,
         created_at,
         updated_at
       ) VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         $12,
         $13,
         $14,
         $15,
         $16,
         $17,
         NULL,
         NULL,
         NULL,
         'USD',
         NULL,
         NULL,
         $18,
         COALESCE($19::jsonb, '{}'::jsonb),
         $20,
         $20
       )`,
      [
        orderId,
        input.orderType,
        input.title ?? (input.orderType === "product" ? "Product Order" : "Service Order"),
        status,
        nextActorRole ?? null,
        creatorCode,
        input.creator.role,
        customerId,
        centerId,
        contractorId,
        managerId,
        crewId,
        assignedWarehouse,
        destinationCode,
        destinationRole ?? null,
        now,
        expectedDateValue,
        input.notes ?? null,
        metadataValue,
        now,
      ]
    );

    await insertOrderItems(orderId, input.orderType, input.items);

    // Add creator as participant
    await ensureParticipant({ orderId, role: input.creator.role, code: creatorCode, participationType: 'creator' });

    // Add destination as participant if specified
    if (destinationRole && destinationCode) {
      await ensureParticipant({ orderId, role: destinationRole, code: destinationCode, participationType: 'destination' });
    }

    // Add workflow-specific participants based on order type
    if (input.orderType === "product") {
      // Product orders always involve warehouse as an actor
      if (assignedWarehouse) {
        await ensureParticipant({ orderId, role: "warehouse", code: assignedWarehouse, participationType: 'actor' });
      }
    } else {
      // Service orders involve manager, contractor, and crew as actors
      // These will be populated as the workflow progresses
      // For now, just add the immediate next actor (manager)
      // The manager will be determined based on the creator's hierarchy
    }

    // Add any additional participants specified in the input
    await ensureParticipantList(orderId, input.participants);

    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }

  const created = await fetchOrderById(orderId, { viewerRole: input.creator.role, viewerCode: creatorCode });
  if (!created) {
    throw new Error("Order creation failed.");
  }
  return created;
}

async function fetchOrderById(orderId: string, context?: { viewerRole?: HubRole | null; viewerCode?: string | null }): Promise<HubOrderItem | null> {
  const orders = await fetchOrders("order_id = $1", [orderId], context);
  return orders[0] ?? null;
}

export async function applyOrderAction(input: OrderActionInput): Promise<HubOrderItem | null> {
  const orderResult = await query<OrderRow>(
    `SELECT
       order_id,
       order_type,
       title,
       status,
       next_actor_role,
       creator_id,
       creator_role,
       customer_id,
       center_id,
       contractor_id,
       manager_id,
       crew_id,
       assigned_warehouse,
       destination,
       destination_role,
       requested_date,
       expected_date,
       service_start_date,
       delivery_date,
       total_amount,
       currency,
       transformed_id,
       rejection_reason,
       notes,
       metadata,
       created_at,
       updated_at
     FROM orders
     WHERE order_id = $1
     LIMIT 1`,
    [input.orderId]
  );

  const row = orderResult.rows[0];
  if (!row) {
    throw new Error(`Order ${input.orderId} not found`);
  }

  const actorCodeNormalized = normalizeCodeValue(input.actorCode);
  const creatorCode = normalizeCodeValue(row.creator_id);
  const orderType = parseOrderType(row.order_type);
  const currentStatus = normalizeStatus(row.status);
  if (FINAL_STATUSES.has(currentStatus)) {
    throw new Error(`Cannot modify order in ${currentStatus} state`);
  }

  let newStatus: OrderStatus = currentStatus;
  let nextActorRole: HubRole | null = normalizeRole(row.next_actor_role);
  let deliveryDate: string | null = null;
  let serviceStartDate: string | null = null;
  let transformedId: string | null = null;
  let rejectionReason: string | null = row.rejection_reason ?? null;
  let assignedWarehouseValue: string | null = normalizeCodeValue(row.assigned_warehouse);

  switch (input.action) {
    case "accept":
      if (orderType === "product") {
        if (input.actorRole !== "warehouse") {
          throw new Error("Only warehouse users may accept product orders.");
        }
        newStatus = "awaiting_delivery";
        nextActorRole = "warehouse";
        assignedWarehouseValue = actorCodeNormalized ?? assignedWarehouseValue;
      } else {
        // Service order acceptance by manager
        if (input.actorRole === "manager") {
          newStatus = "pending_contractor";
          nextActorRole = "contractor";
        } else if (input.actorRole === "contractor") {
          newStatus = "pending_crew";
          nextActorRole = "crew";
        } else if (input.actorRole === "crew") {
          newStatus = "service_in_progress";
          nextActorRole = "crew";
        }
      }
      break;

    case "reject":
      if (!input.notes) {
        throw new Error("Rejection reason is required.");
      }
      newStatus = "rejected";
      nextActorRole = null;
      rejectionReason = input.notes;
      break;

    case "deliver":
      if (orderType !== "product") {
        throw new Error("Deliver action applies only to product orders.");
      }
      newStatus = "delivered";
      nextActorRole = null;
      deliveryDate = new Date().toISOString();
      break;

    case "complete":
      if (orderType !== "service") {
        throw new Error("Complete action applies only to service orders.");
      }
      newStatus = "service_completed";
      nextActorRole = null;
      serviceStartDate = new Date().toISOString();
      break;

    case "cancel":
      if (!actorCodeNormalized || !creatorCode || actorCodeNormalized !== creatorCode) {
        throw new Error('Only the creator can cancel an order.');
      }
      // Can only cancel orders that are not yet completed/delivered
      if (FINAL_STATUSES.has(currentStatus)) {
        throw new Error('Cannot cancel an order that is already completed.');
      }
      newStatus = 'cancelled';
      nextActorRole = null;
      break;

    case "create-service":
      if (orderType !== "service" || input.actorRole !== "manager") {
        throw new Error("Only managers may convert service orders.");
      }
      newStatus = "service-created";
      nextActorRole = null;
      transformedId = input.transformedId ?? `SVC-${Date.now()}`;
      serviceStartDate = new Date().toISOString();
      break;

    default:
      throw new Error(`Unknown action: ${input.action}`);
  }

  await query("BEGIN");
  try {
    await query(
      `UPDATE orders
       SET status = $1,
           next_actor_role = $2,
           rejection_reason = $3,
           notes = COALESCE($4, notes),
           delivery_date = COALESCE($5, delivery_date),
           service_start_date = COALESCE($6, service_start_date),
           transformed_id = COALESCE($7, transformed_id),
           assigned_warehouse = COALESCE($8, assigned_warehouse),
           updated_at = NOW()
       WHERE order_id = $9`,
      [
        newStatus,
        nextActorRole ?? null,
        rejectionReason,
        input.notes ?? null,
        deliveryDate,
        serviceStartDate,
        transformedId,
        assignedWarehouseValue,
        input.orderId,
      ]
    );

    await ensureParticipant({
      orderId: input.orderId,
      role: input.actorRole,
      code: actorCodeNormalized,
      participationType: "actor",
    });

    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }

  return fetchOrderById(input.orderId, { viewerRole: input.actorRole, viewerCode: actorCodeNormalized });
}


















