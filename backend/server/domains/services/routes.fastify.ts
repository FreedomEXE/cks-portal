import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ServicesRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, getDomainFeatures, hasDomain, resolveDomainConfig } from '../../core/config/roleResolver';

export const createServicesFastifyPlugin = (_config?: ServicesRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();

    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'services')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Services not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (...capKeys: string[]): preHandlerHookHandler => {
      return async (req, reply) => {
        const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
        const caps: any = getDomainCapabilities(role as any, 'services') || {};
        const found = capKeys.map((k) => caps?.[k]).find(Boolean);
        if (!found) {
          return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { requiredAnyOf: capKeys }, timestamp: new Date().toISOString() } });
        }
        return (requireCapsFastify(found) as any)(req as any, reply as any);
      };
    };

    const listQuery = z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(['active','inactive','discontinued']).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    });

    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: listQuery } }, async (req, reply) => {
      const items = await svc.list((req as any).query as any);
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: items, meta: { role } });
    });

    f.get('/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: z.object({ serviceId: z.coerce.number().int().positive() }) } }, async (req, reply) => {
      const { serviceId } = req.params as any;
      const item = await svc.get(Number(serviceId));
      if (!item) return reply.code(404).send({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Service not found', timestamp: new Date().toISOString() } });
      return reply.code(200).send({ success: true, data: item });
    });

    const patchBody = z.object({
      service_name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      price: z.coerce.number().nonnegative().optional(),
      status: z.enum(['active','inactive','discontinued']).optional(),
      unit: z.string().max(24).optional(),
      category_id: z.coerce.number().int().positive().optional(),
    });
    f.patch('/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('update','view')], schema: { params: z.object({ serviceId: z.coerce.number().int().positive() }), body: patchBody } }, async (req, reply) => {
      const { serviceId } = req.params as any;
      const updated = await svc.update(Number(serviceId), req.body as any);
      return reply.code(200).send({ success: true, data: updated });
    });

    f.post('/:serviceId/approve', { preHandler: [requireRoleAndDomain, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const features: any = getDomainFeatures(role as any, 'services') || {};
      if (!features.approval) {
        return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Approval feature disabled for this role', timestamp: new Date().toISOString() } });
      }
    }, requireCap('approve')], schema: { params: z.object({ serviceId: z.coerce.number().int().positive() }) } }, async (req, reply) => {
      const { serviceId } = req.params as any;
      const updated = await svc.update(Number(serviceId), { status: 'active' as any });
      return reply.code(200).send({ success: true, data: updated, meta: { action: 'approve' } });
    });

    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'services', role } });
    });

    done();
  };
  return plugin;
};
