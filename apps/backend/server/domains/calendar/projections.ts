/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: projections.ts
 *
 * Description:
 * Source-domain to calendar projection builders.
 *
 * Responsibilities:
 * - Re-read source-domain state from orders and services
 * - Build idempotent calendar projections from that state
 * - Upsert or delete derived calendar events
 *
 * Role in system:
 * - Called from order and service write paths as a side effect
 *
 * Notes:
 * - Projections rebuild from source state rather than patching incrementally
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import crypto from 'node:crypto';
import { query } from '../../db/connection.js';
import { normalizeIdentity } from '../identity/customIdGenerator.js';
import { deleteCalendarProjectionByGeneratorKey, upsertCalendarProjection } from './store.js';
import type { CalendarProjectionParticipant } from './types.js';

type OrderProjectionRow = {
  order_id: string;
  order_type: string | null;
  title: string | null;
  status: string | null;
  expected_date: Date | string | null;
  service_start_date: Date | string | null;
  delivery_date: Date | string | null;
  transformed_id: string | null;
  destination: string | null;
  destination_role: string | null;
  creator_id: string | null;
  creator_role: string | null;
  customer_id: string | null;
  center_id: string | null;
  contractor_id: string | null;
  manager_id: string | null;
  crew_id: string | null;
  assigned_warehouse: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: Date | string | null;
  service_status: string | null;
  actual_start_time: Date | string | null;
  actual_end_time: Date | string | null;
};

type OrderParticipantRow = {
  participant_id: string;
  participant_role: string;
  participation_type: string;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDateTime(dateValue: unknown, timeValue?: unknown): string | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return toIso(dateValue);
  const dateText = String(dateValue).trim();
  if (!dateText) return null;
  if (dateText.includes('T')) {
    return toIso(dateText);
  }
  const timeText = typeof timeValue === 'string' ? timeValue.trim() : '';
  return toIso(`${dateText}T${timeText || '09:00:00'}`);
}

function hashPayload(value: Record<string, unknown>): string {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');
}

function normalizeCode(value: string | null | undefined): string | null {
  return normalizeIdentity(value ?? null);
}

function mapEventStatus(row: OrderProjectionRow): string {
  const orderStatus = String(row.status || '').trim().toLowerCase();
  const metadata = row.metadata || {};
  const serviceStatus = String(row.service_status || (metadata as any).serviceStatus || '').trim().toLowerCase();

  if (orderStatus === 'cancelled' || orderStatus === 'rejected' || serviceStatus === 'cancelled') {
    return 'cancelled';
  }
  if (orderStatus === 'delivered' || serviceStatus === 'completed') {
    return 'completed';
  }
  if (serviceStatus === 'in_progress') {
    return 'in_progress';
  }
  if (orderStatus === 'awaiting_delivery' && (metadata as any).deliveryStarted === true) {
    return 'in_progress';
  }
  return 'scheduled';
}

function buildParticipants(row: OrderProjectionRow, orderParticipants: OrderParticipantRow[], metadata: Record<string, unknown>): CalendarProjectionParticipant[] {
  const participants: CalendarProjectionParticipant[] = [];
  const push = (participantId: string | null | undefined, participantRole: string | null | undefined, participationType = 'watcher') => {
    const normalizedId = normalizeCode(participantId);
    const normalizedRole = (participantRole || '').trim().toLowerCase();
    if (!normalizedId || !normalizedRole) return;
    participants.push({ participantId: normalizedId, participantRole: normalizedRole, participationType });
  };

  push(row.creator_id, row.creator_role ?? 'user', 'creator');
  push(row.customer_id, 'customer');
  push(row.center_id, 'center');
  push(row.contractor_id, 'contractor');
  push(row.manager_id, 'manager');
  push(row.assigned_warehouse, 'warehouse');
  push(row.crew_id, 'crew', 'actor');

  for (const participant of orderParticipants) {
    push(participant.participant_id, participant.participant_role, participant.participation_type || 'watcher');
  }

  const crew = Array.isArray((metadata as any).crew) ? (metadata as any).crew : [];
  for (const crewId of crew) {
    if (typeof crewId === 'string') {
      push(crewId, 'crew', 'actor');
    }
  }

  return participants;
}

function buildServiceProjection(row: OrderProjectionRow, orderParticipants: OrderParticipantRow[]) {
  const metadata = (row.metadata || {}) as Record<string, unknown>;
  const plannedStart =
    parseDateTime((metadata as any).serviceStartDate, (metadata as any).serviceStartTime) ||
    toIso(row.service_start_date) ||
    toIso(row.expected_date);

  if (!plannedStart) return null;

  const plannedEnd = parseDateTime((metadata as any).serviceEndDate, (metadata as any).serviceEndTime) || null;
  const payloadMetadata: Record<string, unknown> = {
    orderId: row.order_id,
    serviceId: row.transformed_id,
    sourceStatus: row.status,
    serviceStatus: row.service_status ?? (metadata as any).serviceStatus ?? null,
    serviceType: (metadata as any).serviceType ?? null,
    notes: row.notes ?? null,
    procedures: Array.isArray((metadata as any).procedures) ? (metadata as any).procedures : [],
    training: Array.isArray((metadata as any).training) ? (metadata as any).training : [],
    tasks: Array.isArray((metadata as any).tasks) ? (metadata as any).tasks : [],
    crewRequests: Array.isArray((metadata as any).crewRequests) ? (metadata as any).crewRequests : [],
  };

  return {
    generatorKey: `order:${row.order_id}:service_visit`,
    eventType: 'service_visit',
    eventCategory: 'service',
    title: row.title || row.transformed_id || row.order_id,
    description: row.notes ?? null,
    plannedStartAt: plannedStart,
    plannedEndAt: plannedEnd,
    actualStartAt: toIso(row.actual_start_time) || (typeof (metadata as any).actualStartDate === 'string' ? toIso((metadata as any).actualStartDate) : null),
    actualEndAt: toIso(row.actual_end_time) || (typeof (metadata as any).serviceCompletedAt === 'string' ? toIso((metadata as any).serviceCompletedAt) : null),
    status: mapEventStatus(row),
    sourceType: row.transformed_id ? 'service' : 'service_order',
    sourceId: row.transformed_id || row.order_id,
    sourceAction: row.status,
    centerId: normalizeCode(row.center_id),
    locationName: normalizeCode(row.center_id),
    metadata: payloadMetadata,
    tags: ['service'],
    updatedBy: 'SYSTEM',
    sourceVersion: toIso(row.updated_at),
    sourceHash: hashPayload(payloadMetadata),
    participants: buildParticipants(row, orderParticipants, metadata),
  };
}

