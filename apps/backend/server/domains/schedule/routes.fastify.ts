/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: routes.fastify.ts
 *
 * Description:
 * Schedule read and authoring routes.
 *
 * Responsibilities:
 * - Validate Schedule requests
 * - Enforce role-based authoring access
 * - Return block, day-plan, and write responses
 *
 * Role in system:
 * - Registered by the backend server bootstrap
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { FastifyInstance } from 'fastify';
import { requireActiveRole } from '../../core/auth/guards.js';
import type { HubRole } from '../profile/types.js';
import {
  cancelBlocksForSource,
  fetchBuildingWeeklyExport,
  fetchScheduleBlockById,
  fetchScheduleBlocks,
  fetchCrewDailyExport,
  fetchScheduleDayPlan,
  getScheduleBlock,
  saveScheduleBlock,
} from './service.js';
import {
  scheduleBlockBodySchema,
  scheduleBlockParamsSchema,
  scheduleBuildingWeeklyExportQuerySchema,
  scheduleCrewDailyExportQuerySchema,
  scheduleDayPlanQuerySchema,
  scheduleReadQuerySchema,
} from './validators.js';

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

function canAuthorSchedule(role: HubRole): boolean {
  return role === 'admin' || role === 'manager';
}

export async function registerScheduleRoutes(server: FastifyInstance) {
  server.get('/api/schedule/blocks', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for schedule access' });
      return;
    }

    const parsed = scheduleReadQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid schedule query', details: parsed.error.flatten() });
      return;
    }

    const data = await fetchScheduleBlocks({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      query: parsed.data,
    });

    reply.send({ data });
  });

  server.get('/api/schedule/day-plan', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for schedule access' });
      return;
    }

    const parsed = scheduleDayPlanQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid day plan query', details: parsed.error.flatten() });
      return;
    }

    const data = await fetchScheduleDayPlan({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      query: parsed.data,
    });

    reply.send({ data });
  });

  server.get('/api/schedule/export/crew-daily', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for schedule access' });
      return;
    }

    const parsed = scheduleCrewDailyExportQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid crew export query', details: parsed.error.flatten() });
      return;
    }

    const data = await fetchCrewDailyExport({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      query: parsed.data,
    });

    if (!data) {
      reply.code(404).send({ error: 'Crew daily export not found' });
      return;
    }

    reply.send({ data });
  });

  server.get('/api/schedule/export/building-weekly', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for schedule access' });
      return;
    }

    const parsed = scheduleBuildingWeeklyExportQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid building export query', details: parsed.error.flatten() });
      return;
    }

    const data = await fetchBuildingWeeklyExport({
      viewerRole,
      viewerCode: account.cksCode ?? null,
      query: parsed.data,
    });

    if (!data) {
      reply.code(404).send({ error: 'Building weekly export not found' });
      return;
    }

    reply.send({ data });
  });

  server.get('/api/schedule/blocks/:blockId', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole) {
      reply.code(403).send({ error: 'Unsupported role for schedule access' });
      return;
    }

    const params = scheduleBlockParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid block identifier' });
      return;
    }

    const data = await fetchScheduleBlockById({
      blockId: params.data.blockId,
      viewerRole,
      viewerCode: account.cksCode ?? null,
    });

    if (!data) {
      reply.code(404).send({ error: 'Schedule block not found' });
      return;
    }

    reply.send({ data });
  });

  server.post('/api/schedule/blocks', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole || !canAuthorSchedule(viewerRole)) {
      reply.code(403).send({ error: 'Schedule authoring is restricted to admin and manager roles' });
      return;
    }

    const parsed = scheduleBlockBodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid schedule block payload', details: parsed.error.flatten() });
      return;
    }

    let blockId: string;
    try {
      blockId = await saveScheduleBlock({
        ...parsed.data,
        createdBy: account.cksCode ?? 'SYSTEM',
        updatedBy: account.cksCode ?? 'SYSTEM',
      });
    } catch (error) {
      if ((error as { statusCode?: number } | null)?.statusCode === 409) {
        reply.code(409).send({ error: (error as Error).message });
        return;
      }
      throw error;
    }

    const data = await getScheduleBlock(blockId);
    reply.code(201).send({ data });
  });

  server.patch('/api/schedule/blocks/:blockId', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const viewerRole = normalizeRole(account.role ?? null);
    if (!viewerRole || !canAuthorSchedule(viewerRole)) {
      reply.code(403).send({ error: 'Schedule authoring is restricted to admin and manager roles' });
      return;
    }

    const params = scheduleBlockParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid block identifier' });
      return;
    }

    const parsed = scheduleBlockBodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid schedule block payload', details: parsed.error.flatten() });
      return;
    }

    const existing = await getScheduleBlock(params.data.blockId);
    if (!existing) {
      reply.code(404).send({ error: 'Schedule block not found' });
      return;
    }

    let blockId: string;
    try {
      blockId = await saveScheduleBlock({
        ...parsed.data,
        blockId: params.data.blockId,
        updatedBy: account.cksCode ?? 'SYSTEM',
        createdBy: existing.createdBy ?? account.cksCode ?? 'SYSTEM',
      });
    } catch (error) {
      if ((error as { statusCode?: number } | null)?.statusCode === 409) {
        reply.code(409).send({ error: (error as Error).message });
        return;
      }
      throw error;
    }

    const data = await getScheduleBlock(blockId);
    reply.send({ data });
  });

  server.post('/api/schedule/source-cancellation', async (request, reply) => {
    const account = await requireActiveRole(request, reply, { role: ['admin', 'manager'] });
    if (!account) return;

    const body = request.body as { sourceType?: string; sourceId?: string } | null;
    if (!body?.sourceType || !body?.sourceId) {
      reply.code(400).send({ error: 'sourceType and sourceId are required' });
      return;
    }

    const data = await cancelBlocksForSource({
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      updatedBy: account.cksCode ?? 'SYSTEM',
    });

    reply.send({ data });
  });
}
