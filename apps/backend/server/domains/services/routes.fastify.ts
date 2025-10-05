import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { applyServiceAction, getServiceById, updateServiceMetadata } from './service';
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
