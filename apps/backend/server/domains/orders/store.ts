import { query, withTransaction } from "../../db/connection";
import { normalizeIdentity } from "../identity";
import { recordActivity } from "../activity/writer";
import type { HubRole } from "../profile/types";
import type {
  HubOrderItem,
  HubOrdersPayload,
  OrderApprovalStage,
  OrderStatus,
  OrderViewerStatus,
} from "./types";
import {
  getAllowedActions,
  getVisibleStatuses,
  getNextStatus,
  canTransition,
  isFinalStatus,
  isCompletedStatus,
  getActionLabel,
  getStatusLabel,
  getStatusColor
} from '@cks/policies';
import type {
  OrderContext,
  OrderParticipant,
  OrderAction,
  OrderType as PolicyOrderType
} from '@cks/policies';

const FINAL_STATUSES = new Set<OrderStatus>(["rejected", "cancelled", "delivered"]);
const HUB_ROLES: readonly HubRole[] = ["manager", "contractor", "customer", "center", "crew", "warehouse"];
const HUB_ROLE_SET = new Set<string>(HUB_ROLES);
const ACTOR_ROLES = new Set<HubRole>(['warehouse', 'manager', 'contractor', 'crew']);

// Using OrderParticipant from @cks/policies instead
// type ParticipationType = 'creator' | 'destination' | 'actor' | 'watcher';

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
const DISABLE_INVENTORY_CHECK = process.env.CKS_DISABLE_INVENTORY_CHECK === 'true';

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
  archived_at: Date | string | null;
  service_managed_by?: string | null;
  service_actual_start_time?: Date | string | null;
  // Service enrichment fields from JOIN queries
  catalog_service_id?: string | null;
  service_name?: string | null;
  catalog_service_name?: string | null;
  service_category?: string | null;
  catalog_service_category?: string | null;
  service_description?: string | null;
  catalog_service_description?: string | null;
  service_status?: string | null;
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

export type OrderActionType = "accept" | "reject" | "start-delivery" | "deliver" | "cancel" | "create-service" | "complete";

export interface OrderActionInput {
  orderId: string;
  actorRole: HubRole;
  actorCode: string;
  action: OrderActionType;
  transformedId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null; // For create-service action
}

