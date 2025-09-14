import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DirectoryRouteConfig } from './types';
import * as service from './service';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createDirectoryFastifyPlugin = (_config?: DirectoryRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();

    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'directory')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Directory not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'directory') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };

    const querySchema = z.object({
      type: z.enum(['contractor','customer','center','crew','warehouse','manager']).optional(),
      q: z.string().optional(),
      status: z.enum(['active','inactive','archived','pending']).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    });

    // GET / - list directory entities
    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: querySchema } }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const userId = (req as any).user!.userId;
      // Scope is role-dependent; keep entity/ecosystem/global in service layer if needed
      const items = await service.list(userId, (req as any).context?.scope || 'entity', role as any, (req as any).query as any);
      return reply.code(200).send({ success: true, data: items, meta: { role } });
    });

    // Health
    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'directory', role } });
    });

    done();
  };
  return plugin;
};
