import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import type { HubRole } from '../profile/types';
import { getRoleScope, getRoleActivities } from './store';

const paramsSchema = z.object({
  cksCode: z.string().min(1),
});

export async function registerScopeRoutes(server: FastifyInstance) {
  server.get('/api/hub/scope/:cksCode', async (request, reply) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request parameters' });
      return;
    }

    const cksCode = parsed.data.cksCode;
    const account = await requireActiveRole(request, reply, { cksCode });
    if (!account) {
      return;
    }

    const role = (account.role ?? '').trim().toLowerCase() as HubRole;
    const scope = await getRoleScope(role, cksCode);
    if (!scope) {
      reply.code(404).send({ error: 'Role scope not found' });
      return;
    }

    reply.send({ data: scope });
  });

  server.get('/api/hub/activities/:cksCode', async (request, reply) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request parameters' });
      return;
    }

    const cksCode = parsed.data.cksCode;
    const account = await requireActiveRole(request, reply, { cksCode });
    if (!account) {
      return;
    }

    const role = (account.role ?? '').trim().toLowerCase() as HubRole;
    const activities = await getRoleActivities(role, cksCode);
    if (!activities) {
      reply.code(404).send({ error: 'Activities not found' });
      return;
    }

    reply.send({ data: activities });
  });
}