function normalizeStatus(value: string | null | undefined): OrderStatus {
  const normalized = (value ?? "").trim().toLowerCase().replace(/_/g, '_');
  switch (normalized) {
    // Product statuses
    case "pending_warehouse":
    case "awaiting_delivery":
    case "delivered":
    // Service statuses
    case "pending_customer":
    case "pending_contractor":
    case "pending_manager":
    case "manager_accepted":
    case "crew_requested":
    case "crew_assigned":
    case "service_created":
    // Common statuses
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
    case "pending_crew":
      return "crew_requested";
    case "service_in_progress":
      return "service_created";
    case "service_completed":
    case "service-created":
      return "service_created";
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

function isTestCode(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.toUpperCase().includes('-TEST');
}

function buildTestOrderVisibilityClause(cksCode: string): string {
  const isTestViewer = isTestCode(cksCode);
  const testClause = `
    (
      COALESCE((o.metadata->>'is_test')::boolean, false) = true
      OR UPPER(o.order_id) LIKE '%-TEST%'
      OR UPPER(o.creator_id) LIKE '%-TEST%'
      OR UPPER(o.customer_id) LIKE '%-TEST%'
      OR UPPER(o.center_id) LIKE '%-TEST%'
      OR UPPER(o.contractor_id) LIKE '%-TEST%'
      OR UPPER(o.manager_id) LIKE '%-TEST%'
      OR UPPER(o.crew_id) LIKE '%-TEST%'
      OR UPPER(o.assigned_warehouse) LIKE '%-TEST%'
      OR UPPER(o.destination) LIKE '%-TEST%'
    )
  `;
  return isTestViewer ? `AND ${testClause}` : `AND NOT ${testClause}`;
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
  creatorRole?: HubRole | null;
  approvals?: readonly HubRole[];
}): OrderViewerStatus {
  const { status, nextActorRole, nextActorCode, viewerRole, viewerCode, creatorCode, creatorRole, approvals } = options;

  console.log(`[viewerStatusFrom] Input: status="${status}", viewerRole="${viewerRole}", viewerCode="${viewerCode}"`);

  // Terminal statuses map directly
  if (status === 'cancelled') return 'cancelled';
  if (status === 'rejected') return 'rejected';
  if (status === 'delivered' || status === 'service_created') {
    console.log(`[viewerStatusFrom] → Returning 'completed' for terminal status`);
    return 'completed';
  }

  const normalizedViewerCode = viewerCode ? viewerCode : null;
  const normalizedCreator = creatorCode ? creatorCode : null;
  const normalizedNextActorCode = nextActorCode ? nextActorCode : null;

  // Check if viewer is the creator
  const isCreator = normalizedCreator && normalizedViewerCode && normalizedCreator === normalizedViewerCode;

  // ACTION-BASED COLORS:
  // - YELLOW (pending): User needs to take action
  // - BLUE (in-progress): User is waiting/processing, no action needed

  // Product order flow
  if (status === 'pending_warehouse') {
    if (viewerRole === 'warehouse') {
      return 'pending'; // YELLOW - Warehouse needs to accept/reject
    }
    return 'in-progress'; // BLUE - Creator/others are waiting
  }

  if (status === 'awaiting_delivery') {
    // Everyone sees blue - order is being processed
    // Note: Warehouse can still deliver, but it's not urgent like pending
    return 'in-progress';
  }

  // Service order flow (derive next actor from approvals when provided)
  const serviceRolesByCreator: Record<HubRole, HubRole[]> = {
    center: ['customer', 'contractor', 'manager'],
    customer: ['contractor', 'manager'],
    contractor: ['manager'],
    manager: ['manager'],
    warehouse: ['manager'],
    admin: ['manager'],
    crew: ['manager']
  };

  if (creatorRole) {
    const chain = serviceRolesByCreator[creatorRole] || ['manager'];
    const approvalsList = (approvals ?? []).filter((r): r is HubRole => !!r) as HubRole[];
    const pendingIdx = Math.min(approvalsList.length, chain.length - 1);
    const computedNextRole = chain[pendingIdx] ?? nextActorRole;

    if (viewerRole && computedNextRole && viewerRole === computedNextRole) {
      return 'pending';
    }
    // For all other service statuses where viewer isn't the next actor
    return 'in-progress';
  }

  // Legacy status handling
  const statusIsPending = status.startsWith('pending_');
  const needsToAct =
    statusIsPending &&
    !!nextActorRole &&
    viewerRole === nextActorRole &&
    (!normalizedNextActorCode || normalizedNextActorCode === normalizedViewerCode);

  if (needsToAct) {
    return 'pending'; // YELLOW - Action required
  }

  // Default: show in-progress for all active orders
  return 'in-progress'; // BLUE - No action needed
}
function deriveCreatorStageStatus(_status: OrderStatus): OrderApprovalStage['status'] {
  // Keep the creator's canonical state stable as "requested" regardless of the final outcome.
  // Final statuses (cancelled, rejected, delivered, etc.) should be reflected on the fulfillment stage only.
  return 'requested';
}

function deriveFulfillmentStageStatus(
  orderType: 'product' | 'service',
  status: OrderStatus,
  metadata?: Record<string, unknown> | null,
): OrderApprovalStage['status'] {
  switch (status) {
    // Product order statuses
    case 'pending_warehouse':
      return 'pending';
    case 'awaiting_delivery':
      // Check if delivery has started via metadata
      if (metadata && metadata.deliveryStarted === true) {
        return 'accepted'; // Will show as "Out for Delivery"
      }
      return 'accepted'; // Will show as "Accepted"
    case 'delivered':
      return 'delivered';

    // Service order statuses
    case 'pending_customer':
    case 'pending_contractor':
    case 'pending_manager':
      return 'pending';
    case 'manager_accepted':
    case 'crew_requested':
    case 'crew_assigned':
      return 'accepted';
    case 'service_created':
      return 'delivered';

    // Common statuses
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';

    // Legacy statuses
    case 'pending':
      return 'pending';
    case 'in-progress':
      return orderType === 'product' ? 'accepted' : 'waiting';
    case 'approved':
      return orderType === 'product' ? 'accepted' : 'approved';
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

function buildParticipants(row: OrderRow): OrderParticipant[] {
  const participants: OrderParticipant[] = [];

  // Creator
  const creatorId = normalizeCodeValue(row.creator_id);
  if (creatorId) {
    participants.push({
      userId: creatorId,
      role: (normalizeRole(row.creator_role) ?? 'center') as HubRole,
      participationType: 'creator'
    });
  }

  // Destination
  const destinationId = normalizeCodeValue(row.destination) || normalizeCodeValue(row.center_id) || normalizeCodeValue(row.customer_id);
  if (destinationId) {
    const destRole = normalizeRole(row.destination_role) || (row.center_id ? 'center' : 'customer');
    if (destRole) {
      participants.push({
        userId: destinationId,
        role: destRole,
        participationType: 'destination'
      });
    }
  }

  // Assigned actors
  if (row.assigned_warehouse) {
    const warehouseId = normalizeCodeValue(row.assigned_warehouse);
    if (warehouseId) {
      participants.push({
        userId: warehouseId,
        role: 'warehouse',
        participationType: 'actor'
      });
    }
  }

  if (row.manager_id) {
    const managerId = normalizeCodeValue(row.manager_id);
    if (managerId) {
      participants.push({
        userId: managerId,
        role: 'manager',
        participationType: 'actor'
      });
    }
  }

  if (row.contractor_id) {
    const contractorId = normalizeCodeValue(row.contractor_id);
    if (contractorId) {
      participants.push({
        userId: contractorId,
        role: 'contractor',
        participationType: 'actor'
      });
    }
  }

  if (row.crew_id) {
    const crewId = normalizeCodeValue(row.crew_id);
    if (crewId) {
      participants.push({
        userId: crewId,
        role: 'crew',
        participationType: 'actor'
      });
    }
  }

  return participants;
}

function buildApprovalStages(
  row: OrderRow,
  orderType: 'product' | 'service',
  status: OrderStatus,
  approvals?: readonly HubRole[]
): OrderApprovalStage[] {
  const stages: OrderApprovalStage[] = [];
  const creatorRole = normalizeRole(row.creator_role) ?? 'center';
  const creatorUserId = normalizeCodeValue(row.creator_id);
  const metadata = (row.metadata || {}) as Record<string, unknown>;
  const crewRequestsRaw = metadata.crewRequests;
  const crewRequests = Array.isArray(crewRequestsRaw)
    ? (crewRequestsRaw as Array<{ crewCode?: string; status?: string; requestedAt?: string | null; respondedAt?: string | null }>)
    : [];

  // Always add creator stage as "requested" (green)
  stages.push({
    role: creatorRole,
    status: 'requested',
    userId: creatorUserId,
    timestamp: toIso(row.requested_date),
  });

  if (orderType === 'service') {
    // Determine if this is a warehouse-managed or manager-managed service
    const serviceManagedBy = row.service_managed_by || 'manager';
    const finalActor: HubRole = serviceManagedBy === 'warehouse' ? 'warehouse' : 'manager';

    // Build the service approval chain
    const chain: HubRole[] = [];
    if (creatorRole === 'center') {
      chain.push('customer', 'contractor', finalActor);
    } else if (creatorRole === 'customer') {
      chain.push('contractor', finalActor);
    } else if (creatorRole === 'contractor') {
      chain.push(finalActor);
    } else if (creatorRole === 'manager') {
      chain.push('manager');
    } else if (creatorRole === 'warehouse') {
      chain.push('warehouse');
    }

    const roleToUserId = (role: HubRole): string | null => {
      switch (role) {
        case 'customer':
          return normalizeCodeValue(row.customer_id) ?? null;
        case 'contractor':
          return normalizeCodeValue(row.contractor_id) ?? null;
        case 'manager':
          return normalizeCodeValue(row.manager_id) ?? null;
        case 'warehouse':
          return normalizeCodeValue(row.assigned_warehouse) ?? null;
        case 'center':
          return normalizeCodeValue(row.center_id) ?? null;
        default:
          return null;
      }
    };

    // Determine which role is currently pending using approvals if provided
    const approvalsList = (approvals ?? []).filter((r): r is HubRole => !!r) as HubRole[];
    let pendingIndex = Math.min(approvalsList.length, Math.max(chain.length - 1, 0));

    // For each role in the chain, compute its stage status
    for (let i = 0; i < chain.length; i++) {
      const role = chain[i];
      let stageStatus: OrderApprovalStage['status'];

      if (status === 'service_created') {
        stageStatus = (role === 'manager' || role === 'warehouse') ? 'service-created' : 'approved';
      } else if (status === 'manager_accepted' || status === 'crew_requested' || status === 'crew_assigned') {
        // Manager has accepted; all prior roles are approved
        stageStatus = role === 'manager' ? 'approved' : 'approved';
      } else if (status === 'warehouse_accepted') {
        // Warehouse has accepted; all prior roles are approved
        stageStatus = role === 'warehouse' ? 'approved' : 'approved';
      } else if (pendingIndex === i) {
        stageStatus = 'pending';
      } else if (pendingIndex > i && pendingIndex !== -1) {
        // Past actors appear as approved (green)
        // Only mark approved if explicitly approved in approvals list
        stageStatus = approvalsList.includes(role) ? 'approved' : 'waiting';
      } else {
        // Future actors show as waiting (yellow, no pulse)
        stageStatus = 'waiting';
      }

      stages.push({
        role,
        status: stageStatus,
        userId: roleToUserId(role),
        timestamp: null,
      });
    }

    const shouldShowCrewStage =
      crewRequests.length > 0 ||
      status === 'crew_requested' ||
      status === 'crew_assigned';

    if (shouldShowCrewStage) {
      const crewAccepted = crewRequests.find(r => (r.status || '').toLowerCase() === 'accepted');
      const crewPending = crewRequests.find(r => (r.status || '').toLowerCase() === 'pending');
      const crewRejected = crewRequests.find(r => (r.status || '').toLowerCase() === 'rejected');
      let crewStageStatus: OrderApprovalStage['status'] = 'pending';
      let crewLabel = 'Crew Requested';

      if (status === 'crew_assigned' || crewAccepted) {
        crewStageStatus = 'accepted';
        crewLabel = 'Crew Accepted';
      } else if (!crewPending && crewRejected) {
        crewStageStatus = 'rejected';
        crewLabel = 'Crew Rejected';
      } else {
        crewStageStatus = 'pending';
        crewLabel = 'Crew Requested';
      }

      const crewUserId = crewAccepted?.crewCode
        ? normalizeCodeValue(crewAccepted.crewCode)
        : normalizeCodeValue(row.crew_id);
      const crewTimestamp =
        crewAccepted?.respondedAt
          ? toIso(crewAccepted.respondedAt)
          : crewRejected?.respondedAt
            ? toIso(crewRejected.respondedAt)
            : crewPending?.requestedAt
              ? toIso(crewPending.requestedAt)
              : null;

      stages.push({
        role: 'crew',
        status: crewStageStatus,
        userId: crewUserId,
        timestamp: crewTimestamp,
        label: crewLabel,
      });
    }

    return stages;
  }

  // Product orders: creator + single fulfillment stage (warehouse)
  const fulfillmentRole: HubRole = 'warehouse';
  let fulfillmentStatus = deriveFulfillmentStageStatus(orderType, status, row.metadata);
  const fulfillmentUserId = normalizeCodeValue(row.assigned_warehouse);
  const fulfillmentTimestamp =
    FINAL_STATUSES.has(status) || fulfillmentStatus === 'accepted' || fulfillmentStatus === 'approved'
      ? toIso(row.delivery_date ?? row.updated_at)
      : null;

  let fulfillmentLabel: string | null = null;

  // Check if order was cancelled by someone - update their stage to show "cancelled"
  if (status === 'cancelled') {
    const meta = (row.metadata || {}) as any;
    const arr: string[] = Array.isArray(meta.approvals) ? meta.approvals : [];

    // Look for role:cancelled tag
    const cancelledTag = arr.find((a: string) => typeof a === 'string' && a.includes(':cancelled'));
    if (cancelledTag) {
      const cancellerRole = cancelledTag.split(':')[0] as HubRole;

      // Find if this was the creator or the warehouse
      if (cancellerRole === creatorRole) {
        // Creator cancelled - show creator as cancelled, warehouse as pending
        stages[0].status = 'cancelled';
        fulfillmentStatus = 'pending';
      } else if (cancellerRole === 'warehouse') {
        // Warehouse cancelled - show warehouse as cancelled
        fulfillmentStatus = 'cancelled';
      }
    } else {
      // Fallback: no cancel tag, just show based on status
      fulfillmentStatus = 'cancelled';
    }
  } else if (status === 'rejected') {
    // Similar logic for rejections
    fulfillmentStatus = 'rejected';
  } else if (status === 'awaiting_delivery' && fulfillmentStatus === 'accepted') {
    fulfillmentLabel = row.metadata && (row.metadata as any).deliveryStarted === true
      ? 'Delivery In Progress'
      : 'Awaiting Delivery';
  } else if (status === 'delivered') {
    fulfillmentLabel = 'Completed Delivery';
  }

  stages.push({
    role: fulfillmentRole,
    status: fulfillmentStatus,
    userId: fulfillmentUserId,
    timestamp: fulfillmentTimestamp,
    label: fulfillmentLabel,
  });

  return stages;
}

async function mapOrderRow(
  row: OrderRow & {
    service_managed_by?: string | null;
    service_actual_start_time?: Date | null;
    service_name?: string | null;
    service_category?: string | null;
    service_description?: string | null;
    service_status?: string | null;
    catalog_service_name?: string | null;
    catalog_service_category?: string | null;
    catalog_service_description?: string | null;
  },
  items: OrderItemRow[],
  context?: { viewerRole?: HubRole | null; viewerCode?: string | null },
): Promise<HubOrderItem> {
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

  // Build participants list
  const participants = buildParticipants(row);

  // Build approvals list from metadata
  const approvalsRoles: HubRole[] = (() => {
    const meta = (row.metadata || {}) as any;
    const arr: string[] = Array.isArray(meta.approvals) ? meta.approvals : [];
    const norm = arr.map((r) => (normalizeRole(r) || r)).filter(Boolean) as HubRole[];
    return norm;
  })();

  // Keep canonical DB status authoritative for policy and UI. Approvals only
  // annotate visuals but do not override who is pending.
  const effectiveStatus = status;
  const creatorRole = normalizeRole(row.creator_role) ?? 'center';

  // Determine available actions using policy
  let availableActions: string[] = [];
  if (viewerRole && viewerCode) {
    const isCreator = creatorCode === viewerCode;
    const isAssignedActor = participants.some(
      p => p.participationType === 'actor' && p.userId === viewerCode && p.role === viewerRole
    );

    const policyContext: OrderContext = {
      role: viewerRole,
      userId: viewerCode,
      orderType: orderType as PolicyOrderType,
      status: (status as any),
      participants,
      isCreator,
      isAssignedActor
    };

    console.log(`[ACTIONS] Order ${row.order_id} for viewer ${viewerCode} (${viewerRole}): status="${status}", isCreator=${isCreator}`);

    try {
      const policyActions = getAllowedActions(policyContext);
      availableActions = policyActions.map(action => getActionLabel(action));
      console.log(`[ACTIONS] → Policy returned ${policyActions.length} actions:`, policyActions);
      console.log(`[ACTIONS] → Mapped to labels:`, availableActions);
    } catch (error) {
      console.error('[POLICY] Error getting allowed actions:', error);
      availableActions = [];
    }
  }

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

  const approvalStages = buildApprovalStages(row, orderType, status, approvalsRoles);

  // Enrich metadata with contact info for Warehouse and other hubs (fill missing fields)
  console.log('[mapOrderRow] START - order_id:', row.order_id);
  let enrichedMetadata = row.metadata ? { ...row.metadata } : {};

  // Add service data from services/catalog_services tables if available
  // Priority: services table (runtime) > catalog_services (template) > order metadata
  if (orderType === 'service') {
    // Service details: prefer runtime service data, fall back to catalog
    const catalogServiceId = row.catalog_service_id || (enrichedMetadata as any).serviceId || null;
    const serviceName = row.service_name || row.catalog_service_name || (enrichedMetadata as any).serviceName || null;
    const serviceType = row.service_category || row.catalog_service_category || (enrichedMetadata as any).serviceType || null;
    const serviceDescription = row.service_description || row.catalog_service_description || (enrichedMetadata as any).serviceDescription || null;
    const serviceStatus = row.service_status || (enrichedMetadata as any).serviceStatus || null;
    const serviceManagedBy = row.service_managed_by || (enrichedMetadata as any).serviceManagedBy || null;

    if (catalogServiceId || serviceName || serviceType || serviceDescription || serviceStatus || serviceManagedBy) {
      if (catalogServiceId) {
        (enrichedMetadata as any).serviceId = catalogServiceId;
        (enrichedMetadata as any).service_id = catalogServiceId; // snake_case alias
      }
      (enrichedMetadata as any).serviceName = serviceName;
      (enrichedMetadata as any).service_name = serviceName; // snake_case alias
      (enrichedMetadata as any).serviceType = serviceType;
      (enrichedMetadata as any).service_type = serviceType; // snake_case alias
      (enrichedMetadata as any).serviceDescription = serviceDescription;
      (enrichedMetadata as any).service_description = serviceDescription; // snake_case alias
      (enrichedMetadata as any).serviceStatus = serviceStatus;
      (enrichedMetadata as any).service_status = serviceStatus; // snake_case alias
      (enrichedMetadata as any).serviceManagedBy = serviceManagedBy;

      // Resolve managed by code and name
      let managedByCode: string | null = null;
      if (serviceManagedBy === 'warehouse') {
        managedByCode = normalizeCodeValue(row.assigned_warehouse) || normalizeCodeValue(row.destination);
      } else if (serviceManagedBy === 'manager') {
        managedByCode = normalizeCodeValue(row.manager_id);
      }

      if (managedByCode) {
        (enrichedMetadata as any).managedById = managedByCode;

        // Fetch name for managed by entity
        try {
          const prefix = managedByCode.split('-')[0];
          let managedByName: string | null = null;

          if (prefix === 'WHX') {
            const res = await query<{ name: string | null }>(
              `SELECT name FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
              [managedByCode]
            );
            managedByName = res.rows[0]?.name || null;
          } else if (prefix === 'MGR') {
            const res = await query<{ name: string | null }>(
              `SELECT name FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
              [managedByCode]
            );
            managedByName = res.rows[0]?.name || null;
          }

          if (managedByName) {
            (enrichedMetadata as any).managedByName = managedByName;
          }
        } catch (err) {
          console.error('[mapOrderRow] Error fetching managed by name:', err);
        }
      }
    }

    if (row.service_actual_start_time) {
      (enrichedMetadata as any).serviceActualStartTime = new Date(row.service_actual_start_time).toISOString();
    }
  }

  // Add warehouse fulfillment data for product orders
  if (orderType === 'product') {
    const assignedWarehouse = normalizeCodeValue(row.assigned_warehouse);

    if (assignedWarehouse) {
      (enrichedMetadata as any).fulfilledById = assignedWarehouse;

      // Fetch warehouse name
      try {
        const res = await query<{ name: string | null }>(
          `SELECT name FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
          [assignedWarehouse]
        );
        const warehouseName = res.rows[0]?.name || null;

        if (warehouseName) {
          (enrichedMetadata as any).fulfilledByName = warehouseName;
        }
      } catch (err) {
        console.error('[mapOrderRow] Error fetching warehouse name:', err);
      }
    }
  }

  console.log('[mapOrderRow] enrichedMetadata:', JSON.stringify(enrichedMetadata, null, 2));
  const existingContacts: any = (enrichedMetadata as any).contacts ?? {};
  console.log('[mapOrderRow] existingContacts:', existingContacts);

  const hasAllFields = (c: any | null | undefined) =>
    !!c && c.name != null && c.address != null && c.phone != null && c.email != null;

  // Helper to fetch contact info synchronously
  const getContactFromCode = async (
    code: string | null,
  ): Promise<{ name: string | null; address: string | null; phone: string | null; email: string | null } | null> => {
    console.log('[getContactFromCode] Input code:', code);
    const normalized = normalizeCodeValue(code);
    console.log('[getContactFromCode] Normalized:', normalized);
    if (!normalized) return null;
    const prefix = normalized.split('-')[0];
    console.log('[getContactFromCode] Prefix:', prefix);
    if (prefix === 'CEN') {
      console.log('[getContactFromCode] Querying centers table for:', normalized);
      let res = await query<{ name: string | null; main_contact: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, main_contact, email, phone, address FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
        [normalized],
      );
      let r = res.rows[0];
      // Fallback for zero-padding mismatches (e.g., CEN-010 vs CEN-10)
      if (!r) {
        const alt = normalized.replace(/^(\w+)-0*(\d+)$/, '$1-$2');
        if (alt !== normalized) {
          console.log('[getContactFromCode] Retrying centers lookup with alt code:', alt);
          res = await query<{ name: string | null; main_contact: string | null; email: string | null; phone: string | null; address: string | null }>(
            `SELECT name, main_contact, email, phone, address FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
            [alt],
          );
          r = res.rows[0];
        }
      }
      console.log('[getContactFromCode] Centers query result:', r);
      return r ? { name: r.name ?? normalized, address: r.address ?? null, phone: r.phone ?? null, email: r.email ?? null } : { name: normalized, address: null, phone: null, email: null };
    }
    if (prefix === 'CUS') {
      console.log('[getContactFromCode] Querying customers table for:', normalized);
      let res = await query<{ name: string | null; main_contact: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, main_contact, email, phone, address FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
        [normalized],
      );
      let r = res.rows[0];
      if (!r) {
        const alt = normalized.replace(/^(\w+)-0*(\d+)$/, '$1-$2');
        if (alt !== normalized) {
          console.log('[getContactFromCode] Retrying customers lookup with alt code:', alt);
          res = await query<{ name: string | null; main_contact: string | null; email: string | null; phone: string | null; address: string | null }>(
            `SELECT name, main_contact, email, phone, address FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
            [alt],
          );
          r = res.rows[0];
        }
      }
      console.log('[getContactFromCode] Customers query result:', r);
      return r ? { name: r.name ?? normalized, address: r.address ?? null, phone: r.phone ?? null, email: r.email ?? null } : { name: normalized, address: null, phone: null, email: null };
    }
    if (prefix === 'CRW') {
      console.log('[getContactFromCode] Querying crew table for:', normalized);
      let res = await query<{ name: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, email, phone, address FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
        [normalized],
      );
      let r = res.rows[0];
      if (!r) {
        const alt = normalized.replace(/^(\w+)-0*(\d+)$/, '$1-$2');
        if (alt !== normalized) {
          console.log('[getContactFromCode] Retrying crew lookup with alt code:', alt);
          res = await query<{ name: string | null; email: string | null; phone: string | null; address: string | null }>(
            `SELECT name, email, phone, address FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
            [alt],
          );
          r = res.rows[0];
        }
      }
      console.log('[getContactFromCode] Crew query result:', r);
      return r ? { name: r.name ?? normalized, address: r.address ?? null, phone: r.phone ?? null, email: r.email ?? null } : { name: normalized, address: null, phone: null, email: null };
    }
    if (prefix === 'MGR') {
      console.log('[getContactFromCode] Querying managers table for:', normalized);
      let res = await query<{ name: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, email, phone, address FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
        [normalized],
      );
      let r = res.rows[0];
      if (!r) {
        const alt = normalized.replace(/^(\w+)-0*(\d+)$/, '$1-$2');
        if (alt !== normalized) {
          console.log('[getContactFromCode] Retrying managers lookup with alt code:', alt);
          res = await query<{ name: string | null; email: string | null; phone: string | null; address: string | null }>(
            `SELECT name, email, phone, address FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
            [alt],
          );
          r = res.rows[0];
        }
      }
      console.log('[getContactFromCode] Managers query result:', r);
      return r ? { name: r.name ?? normalized, address: r.address ?? null, phone: r.phone ?? null, email: r.email ?? null } : { name: normalized, address: null, phone: null, email: null };
    }
    if (prefix === 'CON') {
      console.log('[getContactFromCode] Querying contractors table for:', normalized);
      let res = await query<{ name: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, email, phone, address FROM contractors WHERE UPPER(contractor_id) = $1 LIMIT 1`,
        [normalized],
      );
      let r = res.rows[0];
      if (!r) {
        const alt = normalized.replace(/^(\w+)-0*(\d+)$/, '$1-$2');
        if (alt !== normalized) {
          console.log('[getContactFromCode] Retrying contractors lookup with alt code:', alt);
          res = await query<{ name: string | null; email: string | null; phone: string | null; address: string | null }>(
            `SELECT name, email, phone, address FROM contractors WHERE UPPER(contractor_id) = $1 LIMIT 1`,
            [alt],
          );
          r = res.rows[0];
        }
      }
      console.log('[getContactFromCode] Contractors query result:', r);
      return r ? { name: r.name ?? normalized, address: r.address ?? null, phone: r.phone ?? null, email: r.email ?? null } : { name: normalized, address: null, phone: null, email: null };
    }
    console.log('[getContactFromCode] Unrecognized prefix, returning normalized name with nulls');
    return { name: normalized, address: null, phone: null, email: null };
  };

  // Determine if we need to fetch/merge requestor and destination
  const needRequestor = !hasAllFields(existingContacts.requestor);
  const needDestination = !hasAllFields(existingContacts.destination);

  // Fallback: only for center-created product orders with no explicit destination/center
  const creatorRoleForFallback = normalizeRole(row.creator_role);
  const destinationFallbackCode = normalizedDestination ?? normalizedCenter ?? ((orderType === 'product' && creatorRoleForFallback === 'center') ? creatorCode : null);

  console.log('[mapOrderRow] needRequestor:', needRequestor, 'needDestination:', needDestination);
  console.log('[mapOrderRow] creatorCode:', creatorCode);
  console.log('[mapOrderRow] normalizedDestination:', normalizedDestination);
  console.log('[mapOrderRow] normalizedCenter:', normalizedCenter);
  console.log('[mapOrderRow] destinationFallbackCode:', destinationFallbackCode);

  if (needRequestor || needDestination) {
    const [requestorContact, destinationContact] = await Promise.all([
      needRequestor ? getContactFromCode(creatorCode) : Promise.resolve(null),
      needDestination ? getContactFromCode(destinationFallbackCode) : Promise.resolve(null),
    ]);

    console.log('[mapOrderRow] requestorContact returned:', requestorContact);
    console.log('[mapOrderRow] destinationContact returned:', destinationContact);

    const mergedRequestor = {
      name:
        (existingContacts.requestor?.name && !/^([A-Za-z]+)-\d+$/.test(String(existingContacts.requestor?.name)))
          ? existingContacts.requestor?.name
          : (requestorContact?.name ?? (creatorCode ?? null)),
      address: existingContacts.requestor?.address ?? requestorContact?.address ?? null,
      phone: existingContacts.requestor?.phone ?? requestorContact?.phone ?? null,
      email: existingContacts.requestor?.email ?? requestorContact?.email ?? null,
    };
    const mergedDestination = {
      name:
        (existingContacts.destination?.name && !/^([A-Za-z]+)-\d+$/.test(String(existingContacts.destination?.name)))
          ? existingContacts.destination?.name
          : (destinationContact?.name ?? (destinationFallbackCode ?? null)),
      address: existingContacts.destination?.address ?? destinationContact?.address ?? null,
      phone: existingContacts.destination?.phone ?? destinationContact?.phone ?? null,
      email: existingContacts.destination?.email ?? destinationContact?.email ?? null,
    };

    console.log('[mapOrderRow] mergedRequestor:', mergedRequestor);
    console.log('[mapOrderRow] mergedDestination:', mergedDestination);

    (enrichedMetadata as any).contacts = {
      requestor: hasAllFields(existingContacts.requestor) ? existingContacts.requestor : mergedRequestor,
      destination: hasAllFields(existingContacts.destination) ? existingContacts.destination : mergedDestination,
    };
  }

  // Add role IDs to metadata for frontend ownership checks
  if (row.crew_id && !(enrichedMetadata as any).crewId) {
    (enrichedMetadata as any).crewId = normalizeCodeValue(row.crew_id);
  }

  // Format requestedBy and destination as "ID - Name"
  const requestorName = (enrichedMetadata as any).contacts?.requestor?.name;
  const requestedByFormatted = creatorCode && requestorName && requestorName !== creatorCode
    ? `${creatorCode} - ${requestorName}`
    : (creatorCode ?? row.creator_id ?? null);

  const destinationName = (enrichedMetadata as any).contacts?.destination?.name;
  const destinationFormatted = destinationFallbackCode && destinationName && destinationName !== destinationFallbackCode
    ? `${destinationFallbackCode} - ${destinationName}`
    : (destinationFallbackCode ?? null);

  const result = {
    orderId: row.order_id,
    orderType,
    title: row.title ?? (orderType === 'product' ? 'Product Order' : 'Service Order'),
    requestedBy: requestedByFormatted,
    requesterRole: normalizeRole(row.creator_role),
    creatorId: creatorCode, // Add creator ID for ownership checks
    destination: destinationFormatted,
    destinationRole: normalizeRole(row.destination_role) ?? (row.center_id ? 'center' : null),
    requestedDate: toIso(row.requested_date ?? row.created_at),
    expectedDate: toIso(row.expected_date),
    serviceStartDate: toIso(row.service_start_date),
    deliveryDate: toIso(row.delivery_date),
    status,
    viewerStatus: (row.archived_at ? 'archived' : viewerStatusFrom({
      status: status,
      nextActorRole,
      nextActorCode,
      viewerRole,
      viewerCode,
      creatorCode,
      creatorRole,
      approvals: approvalsRoles,
    } as any)),
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
    archivedAt: toIso(row.archived_at),
    // Add new fields for policy-based approach
    participants,
    availableActions,
    statusColor: getStatusColor(status as any),
    statusLabel: getStatusLabel(status as any),
    metadata: enrichedMetadata
  };

  console.log('[mapOrderRow] RETURN - creatorId:', result.creatorId, 'metadata.crewId:', (result.metadata as any)?.crewId);
  return result;
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
  const result = await query<OrderRow & {
    service_managed_by?: string | null;
    service_actual_start_time?: Date | null;
    service_name?: string | null;
    service_category?: string | null;
    service_description?: string | null;
    service_status?: string | null;
    catalog_service_id?: string | null;
    catalog_service_name?: string | null;
    catalog_service_category?: string | null;
    catalog_service_description?: string | null;
  }>(
    `SELECT
       o.order_id,
       o.order_type,
       o.title,
       o.status,
       o.next_actor_role,
       o.creator_id,
       o.creator_role,
       o.customer_id,
       o.center_id,
       o.contractor_id,
       o.manager_id,
       o.crew_id,
       o.assigned_warehouse,
       o.destination,
       o.destination_role,
       o.requested_date,
       o.expected_date,
       o.service_start_date,
       o.delivery_date,
       o.total_amount,
       o.currency,
       o.transformed_id,
       o.rejection_reason,
       o.notes,
       o.metadata,
       o.created_at,
       o.updated_at,
       o.archived_at,
       COALESCE(s.managed_by) AS service_managed_by,
       s.actual_start_time AS service_actual_start_time,
       s.service_name AS service_name,
       s.category AS service_category,
       s.description AS service_description,
       s.status AS service_status,
       oi.catalog_item_code AS catalog_service_id,
       cs.name AS catalog_service_name,
       cs.category AS catalog_service_category,
       cs.description AS catalog_service_description
     FROM orders o
     LEFT JOIN services s ON o.transformed_id = s.service_id
     LEFT JOIN LATERAL (
       SELECT oi.catalog_item_code
       FROM order_items oi
       WHERE oi.order_id = o.order_id AND oi.item_type = 'service'
       LIMIT 1
     ) oi ON TRUE
     LEFT JOIN catalog_services cs ON oi.catalog_item_code = cs.service_id
     WHERE ${whereClause}
     ORDER BY o.requested_date DESC NULLS LAST, o.created_at DESC NULLS LAST, o.order_id DESC`,
    params
  );

  if (result.rows.length === 0) {
    return [];
  }

  const orderIds = result.rows.map((row) => row.order_id);
  const itemsMap = await loadOrderItems(orderIds);
  return Promise.all(result.rows.map((row) => mapOrderRow(row, itemsMap.get(row.order_id) ?? [], context)));
}

function buildRoleFilter(role: HubRole, cksCode: string): { clause: string; params: unknown[] } {
  // Direct visibility only: users see orders where they are directly referenced in the order
  // No ecosystem-wide joins - only show orders this specific entity is involved in
  const testVisibility = buildTestOrderVisibilityClause(cksCode);
  switch (role) {
    case "customer": {
      // Customer sees orders they created, where they're referenced, or from their centers
      const clause = `
        creator_id = $1
        OR customer_id = $1
        OR center_id IN (SELECT center_id FROM centers WHERE customer_id = $1)
      `;
      return { clause: `${clause} ${testVisibility}`, params: [cksCode] };
    }
    case "center": {
      // Center sees orders they created, are referenced in, or from their parent customer
      const clause = `
        creator_id = $1
        OR center_id = $1
        OR destination = $1
        OR customer_id IN (SELECT customer_id FROM centers WHERE center_id = $1)
      `;
      return { clause: `${clause} ${testVisibility}`, params: [cksCode] };
    }
    case "manager": {
      // Manager sees ALL orders in their ecosystem (they manage multiple entities)
      const clause = `
        manager_id = $1 OR creator_id = $1 OR
        customer_id IN (SELECT customer_id FROM customers WHERE cks_manager = $1) OR
        contractor_id IN (SELECT contractor_id FROM contractors WHERE cks_manager = $1) OR
        center_id IN (SELECT center_id FROM centers WHERE cks_manager = $1) OR
        crew_id IN (SELECT crew_id FROM crew WHERE cks_manager = $1)
      `;
      return { clause: `${clause} ${testVisibility}`, params: [cksCode] };
    }
    case "contractor": {
      // Contractor sees orders they created, are referenced in, or from their ecosystem
      // For manager-created orders, only show if the order is for their customers/centers
      const clause = `
        creator_id = $1
        OR contractor_id = $1
        OR customer_id IN (SELECT customer_id FROM customers WHERE contractor_id = $1)
        OR center_id IN (SELECT center_id FROM centers WHERE customer_id IN (SELECT customer_id FROM customers WHERE contractor_id = $1))
      `;
      return { clause: `${clause} ${testVisibility}`, params: [cksCode] };
    }
    case "crew": {
      // Product vs Service visibility differs for crew:
      // - PRODUCT: Crew can see product orders in their manager's ecosystem
      // - SERVICE: Crew only sees orders they are directly involved in (creator, crew_id, or participant)
      const clause = `
        (
          order_type = 'product' AND (
            creator_id = $1
            OR crew_id = $1
            OR manager_id IN (SELECT cks_manager FROM crew WHERE crew_id = $1)
            OR customer_id IN (
              SELECT customer_id FROM customers WHERE cks_manager IN (SELECT cks_manager FROM crew WHERE crew_id = $1)
            )
            OR center_id IN (
              SELECT center_id FROM centers WHERE cks_manager IN (SELECT cks_manager FROM crew WHERE crew_id = $1)
            )
            OR contractor_id IN (
              SELECT contractor_id FROM contractors WHERE cks_manager IN (SELECT cks_manager FROM crew WHERE crew_id = $1)
            )
          )
        )
        OR (
          order_type = 'service' AND (
            creator_id = $1
            OR crew_id = $1
            OR order_id IN (
              SELECT op.order_id
              FROM order_participants op
              WHERE op.participant_id = $1 AND op.participant_role = 'crew'
            )
          )
        )
      `;
      return { clause: `${clause} ${testVisibility}`, params: [cksCode] };
    }
    case "warehouse":
      // Warehouse only sees orders assigned to them or destined for them
      return { clause: `(assigned_warehouse = $1 OR destination = $1) ${testVisibility}`, params: [cksCode] };
    default:
      return { clause: `creator_id = $1 ${testVisibility}`, params: [cksCode] };
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

async function ensureParticipant(
  options: {
    orderId: string;
    role: HubRole;
    code: string | null | undefined;
    participationType: 'creator' | 'destination' | 'actor' | 'watcher';
  },
  q: (<T>(text: string, params?: readonly unknown[]) => Promise<any>) = query,
): Promise<void> {
  const normalizedCode = normalizeCodeValue(options.code ?? null);
  if (!normalizedCode) {
    return;
  }
  await q(
    `INSERT INTO order_participants (order_id, participant_id, participant_role, participation_type)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (order_id, participant_id, participant_role)
     DO UPDATE SET participation_type =
       CASE
         WHEN order_participants.participation_type = 'creator' THEN 'creator'
         ELSE EXCLUDED.participation_type
       END`,
    [options.orderId, normalizedCode, options.role, options.participationType]
  );
}

async function ensureParticipantList(
  orderId: string,
  participants: Partial<Record<HubRole, string | readonly string[]>> | undefined,
  q: (<T>(text: string, params?: readonly unknown[]) => Promise<any>) = query,
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
    const participationType: 'creator' | 'destination' | 'actor' | 'watcher' = ACTOR_ROLES.has(role) ? 'actor' : 'watcher';
    for (const code of entries) {
      await ensureParticipant({ orderId, role, code, participationType }, q);
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

async function findDefaultWarehouse(isTest: boolean): Promise<string | null> {
  // Prefer warehouses with actual user data over dummy warehouses
  const testFilter = isTest
    ? "AND UPPER(warehouse_id) LIKE '%-TEST%'"
    : "AND UPPER(warehouse_id) NOT LIKE '%-TEST%'";
  const result = await query<{ warehouse_id: string }>(
    `SELECT warehouse_id
     FROM warehouses
     WHERE status = 'active'
     ${testFilter}
     ORDER BY
       CASE WHEN clerk_user_id IS NOT NULL THEN 0 ELSE 1 END,
       created_at ASC
     LIMIT 1`
  );
  return result.rows[0]?.warehouse_id ?? null;
}

async function insertOrderItems(
  orderId: string,
  orderType: "product" | "service",
  items: readonly CreateOrderItemInput[],
  q: (<T>(text: string, params?: readonly unknown[]) => Promise<any>) = query,
): Promise<void> {
  const trimmedCodes = Array.from(new Set(items.map((item) => item.catalogCode.trim())));
  if (orderType === "product") {
    if (DISABLE_INVENTORY_CHECK) {
      // Insert items without checking inventory (test mode)
      let line = 1;
      const products = await fetchProducts(trimmedCodes);
      for (const item of items) {
        const code = item.catalogCode.trim();
        const product = products.get(code);
        if (!product) {
          throw new Error(`Product ${item.catalogCode} not found in catalog.`);
        }
        const metadata = JSON.stringify(item.metadata ?? product.metadata ?? {});
        await q(
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
    const products = await fetchProducts(trimmedCodes);

    // Check inventory availability for all items first
    const inventoryCheckPromises = items.map(async (item) => {
      const code = item.catalogCode.trim();
      const product = products.get(code);
      if (!product) {
        throw new Error(`Product ${item.catalogCode} not found in catalog.`);
      }

      // Query inventory for this item across all warehouses
      const inventoryResult = await q<{ warehouse_id: string; quantity_available: number }>(
        `SELECT warehouse_id,
                COALESCE(quantity_available, quantity_on_hand, 0) AS quantity_available
         FROM inventory_items
         WHERE item_id = $1 AND status = 'active'
         ORDER BY COALESCE(quantity_available, quantity_on_hand, 0) DESC`,
        [product.product_id]
      );

      // Calculate total available quantity across all warehouses
      const rowsAvail = (inventoryResult.rows as Array<{ warehouse_id: string; quantity_available: number }>);
      const totalAvailable = rowsAvail.reduce((sum: number, row) => sum + (row.quantity_available || 0), 0);

      // Log for debugging
      console.log(`[INVENTORY CHECK] Product: ${product.name}, Code: ${product.product_id}, Requested: ${item.quantity}, Available: ${totalAvailable}`);

      if (totalAvailable < item.quantity) {
        const errorMsg = `Insufficient inventory for ${product.name}. Requested: ${item.quantity}, Available: ${totalAvailable}`;
        console.error(`[INVENTORY ERROR] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      return { product, item, totalAvailable };
    });

    // Wait for all inventory checks to complete
    const inventoryChecks = await Promise.all(inventoryCheckPromises);

    // If all checks pass, insert the order items
    let line = 1;
    for (const { product, item } of inventoryChecks) {
      const metadata = JSON.stringify(item.metadata ?? product.metadata ?? {});
      await q(
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
    await q(
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

  let destinationCode = normalizeCodeValue(input.destination?.code ?? null);
  let destinationRole = input.destination?.role ?? null;
  const isTestContext = isTestCode(creatorCode) || isTestCode(destinationCode);

  let assignedWarehouse: string | null = null;
  let nextActorRole: HubRole | null = null;
  let status: string;
  let serviceManagedBy: string | null = 'manager'; // Declare outside block for later use
  const orderType = input.orderType; // Cache for use in metadata

  if (orderType === "product") {
    // Default: for center-created product orders with no explicit destination,
    // deliver to the creator center.
    if (!destinationCode && input.creator.role === "center") {
      destinationCode = creatorCode;
      destinationRole = "center";
    }

    if (destinationRole === "warehouse" && destinationCode) {
      if (isTestContext && !isTestCode(destinationCode)) {
        throw new Error("Test orders must be assigned to a test warehouse.");
      }
      if (!isTestContext && isTestCode(destinationCode)) {
        throw new Error("Live orders cannot be assigned to a test warehouse.");
      }
      assignedWarehouse = destinationCode;
    } else {
      const defaultWarehouse = await findDefaultWarehouse(isTestContext);
      if (isTestContext && !defaultWarehouse) {
        throw new Error("No test warehouse available for test orders.");
      }
      assignedWarehouse = normalizeCodeValue(defaultWarehouse);
    }
    nextActorRole = "warehouse";
    status = "pending_warehouse";

  } else {
    // Service orders: check if service is warehouse-managed or manager-managed
    // Fetch the first service item to determine managed_by
    const firstServiceCode = input.items[0]?.catalogCode;

    if (firstServiceCode) {
      const serviceCheck = await query<{ managed_by: string | null }>(
        'SELECT managed_by FROM catalog_services WHERE service_id = $1',
        [firstServiceCode]
      );
      serviceManagedBy = serviceCheck.rows[0]?.managed_by ?? 'manager';
    }

    // Service orders: initial status depends on creator role
    // For manager services:
    //   Center → pending_customer → pending_contractor → pending_manager → manager_accepted
    //   Customer → pending_contractor → pending_manager → manager_accepted
    //   Contractor → pending_manager → manager_accepted
    //   Manager → manager_accepted
    // For warehouse services:
    //   Center → pending_customer → pending_contractor → pending_warehouse → warehouse_accepted
    //   Customer → pending_contractor → pending_warehouse → warehouse_accepted
    //   Contractor → pending_warehouse → warehouse_accepted
    //   Warehouse → warehouse_accepted
    const finalActor = serviceManagedBy === 'warehouse' ? 'warehouse' : 'manager';
    const finalStatus = serviceManagedBy === 'warehouse' ? 'warehouse_accepted' : 'manager_accepted';
    const pendingFinalStatus = serviceManagedBy === 'warehouse' ? 'pending_warehouse' : 'pending_manager';

    switch (input.creator.role) {
      case 'center':
        status = "pending_customer";
        nextActorRole = "customer";
        break;
      case 'customer':
        status = "pending_contractor";
        nextActorRole = "contractor";
        break;
      case 'contractor':
        status = pendingFinalStatus;
        nextActorRole = finalActor;
        break;
      case 'manager':
      case 'warehouse':
        // If creator is manager or warehouse, skip approvals
        status = finalStatus;
        nextActorRole = finalActor;
        break;
      default:
        // Fallback for other roles (crew, admin)
        status = pendingFinalStatus;
        nextActorRole = finalActor;
    }
  }

  const now = new Date();
  const expectedDateValue = input.expectedDate ? new Date(input.expectedDate) : null;
  if (expectedDateValue && Number.isNaN(expectedDateValue.getTime())) {
    throw new Error("Invalid expected date.");
  }

  // Populate entity ID columns based on creator role for ecosystem filtering
  let customerId: string | null = null;
  let centerId: string | null = null;
  let contractorId: string | null = null;
  let managerId: string | null = null;
  let crewId: string | null = null;

  switch (input.creator.role) {
    case 'customer':
      customerId = creatorCode;
      break;
    case 'center':
      centerId = creatorCode;
      break;
    case 'contractor':
      contractorId = creatorCode;
      break;
    case 'manager':
      managerId = creatorCode;
      break;
    case 'crew':
      crewId = creatorCode;
      break;
  }

  // For both service AND product orders, populate managerId and other entity IDs from destination center
  // This ensures destination-specific visibility (only involved parties see the order)
  if (destinationCode && destinationRole === "center") {
    const centerResult = await query<{ cks_manager: string | null; customer_id: string | null }>(
      `SELECT cks_manager, customer_id FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
      [destinationCode]
    );
    const centerRow = centerResult.rows[0];

    // Set manager from destination center if not already set
    if (!managerId && centerRow?.cks_manager) {
      managerId = normalizeCodeValue(centerRow.cks_manager);
    }

    // Set center_id and customer_id from destination for direct visibility
    if (!centerId) {
      centerId = destinationCode;
    }
    if (!customerId && centerRow?.customer_id) {
      customerId = normalizeCodeValue(centerRow.customer_id);
    }
  }

  // If center created the order (no destination), populate customer, contractor, and manager from the center's relationships
  if (input.creator.role === 'center' && centerId && !customerId && !managerId) {
    const centerResult = await query<{ cks_manager: string | null; customer_id: string | null }>(
      `SELECT cks_manager, customer_id FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
      [centerId]
    );
    const centerRow = centerResult.rows[0];

    if (!customerId && centerRow?.customer_id) {
      customerId = normalizeCodeValue(centerRow.customer_id);
    }
    if (!managerId && centerRow?.cks_manager) {
      managerId = normalizeCodeValue(centerRow.cks_manager);
    }

    // Get contractor from the customer record
    if (customerId && !contractorId) {
      const customerResult = await query<{ contractor_id: string | null }>(
        `SELECT contractor_id FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
        [customerId]
      );
      const customerRow = customerResult.rows[0];
      if (customerRow?.contractor_id) {
        contractorId = normalizeCodeValue(customerRow.contractor_id);
      }
    }
  }

  // If crew created the order, populate relationships from the crew's assigned center
  if (input.creator.role === 'crew') {
    const crewResult = await query<{ assigned_center: string | null; cks_manager: string | null }>(
      `SELECT assigned_center, cks_manager FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
      [normalizeCodeValue(input.creator.code)]
    );
    const crewRow = crewResult.rows[0];

    if (!centerId && crewRow?.assigned_center) {
      centerId = normalizeCodeValue(crewRow.assigned_center);
    }
    if (!managerId && crewRow?.cks_manager) {
      managerId = normalizeCodeValue(crewRow.cks_manager);
    }

    // Always populate customer and contractor for crew-created orders (needed for activity filtering)
    const resolvedCenterId = centerId || normalizeCodeValue(crewRow?.assigned_center);
    if (resolvedCenterId) {
      if (!customerId) {
        const centerResult = await query<{ customer_id: string | null }>(
          `SELECT customer_id FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
          [resolvedCenterId]
        );
        const centerRow = centerResult.rows[0];
        if (centerRow?.customer_id) {
          customerId = normalizeCodeValue(centerRow.customer_id);
        }
      }

      // Get contractor from the customer record
      if (!contractorId && customerId) {
        const customerResult = await query<{ contractor_id: string | null }>(
          `SELECT contractor_id FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
          [customerId]
        );
        const customerRow = customerResult.rows[0];
        if (customerRow?.contractor_id) {
          contractorId = normalizeCodeValue(customerRow.contractor_id);
        }
      }
    }
  }

  // For warehouse-managed service orders, assign default warehouse (same as product orders)
  // TODO: Post-MVP - Add warehouse_id column to centers table for flexible warehouse assignment
  if (orderType === 'service' && serviceManagedBy === 'warehouse' && !assignedWarehouse) {
    const defaultWarehouse = await findDefaultWarehouse(isTestContext);
    if (isTestContext && !defaultWarehouse) {
      throw new Error("No test warehouse available for test orders.");
    }
    assignedWarehouse = normalizeCodeValue(defaultWarehouse);
  }

  // Enrich metadata with basic contact info for requestor and destination (for Warehouse visibility)
  async function loadContactForCode(code: string | null): Promise<{ name: string | null; address: string | null; phone: string | null; email: string | null } | null> {
    const normalized = normalizeCodeValue(code);
    if (!normalized) return null;
    const prefix = normalized.split('-')[0];
    if (prefix === 'CEN') {
      const res = await query<{ name: string | null; main_contact: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, main_contact, email, phone, address FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
        [normalized]
      );
      const row = res.rows[0];
      return { name: row?.name ?? normalized, address: row?.address ?? null, phone: row?.phone ?? null, email: row?.email ?? null };
    }
    if (prefix === 'CUS') {
      const res = await query<{ name: string | null; main_contact: string | null; email: string | null; phone: string | null; address: string | null }>(
        `SELECT name, main_contact, email, phone, address FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
        [normalized]
      );
      const row = res.rows[0];
      return { name: row?.name ?? normalized, address: row?.address ?? null, phone: row?.phone ?? null, email: row?.email ?? null };
    }
    return { name: normalized, address: null, phone: null, email: null };
  }

  const creatorContact = await loadContactForCode(creatorCode);
  const destinationContact = await loadContactForCode(destinationCode);
  const metadataExpanded: Record<string, unknown> = {
    ...(input.metadata ?? {}),
    contacts: { requestor: creatorContact, destination: destinationContact },
  };

  // Add serviceManagedBy to metadata for service orders
  if (orderType === 'service' && serviceManagedBy) {
    metadataExpanded.serviceManagedBy = serviceManagedBy;
  }

  const isTestOrder = [
    creatorCode,
    destinationCode,
    customerId,
    centerId,
    contractorId,
    managerId,
    crewId,
    assignedWarehouse,
  ].some(isTestCode);

  if (isTestOrder) {
    metadataExpanded.is_test = true;
  }

  const metadataValue = JSON.stringify(metadataExpanded);

  await withTransaction(async (q) => {
    await q(
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
    await insertOrderItems(orderId, input.orderType, input.items, q);
    await ensureParticipant({ orderId, role: input.creator.role, code: creatorCode, participationType: 'creator' }, q);
    if (destinationRole && destinationCode) {
      await ensureParticipant({ orderId, role: destinationRole, code: destinationCode, participationType: 'destination' }, q);
    }
    if (input.orderType === "product" && assignedWarehouse) {
      await ensureParticipant({ orderId, role: "warehouse", code: assignedWarehouse, participationType: 'actor' }, q);
    }
    // For service orders, add manager as actor participant for approval workflow
    if (input.orderType === "service" && managerId && managerId !== creatorCode) {
      await ensureParticipant({ orderId, role: "manager", code: managerId, participationType: 'actor' }, q);
    }
    await ensureParticipantList(orderId, input.participants, q);
  });

  // Record activity: order_created
  await recordActivity({
    activityType: 'order_created',
    description: `Created ${input.orderType === 'product' ? 'Product' : 'Service'} Order ${orderId}`,
    actorId: creatorCode,
    actorRole: input.creator.role,
    targetId: orderId,
    targetType: 'order',
    metadata: {
      orderId,
      orderType: input.orderType,
      customerId: customerId ?? undefined,
      centerId: centerId ?? undefined,
      contractorId: contractorId ?? undefined,
      managerId: managerId ?? undefined,
      crewId: crewId ?? undefined,
      warehouseId: assignedWarehouse ?? undefined,
      is_test: isTestOrder || undefined,
    },
  });

  const created = await fetchOrderById(orderId, { viewerRole: input.creator.role, viewerCode: creatorCode });
  if (!created) {
    throw new Error("Order creation failed.");
  }
  return created;
}

export async function fetchOrderById(orderId: string, context?: { viewerRole?: HubRole | null; viewerCode?: string | null }): Promise<HubOrderItem | null> {
  const orders = await fetchOrders("order_id = $1", [orderId], context);
  return orders[0] ?? null;
}

/**
 * Fetch a single order only if it is visible to the given viewer (RBAC check).
 * Combines the role visibility filter with a direct order_id match to avoid
 * loading the entire hub orders list.
 */
export async function fetchOrderForViewer(
  role: HubRole,
  cksCode: string,
  orderId: string,
): Promise<HubOrderItem | null> {
  const normalized = normalizeCodeValue(cksCode);
  if (!normalized) {
    return null;
  }
  const { clause, params } = buildRoleFilter(role, normalized);
  // Ensure we only return a single order that both matches visibility and id
  const where = `(${clause}) AND o.order_id = $2`;
  const orders = await fetchOrders(where, [params[0], orderId], { viewerRole: role, viewerCode: normalized });
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

  // Build participants for policy context
  const participants = buildParticipants(row);
  const isCreator = creatorCode === actorCodeNormalized;
  const isAssignedActor = participants.some(
    p => p.participationType === 'actor' && p.userId === actorCodeNormalized && p.role === input.actorRole
  );

  // Use policy to validate the action
  const policyContext: OrderContext = {
    role: input.actorRole,
    userId: actorCodeNormalized || '',
    orderType: orderType as PolicyOrderType,
    status: currentStatus as any,
    participants,
    isCreator,
    isAssignedActor
  };

  const canPerformAction = canTransition(policyContext, input.action as OrderAction);
  if (!canPerformAction.allowed) {
    throw new Error(canPerformAction.reason || `Action ${input.action} not allowed`);
  }

  // Get the next status from the policy
  let newStatus = getNextStatus(orderType as PolicyOrderType, currentStatus as any, input.action as OrderAction);
  if (!newStatus) {
    throw new Error(`Invalid action ${input.action} for status ${currentStatus}`);
  }

  // OVERRIDE: For service orders, check if service is warehouse-managed
  // If contractor is accepting a warehouse service, route to warehouse instead of manager
  if (orderType === 'service' && input.action === 'accept' && currentStatus === 'pending_contractor') {
    // Fetch the first service item to check managed_by
    const itemsResult = await query<{ catalog_item_code: string }>(
      'SELECT catalog_item_code FROM order_items WHERE order_id = $1 LIMIT 1',
      [input.orderId]
    );
    const firstServiceCode = itemsResult.rows[0]?.catalog_item_code;

    if (firstServiceCode) {
      const serviceCheck = await query<{ managed_by: string | null }>(
        'SELECT managed_by FROM catalog_services WHERE service_id = $1',
        [firstServiceCode]
      );
      const serviceManagedBy = serviceCheck.rows[0]?.managed_by;

      // If warehouse-managed, route to warehouse instead of manager
      if (serviceManagedBy === 'warehouse') {
        newStatus = 'pending_warehouse';
      }
    }
  }

  // Determine next actor role based on new status
  let nextActorRole: HubRole | null = null;
  if (newStatus === 'awaiting_delivery') {
    nextActorRole = 'warehouse';
  } else if (newStatus === 'pending_warehouse') {
    nextActorRole = 'warehouse';
  } else if (newStatus === 'warehouse_accepted') {
    nextActorRole = 'warehouse';
  } else if (newStatus === 'pending_customer') {
    nextActorRole = 'customer';
  } else if (newStatus === 'pending_contractor') {
    nextActorRole = 'contractor';
  } else if (newStatus === 'pending_manager') {
    nextActorRole = 'manager';
  } else if (newStatus === 'manager_accepted') {
    nextActorRole = 'manager';
  } else if (newStatus === 'crew_requested') {
    nextActorRole = 'crew';
  } else if (newStatus === 'crew_assigned') {
    nextActorRole = 'crew';
  }

  let deliveryDate: string | null = null;
  let serviceStartDate: string | null = null;
  let transformedId: string | null = null;
  let rejectionReason: string | null = row.rejection_reason ?? null;
  let assignedWarehouseValue: string | null = normalizeCodeValue(row.assigned_warehouse);

  // Handle action-specific updates
  switch (input.action) {
    case "accept":
      if (orderType === "product" && currentStatus === "pending_warehouse") {
        assignedWarehouseValue = actorCodeNormalized ?? assignedWarehouseValue;
      }
      // Track service approvals in metadata
      if (orderType === 'service') {
        const currentMetadata = row.metadata || {};
        const approvalsArr: string[] = Array.isArray((currentMetadata as any).approvals)
          ? ((currentMetadata as any).approvals as string[])
          : [];
        const roleTag = input.actorRole;
        if (!approvalsArr.includes(roleTag)) {
          const merged = { ...(currentMetadata as any), approvals: [...approvalsArr, roleTag] };
          // Prepare metadata update merge
          // Merge with any other pending metadataUpdate
          // We'll set in the UPDATE below via metadataUpdate variable
          // but since we also handle other branches, just set here if not already set
          // Combine later when building metadataUpdate below
          (row as any).__metadata_accept_merge = merged;
        }

        // Auto-create service when manager OR warehouse accepts
        if ((input.actorRole === 'manager' && currentStatus === 'pending_manager') ||
            (input.actorRole === 'warehouse' && currentStatus === 'pending_warehouse')) {
          // Generate per-center sequential service ID: <CENTER>-SRV-XXX
          // Try to get center from: center_id, destination, or participants
          let centerCode = normalizeCodeValue(row.center_id) || normalizeCodeValue(row.destination) || null;

          // If still no center, look for center in participants
          if (!centerCode) {
            const centerParticipant = participants.find(p => p.role === 'center');
            if (centerParticipant) {
              centerCode = centerParticipant.userId;
            }
          }

          if (!centerCode) {
            throw new Error('Unable to determine center for service creation. Order must be associated with a center.');
          }

          const seqQuery = await query<{ next: string }>(
            `SELECT LPAD((COALESCE(MAX(CAST(SPLIT_PART(transformed_id, '-SRV-', 2) AS INTEGER)), 0) + 1)::text, 3, '0') AS next
             FROM orders
             WHERE transformed_id LIKE $1`,
            [`${centerCode}-SRV-%`]
          );
          const nextSeq = seqQuery.rows[0]?.next ?? '001';
          transformedId = `${centerCode}-SRV-${nextSeq}`;

          // Mark service as created in metadata
          const acceptMergedMetadata = (row as any).__metadata_accept_merge || currentMetadata;
          (row as any).__metadata_accept_merge = {
            ...acceptMergedMetadata,
            serviceCreatedAt: new Date().toISOString(),
            serviceStatus: 'created'
          };
        }
      }
      break;

    case "reject":
      {
        if (!input.notes) {
          throw new Error("Rejection reason is required.");
        }
        rejectionReason = input.notes;

        // Track actor for rejection in metadata
        const currentMetadata = row.metadata || {};
        const whoCode = normalizeCodeValue(input.actorCode);
        let whoName: string | null = null;
        if (whoCode) {
          const prefix = whoCode.split('-')[0];
          if (prefix === 'CEN') {
            const res = await query<{ name: string | null }>(
              `SELECT name FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
              [whoCode]
            );
            whoName = res.rows[0]?.name ?? null;
          } else if (prefix === 'CUS') {
            const res = await query<{ name: string | null }>(
              `SELECT name FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
              [whoCode]
            );
            whoName = res.rows[0]?.name ?? null;
          } else if (prefix === 'CRW') {
            const res = await query<{ name: string | null }>(
              `SELECT name FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
              [whoCode]
            );
            whoName = res.rows[0]?.name ?? null;
          } else if (prefix === 'MGR') {
            const res = await query<{ name: string | null }>(
              `SELECT name FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
              [whoCode]
            );
            whoName = res.rows[0]?.name ?? null;
          }
        }
        const display = whoCode ? (whoName ? `${whoCode} - ${whoName}` : whoCode) : (input.actorRole || null);
        (row as any).__metadata_reject_merge = {
          ...currentMetadata,
          rejectedBy: whoCode || input.actorRole || null,
          rejectedByCode: whoCode || null,
          rejectedByName: whoName || null,
          rejectedByDisplay: display || null,
          rejectedAt: new Date().toISOString(),
        } as Record<string, unknown>;
        break;
      }

    case "start-delivery":
      // Track that delivery has started in metadata
      // This helps us show "Out for Delivery" vs "Accepted" in the workflow
      // We'll update metadata in the query below
      break;

    case "deliver":
      deliveryDate = new Date().toISOString();
      break;

    case "complete":
      serviceStartDate = new Date().toISOString();
      break;

    case "create-service":
      {
        // Generate per-center sequential service ID: <CENTER>-SRV-XXX
        // Try to get center from: center_id, destination, or participants
        let centerCode = normalizeCodeValue(row.center_id) || normalizeCodeValue(row.destination) || null;

        // If still no center, look for center in participants
        if (!centerCode) {
          const centerParticipant = participants.find(p => p.role === 'center');
          if (centerParticipant) {
            centerCode = centerParticipant.userId;
          }
        }

        if (!centerCode) {
          throw new Error('Unable to determine center for service ID generation. Order must be associated with a center.');
        }
        const seqQuery = await query<{ next: string }>(
          `SELECT LPAD((COALESCE(MAX(CAST(SPLIT_PART(transformed_id, '-SRV-', 2) AS INTEGER)), 0) + 1)::text, 3, '0') AS next
           FROM orders
           WHERE transformed_id LIKE $1`,
          [`${centerCode}-SRV-%`]
        );
        const nextSeq = seqQuery.rows[0]?.next ?? '001';
        transformedId = `${centerCode}-SRV-${nextSeq}`;
        // Do not set actual start/end here; those are set when work starts/completes
        serviceStartDate = null;
      }
      break;

    case "cancel":
      // Track cancellation in approvals metadata for workflow display
      if (orderType === 'service' || orderType === 'product') {
        const currentMetadata = row.metadata || {};
        const approvalsArr: string[] = Array.isArray((currentMetadata as any).approvals)
          ? ((currentMetadata as any).approvals as string[])
          : [];
        const cancelTag = `${input.actorRole}:cancelled`;
        if (!approvalsArr.includes(cancelTag)) {
          const merged = { ...(currentMetadata as any), approvals: [...approvalsArr, cancelTag] };
          (row as any).__metadata_cancel_merge = merged;
        }
      }
      break;
  }

  await query("BEGIN");
  try {
    // Handle metadata update for certain actions
    let metadataUpdate: Record<string, unknown> | null = null;
    if (input.action === "start-delivery") {
      const currentMetadata = row.metadata || {};
      metadataUpdate = { ...currentMetadata, deliveryStarted: true };
    } else if (input.action === "cancel") {
      const currentMetadata = row.metadata || {};
      // Resolve human name for actor code (ID -> name)
      const whoCode = normalizeCodeValue(input.actorCode);
      let whoName: string | null = null;
      if (whoCode) {
        const prefix = whoCode.split('-')[0];
        if (prefix === 'CEN') {
          const res = await query<{ name: string | null }>(
            `SELECT name FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
            [whoCode]
          );
          whoName = res.rows[0]?.name ?? null;
        } else if (prefix === 'CUS') {
          const res = await query<{ name: string | null }>(
            `SELECT name FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
            [whoCode]
          );
          whoName = res.rows[0]?.name ?? null;
        } else if (prefix === 'CRW') {
          const res = await query<{ name: string | null }>(
            `SELECT name FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
            [whoCode]
          );
          whoName = res.rows[0]?.name ?? null;
        } else if (prefix === 'MGR') {
          const res = await query<{ name: string | null }>(
            `SELECT name FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
            [whoCode]
          );
          whoName = res.rows[0]?.name ?? null;
        }
      }
      const display = whoCode ? (whoName ? `${whoCode} - ${whoName}` : whoCode) : (input.actorRole || null);
      metadataUpdate = {
        ...currentMetadata,
        cancellationReason: (input.notes ?? null) || (currentMetadata as any)['cancellationReason'] || null,
        cancelledBy: whoCode || input.actorRole || null,
        cancelledByCode: whoCode || null,
        cancelledByName: whoName || null,
        cancelledByDisplay: display || null,
        cancelledAt: new Date().toISOString(),
      } as Record<string, unknown>;
    } else if (input.action === "create-service" && input.metadata) {
      // Merge service metadata (type, dates, etc.) with existing metadata
      const currentMetadata = row.metadata || {};
      metadataUpdate = {
        ...currentMetadata,
        serviceType: input.metadata.serviceType,
        serviceStartDate: input.metadata.startDate,
        serviceStartTime: input.metadata.startTime,
        serviceEndDate: input.metadata.endDate,
        serviceEndTime: input.metadata.endTime,
        serviceNotes: input.metadata.notes,
        serviceCreatedAt: new Date().toISOString()
      };
    }

    // Merge acceptance metadata if present
    const acceptMerge: Record<string, unknown> | undefined = (row as any).__metadata_accept_merge;
    if (acceptMerge) {
      metadataUpdate = { ...(row.metadata || {}), ...(metadataUpdate || {}), ...acceptMerge } as Record<string, unknown>;
    }

    // Merge cancellation metadata if present
    const cancelMerge: Record<string, unknown> | undefined = (row as any).__metadata_cancel_merge;
    if (cancelMerge) {
      metadataUpdate = { ...(row.metadata || {}), ...(metadataUpdate || {}), ...cancelMerge } as Record<string, unknown>;
    }

    // Merge rejection metadata if present
    const rejectMerge: Record<string, unknown> | undefined = (row as any).__metadata_reject_merge;
    if (rejectMerge) {
      metadataUpdate = { ...(row.metadata || {}), ...(metadataUpdate || {}), ...rejectMerge } as Record<string, unknown>;
    }

    // Do not overwrite "notes" (special instructions) on cancel or reject.
    const notesParam = (input.action === 'cancel' || input.action === 'reject')
      ? null
      : (input.notes ?? null);

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
           metadata = COALESCE($9::jsonb, metadata),
           updated_at = NOW()
       WHERE order_id = $10`,
      [
        newStatus,
        nextActorRole ?? null,
        rejectionReason,
        notesParam,
        deliveryDate,
        serviceStartDate,
        transformedId,
        assignedWarehouseValue,
        metadataUpdate ? JSON.stringify(metadataUpdate) : null,
        input.orderId,
      ]
    );

    await ensureParticipant({
      orderId: input.orderId,
      role: input.actorRole,
      code: actorCodeNormalized,
      participationType: "actor",
    });

    // If delivering a product order, decrease inventory
    if (input.action === "deliver" && orderType === "product") {
      // Get order items to know what quantities to decrease
      const orderItemsResult = await query<{ catalog_item_code: string; quantity: number }>(
        `SELECT catalog_item_code, quantity
         FROM order_items
         WHERE order_id = $1`,
        [input.orderId]
      );

      // Get assigned warehouse for this order
      const warehouseId = assignedWarehouseValue || row.assigned_warehouse;

      // Decrease inventory for each item
      for (const item of orderItemsResult.rows) {
        await query(
          `UPDATE inventory_items
           SET quantity_on_hand = quantity_on_hand - $1,
               quantity_reserved = GREATEST(0, quantity_reserved - $1),
               last_shipped_date = NOW(),
               updated_at = NOW()
           WHERE warehouse_id = $2 AND item_id = $3`,
          [item.quantity, warehouseId, item.catalog_item_code]
        );
      }
    }

    // If creating a service, insert into services table
    // This happens either via explicit create-service action OR auto-create on manager/warehouse accept
    const shouldCreateService = (
      input.action === "create-service" ||
      (input.action === "accept" && input.actorRole === 'manager' && orderType === 'service') ||
      (input.action === "accept" && input.actorRole === 'warehouse' && orderType === 'service')
    );

    if (shouldCreateService && transformedId) {
      const serviceMetadata = metadataUpdate || row.metadata || {};
      const serviceType = (serviceMetadata as any).serviceType || 'one-time';
      const serviceName = row.title || transformedId;

      // Store manager or warehouse info in metadata when service is created
      if ((input.actorRole === 'manager' || input.actorRole === 'warehouse') && input.actorCode) {
        // Get actor name from appropriate table
        const tableName = input.actorRole === 'manager' ? 'managers' : 'warehouses';
        const idColumn = input.actorRole === 'manager' ? 'manager_id' : 'warehouse_id';
        const actorResult = await query<{ name: string }>(
          `SELECT name FROM ${tableName} WHERE ${idColumn} = $1 LIMIT 1`,
          [input.actorCode]
        );
        const actorName = actorResult.rows[0]?.name || null;

        // Update metadata with actor info and initial service status
        const actorIdKey = input.actorRole === 'manager' ? 'managerId' : 'warehouseId';
        const actorNameKey = input.actorRole === 'manager' ? 'managerName' : 'warehouseName';
        const updatedMetadata = {
          ...(metadataUpdate || row.metadata || {}),
          [actorIdKey]: input.actorCode,
          [actorNameKey]: actorName,
          serviceStatus: 'created', // Initial status when service is created
          managedBy: input.actorRole === 'warehouse' ? 'warehouse' : 'manager',
        };

        // Update the order metadata with actor info
        await query(
          `UPDATE orders SET metadata = $1::jsonb, updated_at = NOW() WHERE order_id = $2`,
          [JSON.stringify(updatedMetadata), input.orderId]
        );
      }

      await query(
        `INSERT INTO services (
          service_id,
          service_name,
          status,
          category,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (service_id) DO UPDATE SET
          service_name = EXCLUDED.service_name,
          status = EXCLUDED.status,
          updated_at = NOW()`,
        [
          transformedId,
          serviceName,
          'created', // New services start as created (not started yet)
          serviceType // Use serviceType from metadata
        ]
      );

      console.log(`[auto-create-service] Created service ${transformedId} for order ${input.orderId}`);
      // Record activity for service creation with transformed ID as target
      try {
        await recordActivity({
          activityType: 'service_created',
          description: `Created Service ${transformedId}`,
          actorId: actorCodeNormalized || 'SYSTEM',
          actorRole: input.actorRole,
          targetId: transformedId,
          targetType: 'service',
          metadata: {
            orderId: input.orderId,
            serviceName,
            serviceType,
            centerId: normalizeCodeValue(row.center_id) ?? undefined,
            managerId: normalizeCodeValue(row.manager_id) ?? undefined,
            warehouseId: normalizeCodeValue(row.assigned_warehouse) ?? undefined,
          },
        });
      } catch (e) {
        console.warn('[auto-create-service] Failed to record service_created activity', e);
      }
    }

    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }

  // Record activity for status transitions (Phase 1)
  let activityType: string | null = null;
  let activityDescription: string | null = null;

  switch (input.action) {
    case "start-delivery":
      activityType = 'delivery_started';
      activityDescription = `Started Delivery for ${orderType === 'product' ? 'Product' : 'Service'} Order ${input.orderId}`;
      break;
    case "deliver":
      activityType = 'order_delivered';
      activityDescription = `Delivered ${orderType === 'product' ? 'Product' : 'Service'} Order ${input.orderId}`;
      break;
    case "complete":
      activityType = 'order_completed';
      activityDescription = `Completed Service Order ${input.orderId}`;
      break;
    case "cancel":
      activityType = 'order_cancelled';
      activityDescription = `Cancelled ${orderType === 'product' ? 'Product' : 'Service'} Order ${input.orderId}`;
      break;
    case "reject":
      activityType = 'order_rejected';
      activityDescription = `Rejected ${orderType === 'product' ? 'Product' : 'Service'} Order ${input.orderId}`;
      break;
  }

  if (activityType && activityDescription) {
    await recordActivity({
      activityType,
      description: activityDescription,
      actorId: actorCodeNormalized || 'SYSTEM',
      actorRole: input.actorRole,
      targetId: input.orderId,
      targetType: 'order',
      metadata: {
        orderId: input.orderId,
        orderType,
        customerId: normalizeCodeValue(row.customer_id) ?? undefined,
        centerId: normalizeCodeValue(row.center_id) ?? undefined,
        contractorId: normalizeCodeValue(row.contractor_id) ?? undefined,
        managerId: normalizeCodeValue(row.manager_id) ?? undefined,
        crewId: normalizeCodeValue(row.crew_id) ?? undefined,
        warehouseId: normalizeCodeValue(row.assigned_warehouse) ?? undefined,
      },
    });
  }

  return fetchOrderById(input.orderId, { viewerRole: input.actorRole, viewerCode: actorCodeNormalized });
}

export async function updateOrderFields(
  orderId: string,
  fields: { expectedDate?: string; notes?: string }
): Promise<HubOrderItem | null> {
  // Build SQL update query dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (fields.expectedDate) {
    updates.push(`expected_date = $${paramIndex}`);
    values.push(fields.expectedDate);
    paramIndex++;
  }

  if (fields.notes !== undefined) {
    updates.push(`notes = $${paramIndex}`);
    values.push(fields.notes || null);
    paramIndex++;
  }

  if (updates.length === 0) {
    // No fields to update
    return fetchOrderById(orderId, {});
  }

  // Add updated_at timestamp
  updates.push(`updated_at = NOW()`);

  // Add order_id to values array
  values.push(orderId.toUpperCase());

  const updateQuery = `
    UPDATE orders
    SET ${updates.join(', ')}
    WHERE UPPER(order_id) = $${paramIndex}
  `;

  await query(updateQuery, values);

  // Return the updated order
  return fetchOrderById(orderId, {});
}

// ============================================
// CREW REQUEST FUNCTIONS
// ============================================

export interface CrewRequest {
  crewCode: string;
  crewName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  requestedAt: string;
  respondedAt?: string;
}

export async function requestCrewAssignment(
  orderId: string,
  managerCode: string,
  crewCodes: string[],
  message?: string
): Promise<HubOrderItem | null> {
  // Fetch current order
  const orderResult = await query<OrderRow>(
    `SELECT order_id, metadata, status FROM orders WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );

  const row = orderResult.rows[0];
  if (!row) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Verify order is at a status where manager can request crew
  const currentStatus = normalizeStatus(row.status);
  // Only allow requesting crew before service is created
  const ALLOWED_STATUSES = new Set(['manager_accepted', 'crew_requested', 'crew_assigned']);
  if (!ALLOWED_STATUSES.has(currentStatus)) {
    throw new Error(`Crew can only be requested at manager_accepted/crew_requested/crew_assigned. Current status: ${currentStatus}`);
  }

  // Build crew requests
  const currentMetadata = row.metadata || {};
  const existingCrewRequests: CrewRequest[] = (currentMetadata as any).crewRequests || [];
  const newCrewRequests: CrewRequest[] = crewCodes.map(crewCode => ({
    crewCode: normalizeCodeValue(crewCode) || crewCode,
    status: 'pending' as const,
    message,
    requestedAt: new Date().toISOString()
  }));

  const updatedMetadata = {
    ...currentMetadata,
    crewRequests: [...existingCrewRequests, ...newCrewRequests]
  };

  // Update order metadata and move into crew_requested so invites can be actioned before creation
  await query(
    `UPDATE orders
     SET metadata = $1::jsonb,
         status = 'crew_requested',
         next_actor_role = 'crew',
         updated_at = NOW()
     WHERE order_id = $2`,
    [JSON.stringify(updatedMetadata), orderId]
  );

  // Ensure each requested crew member is a participant so they can see/respond
  for (const code of crewCodes) {
    await ensureParticipant({ orderId, role: 'crew', code, participationType: 'actor' });
  }

  return fetchOrderById(orderId, { viewerRole: 'manager', viewerCode: managerCode });
}

export async function respondToCrewRequest(
  orderId: string,
  crewCode: string,
  accept: boolean
): Promise<HubOrderItem | null> {
  // Fetch current order
  const orderResult = await query<OrderRow>(
    `SELECT order_id, metadata, status FROM orders WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );

  const row = orderResult.rows[0];
  if (!row) {
    throw new Error(`Order ${orderId} not found`);
  }

  const currentStatus = normalizeStatus(row.status);
  if (currentStatus !== 'crew_requested') {
    throw new Error(`Crew can only respond to requests at crew_requested status. Current status: ${currentStatus}`);
  }

  // Update crew request status in metadata
  const currentMetadata = row.metadata || {};
  const crewRequests: CrewRequest[] = (currentMetadata as any).crewRequests || [];
  const normalizedCrewCode = normalizeCodeValue(crewCode);

  const updatedCrewRequests = crewRequests.map(req => {
    if (req.crewCode === normalizedCrewCode && req.status === 'pending') {
      return {
        ...req,
        status: accept ? ('accepted' as const) : ('rejected' as const),
        respondedAt: new Date().toISOString()
      };
    }
    return req;
  });

  const updatedMetadata = {
    ...currentMetadata,
    crewRequests: updatedCrewRequests
  };

  // Check if we have at least one accepted crew
  const hasAcceptedCrew = updatedCrewRequests.some(req => req.status === 'accepted');

  // If crew accepted and we have at least one acceptance, transition to crew_assigned
  // Otherwise stay at crew_requested
  const newStatus = hasAcceptedCrew ? 'crew_assigned' : 'crew_requested';

  // If transitioning to crew_assigned, assign the first accepted crew to crew_id field
  let crewIdUpdate = '';
  let crewIdValue: string | null = null;
  if (newStatus === 'crew_assigned') {
    const firstAcceptedCrew = updatedCrewRequests.find(req => req.status === 'accepted');
    if (firstAcceptedCrew) {
      crewIdUpdate = ', crew_id = $3';
      crewIdValue = firstAcceptedCrew.crewCode;
    }
  }

  await query(
    `UPDATE orders
     SET metadata = $1::jsonb,
         status = $2,
         updated_at = NOW()
         ${crewIdUpdate}
     WHERE order_id = ${crewIdValue ? '$4' : '$3'}`,
    crewIdValue
      ? [JSON.stringify(updatedMetadata), newStatus, crewIdValue, orderId]
      : [JSON.stringify(updatedMetadata), newStatus, orderId]
  );

  // If the crew rejected, remove them from participants so the order no longer appears in their view
  if (!accept) {
    await query(
      `DELETE FROM order_participants
       WHERE order_id = $1 AND participant_id = $2 AND participant_role = 'crew'`,
      [orderId, normalizedCrewCode]
    );
  }

  return fetchOrderById(orderId, { viewerRole: 'crew', viewerCode: crewCode });
}

