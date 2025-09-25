import type { FastifyInstance } from 'fastify';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubReports } from './store';
import type { HubRole } from '../profile/types';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get('/hub/reports/:cksCode', async (request, reply) => {
    const user = await requireActiveRole(request, reply);
    if (!user) return;

    const { cksCode } = request.params as { cksCode: string };

    const reports = await getHubReports(user.role as HubRole, cksCode);
    if (!reports) {
      return reply.code(404).send({ error: 'Reports not found' });
    }

    return reports;
  });
}
