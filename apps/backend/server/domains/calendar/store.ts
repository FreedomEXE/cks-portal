/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: store.ts
 *
 * Description:
 * Calendar query and projection persistence helpers.
 *
 * Responsibilities:
 * - Read calendar events, agenda data, and summary counts
 * - Persist source-driven calendar projections
 * - Enforce calendar visibility using existing scope data
 *
 * Role in system:
 * - Used by the calendar service and projection helpers
 *
 * Notes:
 * - Calendar is a read model; source domains remain authoritative
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { QueryResultRow } from 'pg';
import { query } from '../../db/connection.js';
import type {
  CalendarAgendaDay,
  CalendarAgendaQuery,
  CalendarEventRecord,
  CalendarEventsQuery,
  CalendarProjectionParticipant,
  CalendarScopeType,
  CalendarSummary,
  CalendarTestMode,
  UpsertCalendarProjectionInput,
} from './types.js';

type EventRow = QueryResultRow & {
  event_id: string;
  event_type: string;
  event_category: string | null;
  title: string;
  description: string | null;
  planned_start_at: Date | string;
  planned_end_at: Date | string | null;
  actual_start_at: Date | string | null;
  actual_end_at: Date | string | null;
  all_day: boolean;
  timezone: string;
  status: string;
  priority: string;
  source_type: string;
  source_id: string;
  source_action: string | null;
  center_id: string | null;
  warehouse_id: string | null;
  location_name: string | null;
  location_address: string | null;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  updated_at: Date | string;
  version: number | string;
  participants: unknown;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatAgendaLabel(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function parseMulti(value?: string[] | string): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function mapEventRow(row: EventRow): CalendarEventRecord {
  const metadata = (row.metadata || {}) as Record<string, unknown>;
  const openTargetId =
    (typeof metadata.serviceId === 'string' && metadata.serviceId.trim()) ||
    (typeof metadata.orderId === 'string' && metadata.orderId.trim()) ||
    row.source_id;

  let openTargetType: string | null = null;
  if (typeof metadata.serviceId === 'string' && metadata.serviceId.trim()) {
    openTargetType = 'service';
  } else if (typeof metadata.orderId === 'string' && metadata.orderId.trim()) {
    openTargetType = 'order';
  } else if (row.source_type === 'service') {
    openTargetType = 'service';
  } else if (row.source_type === 'service_order' || row.source_type === 'product_order' || row.source_type === 'delivery') {
    openTargetType = 'order';
  }

  const rawParticipants = Array.isArray(row.participants) ? row.participants as any[] : [];

  return {
    eventId: row.event_id,
    eventType: row.event_type,
    eventCategory: row.event_category,
    title: row.title,
    description: row.description,
    plannedStartAt: toIso(row.planned_start_at) || new Date().toISOString(),
    plannedEndAt: toIso(row.planned_end_at),
    actualStartAt: toIso(row.actual_start_at),
    actualEndAt: toIso(row.actual_end_at),
    allDay: Boolean(row.all_day),
    timezone: row.timezone,
    status: row.status,
    priority: row.priority,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceAction: row.source_action,
    centerId: row.center_id,
    warehouseId: row.warehouse_id,
    locationName: row.location_name,
    locationAddress: row.location_address,
    metadata,
    tags: Array.isArray(row.tags) ? row.tags : [],
    updatedAt: toIso(row.updated_at) || new Date().toISOString(),
    version: Number(row.version || 1),
    openTargetId: openTargetId || null,
    openTargetType,
    participants: rawParticipants
      .map((participant) => ({
        participantId: String(participant.participantId ?? '').trim(),
        participantRole: String(participant.participantRole ?? '').trim(),
        participationType: String(participant.participationType ?? 'watcher').trim(),
        notify: participant.notify !== false,
      }))
      .filter((participant) => participant.participantId && participant.participantRole),
  };
}

function buildVisibilityClause(
  viewerRole: string,
  viewerCode: string | null,
  accessibleIds: string[] | undefined,
  params: unknown[],
): string {
  if (viewerRole === 'admin') {
    return '';
  }
  const ids = Array.from(
    new Set(
      [viewerCode, ...(accessibleIds ?? [])]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean),
    ),
  );
  if (!ids.length) {
    return ' AND 1 = 0';
  }
  params.push(ids);
  return ` AND (
    UPPER(COALESCE(e.source_id, '')) = ANY($${params.length}::text[])
    OR UPPER(COALESCE(e.center_id, '')) = ANY($${params.length}::text[])
    OR UPPER(COALESCE(e.warehouse_id, '')) = ANY($${params.length}::text[])
    OR UPPER(COALESCE(e.metadata->>'orderId', '')) = ANY($${params.length}::text[])
    OR UPPER(COALESCE(e.metadata->>'serviceId', '')) = ANY($${params.length}::text[])
    OR EXISTS (
      SELECT 1
      FROM calendar_event_participants epv
      WHERE epv.event_id = e.event_id
        AND UPPER(epv.participant_id) = ANY($${params.length}::text[])
    )
  )`;
}

function buildScopeClause(scopeType: CalendarScopeType | undefined, scopeId: string | undefined, params: unknown[]): string {
  if (!scopeType || !scopeId) {
    return '';
  }
  params.push(scopeId);
  const ref = `$${params.length}`;
  switch (scopeType) {
    case 'manager':
    case 'contractor':
    case 'customer':
      return ` AND EXISTS (
        SELECT 1 FROM calendar_event_participants ep
        WHERE ep.event_id = e.event_id
          AND UPPER(ep.participant_id) = UPPER(${ref})
          AND ep.participant_role = '${scopeType}'
      )`;
    case 'center':
      return ` AND (UPPER(e.center_id) = UPPER(${ref}) OR EXISTS (
        SELECT 1 FROM calendar_event_participants ep
        WHERE ep.event_id = e.event_id
          AND UPPER(ep.participant_id) = UPPER(${ref})
          AND ep.participant_role = 'center'
      ))`;
    case 'warehouse':
      return ` AND (UPPER(e.warehouse_id) = UPPER(${ref}) OR EXISTS (
        SELECT 1 FROM calendar_event_participants ep
        WHERE ep.event_id = e.event_id
          AND UPPER(ep.participant_id) = UPPER(${ref})
          AND ep.participant_role = 'warehouse'
      ))`;
    case 'crew':
      return ` AND EXISTS (
        SELECT 1 FROM calendar_event_participants ep
        WHERE ep.event_id = e.event_id
          AND UPPER(ep.participant_id) = UPPER(${ref})
          AND ep.participant_role = 'crew'
      )`;
    case 'order':
      return ` AND (
        UPPER(e.source_id) = UPPER(${ref})
        OR UPPER(COALESCE(e.metadata->>'orderId', '')) = UPPER(${ref})
      )`;
    case 'service':
      return ` AND (
        UPPER(e.source_id) = UPPER(${ref})
        OR UPPER(COALESCE(e.metadata->>'serviceId', '')) = UPPER(${ref})
      )`;
    case 'user':
    default:
      return '';
  }
}

function buildTestModeClause(testMode: CalendarTestMode | undefined): string {
  if (!testMode || testMode === 'include') {
    return '';
  }
  const testSignal = `(
    UPPER(COALESCE(e.source_id, '')) LIKE '%-TEST%'
    OR UPPER(COALESCE(e.center_id, '')) LIKE '%-TEST%'
    OR UPPER(COALESCE(e.warehouse_id, '')) LIKE '%-TEST%'
    OR UPPER(COALESCE(e.metadata->>'orderId', '')) LIKE '%-TEST%'
    OR UPPER(COALESCE(e.metadata->>'serviceId', '')) LIKE '%-TEST%'
    OR EXISTS (
      SELECT 1
      FROM calendar_event_participants ept
      WHERE ept.event_id = e.event_id
        AND UPPER(ept.participant_id) LIKE '%-TEST%'
    )
  )`;
  return testMode === 'only' ? ` AND ${testSignal}` : ` AND NOT ${testSignal}`;
}

function buildFilters(input: CalendarEventsQuery | CalendarAgendaQuery, params: unknown[]): string {
  let clause = '';

  if ('start' in input && input.start) {
    params.push(input.start);
    clause += ` AND COALESCE(e.planned_end_at, e.planned_start_at) >= $${params.length}::timestamptz`;
  }
  if ('end' in input && input.end) {
    params.push(input.end);
    clause += ` AND e.planned_start_at <= $${params.length}::timestamptz`;
  }

  const eventTypes = 'eventTypes' in input ? parseMulti(input.eventTypes) : undefined;
  if (eventTypes?.length) {
    params.push(eventTypes);
    clause += ` AND e.event_type = ANY($${params.length}::text[])`;
  }

  const statuses = 'statuses' in input ? parseMulti(input.statuses) : undefined;
  if (statuses?.length) {
    params.push(statuses);
    clause += ` AND e.status = ANY($${params.length}::text[])`;
  }

  clause += buildTestModeClause(input.testMode);
  clause += buildScopeClause(input.scopeType, input.scopeId, params);
  return clause;
}

async function runEventsQuery(whereClause: string, params: unknown[], limit: number): Promise<CalendarEventRecord[]> {
  const queryParams = [...params, limit];
  const result = await query<EventRow>(
    `
      SELECT
        e.event_id,
        e.event_type,
        e.event_category,
        e.title,
        e.description,
        e.planned_start_at,
        e.planned_end_at,
        e.actual_start_at,
        e.actual_end_at,
        e.all_day,
        e.timezone,
        e.status,
        e.priority,
        e.source_type,
        e.source_id,
        e.source_action,
        e.center_id,
        e.warehouse_id,
        e.location_name,
        e.location_address,
        e.metadata,
        e.tags,
        e.updated_at,
        e.version,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'participantId', ep.participant_id,
              'participantRole', ep.participant_role,
              'participationType', ep.participation_type,
              'notify', ep.notify
            )
          ) FILTER (WHERE ep.id IS NOT NULL),
          '[]'::json
        ) AS participants
      FROM calendar_events e
      LEFT JOIN calendar_event_participants ep ON ep.event_id = e.event_id
      WHERE e.archived_at IS NULL
      ${whereClause}
      GROUP BY e.event_id
      ORDER BY e.planned_start_at ASC, e.event_id ASC
      LIMIT $${queryParams.length}
    `,
    queryParams,
  );
  return result.rows.map(mapEventRow);
}

export async function listCalendarEvents(input: CalendarEventsQuery): Promise<CalendarEventRecord[]> {
  const params: unknown[] = [];
  let whereClause = buildVisibilityClause(input.viewerRole, input.viewerCode, input.accessibleIds, params);
  whereClause += buildFilters(input, params);
  return runEventsQuery(whereClause, params, input.limit ?? 250);
}

export async function getCalendarEventById(input: {
  eventId: string;
  viewerRole: string;
  viewerCode: string | null;
  accessibleIds?: string[];
}): Promise<CalendarEventRecord | null> {
  const params: unknown[] = [input.eventId];
  const whereClause =
    ` AND UPPER(e.event_id) = UPPER($1)` +
    buildVisibilityClause(input.viewerRole, input.viewerCode, input.accessibleIds, params);
  const events = await runEventsQuery(whereClause, params, 1);
  return events[0] ?? null;
}

export async function listCalendarAgenda(input: CalendarAgendaQuery): Promise<CalendarAgendaDay[]> {
  const now = new Date();
  const startDate = input.start ? new Date(input.start) : startOfDay(now);
  const endDate = input.end ? new Date(input.end) : addDays(startDate, input.days ?? 14);
  const events = await listCalendarEvents({
    viewerRole: input.viewerRole,
    viewerCode: input.viewerCode,
    accessibleIds: input.accessibleIds,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    limit: input.limit ?? 250,
  });

  const grouped = new Map<string, CalendarAgendaDay>();
  for (const event of events) {
    const date = event.plannedStartAt.slice(0, 10);
    if (!grouped.has(date)) {
      grouped.set(date, {
        date,
        label: formatAgendaLabel(new Date(`${date}T00:00:00Z`)),
        events: [],
      });
    }
    grouped.get(date)!.events.push(event);
  }
  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCalendarSummary(input: CalendarAgendaQuery): Promise<CalendarSummary> {
  const now = new Date();
  const startDate = input.start ? new Date(input.start) : startOfDay(now);
  const endDate = input.end ? new Date(input.end) : addDays(startDate, input.days ?? 30);
  const params: unknown[] = [];
  let whereClause = buildVisibilityClause(input.viewerRole, input.viewerCode, input.accessibleIds, params);
  whereClause += buildFilters(
    {
      ...input,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    params,
  );
  const result = await query<{ status: string; count: string }>(
    `
      SELECT e.status, COUNT(*)::text AS count
      FROM calendar_events e
      WHERE e.archived_at IS NULL
      ${whereClause}
      GROUP BY e.status
    `,
    params,
  );

  const counts = new Map<string, number>();
  let total = 0;
  for (const row of result.rows) {
    const count = Number(row.count || 0);
    counts.set(row.status, count);
    total += count;
  }

  return {
    total,
    scheduled: counts.get('scheduled') ?? 0,
    inProgress: counts.get('in_progress') ?? 0,
    completed: counts.get('completed') ?? 0,
    cancelled: counts.get('cancelled') ?? 0,
  };
}

export async function replaceCalendarProjectionParticipants(eventId: string, participants: CalendarProjectionParticipant[]): Promise<void> {
  await query(`DELETE FROM calendar_event_participants WHERE event_id = $1`, [eventId]);
  const seen = new Set<string>();
  const participantIds: string[] = [];
  const participantRoles: string[] = [];
  const participationTypes: string[] = [];
  const notifyFlags: boolean[] = [];
  for (const participant of participants) {
    const participantId = String(participant.participantId || '').trim().toUpperCase();
    const participantRole = String(participant.participantRole || '').trim().toLowerCase();
    if (!participantId || !participantRole) continue;
    const key = `${participantId}:${participantRole}`;
    if (seen.has(key)) continue;
    seen.add(key);
    participantIds.push(participantId);
    participantRoles.push(participantRole);
    participationTypes.push(participant.participationType ?? 'watcher');
    notifyFlags.push(participant.notify ?? true);
  }

  if (!participantIds.length) {
    return;
  }

  await query(
    `
      INSERT INTO calendar_event_participants (
        event_id,
        participant_id,
        participant_role,
        participation_type,
        notify
      )
      SELECT
        $1,
        participant_id,
        participant_role,
        participation_type,
        notify
      FROM UNNEST(
        $2::text[],
        $3::text[],
        $4::text[],
        $5::boolean[]
      ) AS batch(participant_id, participant_role, participation_type, notify)
    `,
    [eventId, participantIds, participantRoles, participationTypes, notifyFlags],
  );
}

export async function upsertCalendarProjection(input: UpsertCalendarProjectionInput): Promise<string> {
  const result = await query<{ event_id: string }>(
    `
      INSERT INTO calendar_events (
        event_type,
        event_category,
        title,
        description,
        planned_start_at,
        planned_end_at,
        actual_start_at,
        actual_end_at,
        all_day,
        timezone,
        status,
        priority,
        source_type,
        source_id,
        source_action,
        center_id,
        warehouse_id,
        location_name,
        location_address,
        metadata,
        tags,
        created_by,
        created_by_role,
        updated_by,
        source_version,
        source_hash,
        generator_key
      )
      VALUES (
        $1, $2, $3, $4,
        $5::timestamptz, $6::timestamptz,
        $7::timestamptz, $8::timestamptz,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20::jsonb, $21::text[],
        $22, $23, $24, $25, $26, $27
      )
      ON CONFLICT (generator_key) DO UPDATE SET
        event_type = EXCLUDED.event_type,
        event_category = EXCLUDED.event_category,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        planned_start_at = EXCLUDED.planned_start_at,
        planned_end_at = EXCLUDED.planned_end_at,
        actual_start_at = EXCLUDED.actual_start_at,
        actual_end_at = EXCLUDED.actual_end_at,
        all_day = EXCLUDED.all_day,
        timezone = EXCLUDED.timezone,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        source_action = EXCLUDED.source_action,
        center_id = EXCLUDED.center_id,
        warehouse_id = EXCLUDED.warehouse_id,
        location_name = EXCLUDED.location_name,
        location_address = EXCLUDED.location_address,
        metadata = EXCLUDED.metadata,
        tags = EXCLUDED.tags,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by,
        source_version = EXCLUDED.source_version,
        source_hash = EXCLUDED.source_hash,
        version = calendar_events.version + 1
      RETURNING event_id
    `,
    [
      input.eventType,
      input.eventCategory,
      input.title,
      input.description ?? null,
      input.plannedStartAt,
      input.plannedEndAt ?? null,
      input.actualStartAt ?? null,
      input.actualEndAt ?? null,
      input.allDay ?? false,
      input.timezone ?? 'America/Toronto',
      input.status,
      input.priority ?? 'normal',
      input.sourceType,
      input.sourceId,
      input.sourceAction ?? null,
      input.centerId ?? null,
      input.warehouseId ?? null,
      input.locationName ?? null,
      input.locationAddress ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.tags ?? [],
      input.createdBy ?? 'SYSTEM',
      input.createdByRole ?? 'system',
      input.updatedBy ?? null,
      input.sourceVersion ?? null,
      input.sourceHash ?? null,
      input.generatorKey,
    ],
  );
  const eventId = result.rows[0]?.event_id;
  if (!eventId) {
    throw new Error(`Failed to upsert calendar projection for ${input.generatorKey}`);
  }
  await replaceCalendarProjectionParticipants(eventId, input.participants ?? []);
  return eventId;
}

export async function deleteCalendarProjectionByGeneratorKey(generatorKey: string): Promise<void> {
  await query(`DELETE FROM calendar_events WHERE generator_key = $1`, [generatorKey]);
}
