import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubDashboard } from './service';
import type { HubRole } from '../profile/types';

const paramsSchema = z.object({
  cksCode: z.string().min(1),
});

export async function registerDashboardRoutes(server: FastifyInstance) {
  server.get('/api/hub/dashboard/:cksCode', async (request, reply) => {
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
    const dashboard = await getHubDashboard(role, cksCode);
    if (!dashboard) {
      reply.code(404).send({ error: 'Dashboard data not found' });
      return;
    }

    reply.send({ data: dashboard });
  });
}
