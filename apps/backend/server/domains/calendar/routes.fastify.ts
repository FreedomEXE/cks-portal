/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: routes.fastify.ts
 *
 * Description:
 * Read-only calendar API routes.
 *
 * Responsibilities:
 * - Validate requests
 * - Enforce active-role access
 * - Return events, agenda windows, and summary counts
 *
 * Role in system:
 * - Registered by the backend server bootstrap
 *
 * Notes:
 * - Calendar write operations are intentionally not exposed publicly
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { FastifyInstance } from 'fastify';
import { requireActiveRole } from '../../core/auth/guards.js';
import type { HubRole } from '../profile/types.js';
import { fetchCalendarAgenda, fetchCalendarEventById, fetchCalendarEvents, fetchCalendarSummary } from './service.js';
import { calendarAgendaQuerySchema, calendarEventParamsSchema, calendarEventsQuerySchema } from './validators.js';

function normalizeRole(value: string | null | undefined): HubRole | null {
  const normalized = (value || '').trim().toLowerCase();
  switch (normalized) {
    case 'admin':
    case 'manager':
    case 'contractor':
    case 'customer':
    case 'center':
    case 'crew':
    case 'warehouse':
      return normalized;
    default:
      return null;
  }
}

export async function registerCalendarRoutes(server: FastifyInstance) {
  server.get('/api/calendar/events', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const parsed = calendarEventsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid calendar query', details: parsed.error.flatten() });
      return;
    }

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for calendar access' });
      return;
    }

    const data = await fetchCalendarEvents({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      start: parsed.data.start,
      end: parsed.data.end,
      scopeType: parsed.data.scopeType,
      scopeId: parsed.data.scopeId,
      eventTypes: parsed.data.eventTypes,
      statuses: parsed.data.statuses,
      limit: parsed.data.limit ?? 250,
    });

    reply.send({ data });
  });

  server.get('/api/calendar/events/:eventId', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const params = calendarEventParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid event identifier' });
      return;
    }

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for calendar access' });
      return;
    }

    const data = await fetchCalendarEventById({
      eventId: params.data.eventId,
      viewerRole,
      viewerCode: account.cksCode ?? null,
    });

    if (!data) {
      reply.code(404).send({ error: 'Calendar event not found' });
      return;
    }

    reply.send({ data });
  });

  server.get('/api/calendar/agenda', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const parsed = calendarAgendaQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid agenda query', details: parsed.error.flatten() });
      return;
    }

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for calendar access' });
      return;
    }

    const data = await fetchCalendarAgenda({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      start: parsed.data.start,
      end: parsed.data.end,
      days: parsed.data.days ?? 14,
      scopeType: parsed.data.scopeType,
      scopeId: parsed.data.scopeId,
      limit: parsed.data.limit ?? 250,
    });

    reply.send({ data });
  });

  server.get('/api/calendar/summary', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const parsed = calendarAgendaQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid summary query', details: parsed.error.flatten() });
      return;
    }

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for calendar access' });
      return;
    }

    const data = await fetchCalendarSummary({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      start: parsed.data.start,
      end: parsed.data.end,
      days: parsed.data.days ?? 30,
      scopeType: parsed.data.scopeType,
      scopeId: parsed.data.scopeId,
      limit: parsed.data.limit ?? 500,
    });

    reply.send({ data });
  });
}
