import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { applyServiceAction, getServiceById, updateServiceMetadata, addServiceCrewRequests } from './service';
import { query } from '../../db/connection';

export async function registerServicesRoutes(server: FastifyInstance) {
  const paramsSchema = z.object({ serviceId: z.string().min(1) });
  const bodySchema = z.object({
    action: z.enum(['start', 'complete', 'verify', 'cancel']),
    notes: z.string().trim().max(1000).optional(),
  });

  server.post('/api/services/:serviceId/actions', async (request, reply) => {
    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid service identifier' });
      return;
    }
    const bodyResult = bodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      reply.code(400).send({ error: 'Invalid action payload', details: bodyResult.error.flatten() });
      return;
    }

    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    try {
      const result = await applyServiceAction({
        serviceId: paramsResult.data.serviceId,
        actorRole: (account.role as any) ?? null,
        actorCode: account.cksCode ?? null,
        action: bodyResult.data.action,
        notes: bodyResult.data.notes ?? null,
      });
      if (!result) {
        reply.code(404).send({ error: 'Service not found' });
        return;
      }
      reply.send({ data: result });
    } catch (err: any) {
      reply.code(400).send({ error: err?.message || 'Failed to apply service action' });
    }
  });

  server.get('/api/services/:serviceId', async (request, reply) => {
    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid service identifier' });
      return;
    }
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;
    const data = await getServiceById(paramsResult.data.serviceId);
    if (!data) {
      reply.code(404).send({ error: 'Service not found' });
      return;
    }
    reply.send({ data });
  });

  server.patch('/api/services/:serviceId', async (request, reply) => {
    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid service identifier' });
      return;
    }
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;
    const body: any = request.body ?? {};
    try {
      const data = await updateServiceMetadata({
        serviceId: paramsResult.data.serviceId,
        actorRole: (account.role as any) ?? null,
        actorCode: account.cksCode ?? null,
        crew: Array.isArray(body.crew) ? body.crew : undefined,
        procedures: Array.isArray(body.procedures) ? body.procedures : undefined,
        training: Array.isArray(body.training) ? body.training : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
      });
      if (!data) {
        reply.code(404).send({ error: 'Service not found' });
        return;
      }
      reply.send({ data });
    } catch (err: any) {
      reply.code(400).send({ error: err?.message || 'Failed to update service' });
    }
  });

  // POST /api/services/:serviceId/crew-requests - Request crew for an existing service (manager only)
  server.post('/api/services/:serviceId/crew-requests', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid service identifier' });
      return;
    }
    const bodySchema = z.object({
      crewCodes: z.array(z.string().trim().min(1)).min(1),
      message: z.string().trim().max(1000).optional(),
    });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid crew request payload', details: body.error.flatten() });
      return;
    }
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;
    if ((account.role || '').toLowerCase() !== 'manager') {
      reply.code(403).send({ error: 'Only managers can request crew for a service' });
      return;
    }
    const managerCode = account.cksCode ?? null;
    if (!managerCode) {
      reply.code(400).send({ error: 'No CKS code associated with the current user' });
      return;
    }
    try {
      const result = await addServiceCrewRequests({
        serviceId: params.data.serviceId,
        managerCode,
        crewCodes: body.data.crewCodes,
        message: body.data.message ?? null,
      });
      reply.send({ data: result });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to request crew for service');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to request crew for service' });
    }
  });

  // POST /api/services/:serviceId/crew-response - Crew respond to a service invite
  server.post('/api/services/:serviceId/crew-response', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid service identifier' });
      return;
    }
    const bodySchema = z.object({ accept: z.boolean() });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid crew response payload', details: body.error.flatten() });
      return;
    }
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;
    if ((account.role || '').toLowerCase() !== 'crew') {
      reply.code(403).send({ error: 'Only crew members can respond to service invites' });
      return;
    }
    const crewCode = account.cksCode ?? null;
    if (!crewCode) {
      reply.code(400).send({ error: 'No CKS code associated with the current user' });
      return;
    }
    try {
      const result = await (await import('./service')).respondToServiceCrewRequest({
        serviceId: params.data.serviceId,
        crewCode,
        accept: body.data.accept,
      });
      reply.send({ data: result });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to respond to service invite');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to respond to service invite' });
    }
  });

  // Return certified services for a given user (per-individual certifications)
  server.get('/api/certified-services', async (request, reply) => {
    const schema = z.object({
      userId: z.string().min(1),
      role: z.enum(['manager', 'crew', 'warehouse']),
      limit: z.coerce.number().int().min(1).max(500).optional(),
    });
    const parsed = schema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid query' });
      return;
    }

    // Require an active session; owning checks can be tightened later if needed
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const { role, limit } = parsed.data;
    const userId = parsed.data.userId.trim().toUpperCase();
    try {
      const result = await query<{
        service_id: string;
        name: string;
        category: string | null;
        is_active: boolean | null;
        updated_at: Date | null;
      }>(
        `SELECT s.service_id, s.name, s.category, s.is_active, s.updated_at
         FROM service_certifications c
         JOIN catalog_services s ON s.service_id = c.service_id
         WHERE c.user_id = $1 AND c.role = $2 AND c.archived_at IS NULL
         ORDER BY s.name
         LIMIT $3`,
        [userId, role, limit ?? 250],
      );
      const data = result.rows.map((r) => ({
        serviceId: r.service_id,
        name: r.name,
        category: r.category,
        status: r.is_active ? 'active' : 'inactive',
        updatedAt: r.updated_at ? r.updated_at.toISOString() : null,
      }));
      reply.send({ data });
    } catch (error) {
      request.log.error({ err: error, userId, role }, 'certified-services failed');
      reply.code(500).send({ error: 'Failed to load certified services' });
    }
  });
}
