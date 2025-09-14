import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { OrdersRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, getDomainFeatures, hasDomain, resolveDomainConfig } from '../../core/config/roleResolver';

export const createOrdersFastifyPlugin = (_config?: OrdersRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();

    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'orders')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Orders not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (...capKeys: string[]): preHandlerHookHandler => {
      return async (req, reply) => {
        const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
        const caps: any = getDomainCapabilities(role as any, 'orders') || {};
        const found = capKeys.map((k) => caps?.[k]).find(Boolean);
        if (!found) {
          return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { requiredAnyOf: capKeys }, timestamp: new Date().toISOString() } });
        }
        return (requireCapsFastify(found) as any)(req as any, reply as any);
      };
    };

    const statusEnum = z.enum(['pending','approved','in_progress','completed','cancelled','archived']);

    const listQuery = z.object({
      status: statusEnum.optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    });

    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: listQuery } }, async (req, reply) => {
      const items = await svc.list(req.query as any);
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: items, meta: { role } });
    });

    f.get('/:orderId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: z.object({ orderId: z.coerce.number().int().positive() }) } }, async (req, reply) => {
      const { orderId } = req.params as any;
      const item = await svc.get(Number(orderId));
      if (!item) return reply.code(404).send({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Order not found', timestamp: new Date().toISOString() } });
      return reply.code(200).send({ success: true, data: item });
    });

    const patchBody = z.object({ status: statusEnum });
    f.patch('/:orderId/status', { preHandler: [requireRoleAndDomain, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const features: any = getDomainFeatures(role as any, 'orders') || {};
      if (features && features.statusTracking === false) {
        return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Status tracking disabled for this role', timestamp: new Date().toISOString() } });
      }
    }, requireCap('update','approve','view')], schema: { params: z.object({ orderId: z.coerce.number().int().positive() }), body: patchBody } }, async (req, reply) => {
      const { orderId } = req.params as any;
      const { status } = req.body as any;
      const updated = await svc.updateStatus(Number(orderId), status);
      return reply.code(200).send({ success: true, data: updated, meta: { action: 'update_status' } });
    });

    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'orders', role } });
    });

    done();
  };
  return plugin;
};
