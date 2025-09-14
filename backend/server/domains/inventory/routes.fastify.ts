import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { InventoryRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createInventoryFastifyPlugin = (_config?: InventoryRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();
    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'inventory')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Inventory not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'inventory') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };

    // List inventory for the warehouse (userId is warehouse_id)
    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: z.object({ category: z.string().optional(), status: z.enum(['active','inactive']).optional(), q: z.string().optional(), page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(200).optional() }) } }, async (req, reply) => {
      const warehouseId = req.user!.userId;
      const items = await svc.list(warehouseId, (req as any).query as any);
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: items, meta: { role, warehouseId } });
    });

    // Adjust quantity
    f.patch('/:itemId/adjust', { preHandler: [requireRoleAndDomain, requireCap('adjust')], schema: { params: z.object({ itemId: z.string().min(1) }), body: z.object({ delta: z.coerce.number().int() }) } }, async (req, reply) => {
      const warehouseId = (req as any).user!.userId;
      const { itemId } = (req as any).params as any;
      const { delta } = (req as any).body as any;
      const updated = await svc.adjust(warehouseId, String(itemId), Number(delta));
      return reply.code(200).send({ success: true, data: updated, meta: { action: 'adjust' } });
    });

    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'inventory', role } });
    });

    done();
  };
  return plugin;
};
