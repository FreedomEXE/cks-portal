import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ArchiveRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createArchiveFastifyPlugin = (_config?: ArchiveRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();
    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'archive')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Archive not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'archive') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };

    // Archived orders listing
    f.get('/orders', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: z.object({ limit: z.coerce.number().int().min(1).max(200).optional(), page: z.coerce.number().int().min(1).optional() }) } }, async (req, reply) => {
      const { limit, page } = req.query as any;
      const items = await svc.listArchivedOrders(limit, page);
      return reply.code(200).send({ success: true, data: items });
    });

    // Restore archived order
    f.post('/orders/:orderId/restore', { preHandler: [requireRoleAndDomain, requireCap('restore')], schema: { params: z.object({ orderId: z.coerce.number().int().positive() }) } }, async (req, reply) => {
      const { orderId } = (req as any).params as any;
      const ok = await svc.restoreOrder(Number(orderId));
      if (!ok) return reply.code(404).send({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Order not archived or not found', timestamp: new Date().toISOString() } });
      return reply.code(200).send({ success: true, data: { restored: true, orderId: Number(orderId) } });
    });

    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'archive', role } });
    });

    done();
  };
  return plugin;
};
