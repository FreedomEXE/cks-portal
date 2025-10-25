import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubProfile, getUserDetails } from './service';
import type { HubRole } from './types';

const paramsSchema = z.object({
  cksCode: z.string().min(1),
});

const userDetailsParamsSchema = z.object({
  entityType: z.enum(['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse']),
  entityId: z.string().min(1),
});

export async function registerProfileRoutes(server: FastifyInstance) {
  server.get('/api/hub/profile/:cksCode', async (request, reply) => {
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
    const profile = await getHubProfile(role, cksCode);
    if (!profile) {
      reply.code(404).send({ error: 'Profile not found' });
      return;
    }

    reply.send({ data: profile });
  });

  /**
   * GET /api/profile/:entityType/:entityId
   *
   * Universal user details endpoint for modals.
   * Fetches user entity data regardless of lifecycle state (active, archived, or deleted).
   *
   * Returns directory-normalized format with lifecycle state indicator.
   */
  server.get('/api/profile/:entityType/:entityId', async (request, reply) => {
    const parsed = userDetailsParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid entity type or ID' });
      return;
    }

    // AUTH: Require active user (any role)
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return; // requireActiveRole already sent error response
    }

    const { entityType, entityId } = parsed.data;

    try {
      const result = await getUserDetails(entityType, entityId);

      console.log(`[profile] Resolved ${entityType} ${entityId} from ${result.source}`);

      reply.send({
        data: result.data,
        state: result.state,
        deletedAt: result.deletedAt,
        deletedBy: result.deletedBy,
        archivedAt: result.archivedAt,
        archivedBy: result.archivedBy,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User not found';
      reply.code(404).send({ error: message });
    }
  });
}