function buildDeliveryProjection(row: OrderProjectionRow, orderParticipants: OrderParticipantRow[]) {
  const metadata = (row.metadata || {}) as Record<string, unknown>;
  const plannedStart = toIso(row.expected_date) || toIso(row.delivery_date);
  if (!plannedStart) return null;

  const payloadMetadata: Record<string, unknown> = {
    orderId: row.order_id,
    sourceStatus: row.status,
    destination: row.destination,
    destinationRole: row.destination_role,
    notes: row.notes ?? null,
    deliveryStarted: (metadata as any).deliveryStarted === true,
  };

  return {
    generatorKey: `order:${row.order_id}:delivery`,
    eventType: 'delivery',
    eventCategory: 'logistics',
    title: row.title || `Delivery ${row.order_id}`,
    description: row.notes ?? null,
    plannedStartAt: plannedStart,
    status: mapEventStatus(row),
    sourceType: 'product_order',
    sourceId: row.order_id,
    sourceAction: row.status,
    centerId: normalizeCode(row.center_id),
    warehouseId: normalizeCode(row.assigned_warehouse),
    locationName: row.destination || normalizeCode(row.center_id) || normalizeCode(row.assigned_warehouse),
    metadata: payloadMetadata,
    tags: ['delivery'],
    updatedBy: 'SYSTEM',
    sourceVersion: toIso(row.updated_at),
    sourceHash: hashPayload(payloadMetadata),
    participants: buildParticipants(row, orderParticipants, metadata),
  };
}

async function loadOrderProjection(orderId: string): Promise<{ row: OrderProjectionRow | null; participants: OrderParticipantRow[] }> {
  const orderResult = await query<OrderProjectionRow>(
    `
      SELECT
        o.order_id,
        o.order_type,
        o.title,
        o.status,
        o.expected_date,
        o.service_start_date,
        o.delivery_date,
        o.transformed_id,
        o.destination,
        o.destination_role,
        o.creator_id,
        o.creator_role,
        o.customer_id,
        o.center_id,
        o.contractor_id,
        o.manager_id,
        o.crew_id,
        o.assigned_warehouse,
        o.notes,
        o.metadata,
        o.updated_at,
        s.status AS service_status,
        s.actual_start_time,
        s.actual_end_time
      FROM orders o
      LEFT JOIN services s ON s.service_id = o.transformed_id
      WHERE UPPER(o.order_id) = UPPER($1)
      LIMIT 1
    `,
    [orderId],
  );
  const row = orderResult.rows[0] ?? null;
  if (!row) {
    return { row: null, participants: [] };
  }
  const participantResult = await query<OrderParticipantRow>(
    `
      SELECT participant_id, participant_role, participation_type
      FROM order_participants
      WHERE order_id = $1
    `,
    [row.order_id],
  );
  return { row, participants: participantResult.rows };
}

export async function syncOrderCalendarProjection(orderId: string): Promise<void> {
  const { row, participants } = await loadOrderProjection(orderId);
  if (!row) {
    await deleteCalendarProjectionByGeneratorKey(`order:${orderId}:service_visit`);
    await deleteCalendarProjectionByGeneratorKey(`order:${orderId}:delivery`);
    return;
  }

  const orderType = String(row.order_type || '').trim().toLowerCase();
  if (orderType === 'service') {
    const projection = buildServiceProjection(row, participants);
    if (!projection) {
      await deleteCalendarProjectionByGeneratorKey(`order:${row.order_id}:service_visit`);
      return;
    }
    await upsertCalendarProjection(projection);
    return;
  }

  if (orderType === 'product') {
    const projection = buildDeliveryProjection(row, participants);
    if (!projection) {
      await deleteCalendarProjectionByGeneratorKey(`order:${row.order_id}:delivery`);
      return;
    }
    await upsertCalendarProjection(projection);
  }
}

export async function syncServiceCalendarProjection(serviceId: string): Promise<void> {
  const result = await query<{ order_id: string }>(
    `SELECT order_id FROM orders WHERE UPPER(transformed_id) = UPPER($1) LIMIT 1`,
    [serviceId],
  );
  const orderId = result.rows[0]?.order_id;
  if (!orderId) {
    return;
  }
  await syncOrderCalendarProjection(orderId);
}
