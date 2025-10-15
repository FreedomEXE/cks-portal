import { FastifyPluginAsync } from 'fastify';
import { getEntityWithFallback, checkEntityAccess } from './service';
import { requireActiveRole } from '../../core/auth/guards';

const entityRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/entity/:type/:id?includeDeleted=1
   *
   * Fetch entity with smart fallback:
   * - Returns active entity if available
   * - Returns archived entity if not active
   * - Returns deleted entity snapshot if includeDeleted=1 and entity was hard deleted
   *
   * AUTH: Requires active role (any authenticated user)
   * SCOPE:
   *   - Only admin can access deleted snapshots (includeDeleted=1)
   *   - Non-admin users can only access entities in their ecosystem
   *
   * Response:
   * {
   *   entity: { ...entity data... },
   *   state: 'active' | 'archived' | 'deleted',
   *   deletedAt?: string,    // Only for deleted
   *   deletedBy?: string     // Only for deleted
   * }
   */
  fastify.get<{
    Params: { type: string; id: string };
    Querystring: { includeDeleted?: string };
  }>('/entity/:type/:id', async (request, reply) => {
    // AUTH: Require active user
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return; // requireActiveRole already sent error response
    }

    const { type, id } = request.params;
    const includeDeleted = request.query.includeDeleted === '1';

    // SCOPE: Only admin can access deleted entity snapshots
    if (includeDeleted && !account.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        reason: 'Only admins can access deleted entities'
      });
    }

    // SCOPE: Check ecosystem access
    // Admin bypasses this check, other roles must have entity in their ecosystem
    const hasAccess = await checkEntityAccess(
      account.role as any,
      account.cksCode,
      type,
      id
    );

    if (!hasAccess) {
      return reply.code(403).send({
        error: 'Forbidden',
        reason: 'Entity not in your ecosystem scope'
      });
    }

    try {
      const result = await getEntityWithFallback(type, id, includeDeleted);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Entity not found';
      reply.code(404).send({ error: message });
    }
  });
};

export default entityRoutes;
