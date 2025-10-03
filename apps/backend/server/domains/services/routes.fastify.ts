import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { applyServiceAction, getServiceById, updateServiceMetadata } from './service';

export async function registerServicesRoutes(server: FastifyInstance) {
  const paramsSchema = z.object({ serviceId: z.string().min(1) });
  const bodySchema = z.object({
    action: z.enum(['start', 'complete', 'verify']),
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
}
