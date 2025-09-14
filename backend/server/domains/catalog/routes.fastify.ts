import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import pool from '../../db/connection';
import { CatalogRepository } from './repository';
import { CatalogService } from './service';
import { CatalogRouteConfig } from './types';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { getDomainCapabilities, getDomainFeatures, hasDomain } from '../../core/config/roleResolver';

const repo = new CatalogRepository(pool as any);
const svc = new CatalogService(repo);

export const createCatalogFastifyPlugin = (_config?: CatalogRouteConfig & { roleCode?: string }): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();
    // Global catalog: role-aware via req.context.role; deny-by-default
    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      // Catalog is mounted under /api, not /api/:role; we still require a role context from auth/mock
      if (!role) return reply.code(401).send({ success: false, error: { code: 'AUTH_CONTEXT_REQUIRED', message: 'Authenticated role required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'catalog')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Catalog not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'catalog') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };

    const featuresFor = (req: any) => getDomainFeatures(((req as any).context?.role || '').toLowerCase() as any, 'catalog') as any || {};

    // Browse catalog
    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: z.object({ q: z.string().optional(), type: z.enum(['service','product']).optional(), category: z.string().optional(), limit: z.coerce.number().int().min(1).max(200).optional(), offset: z.coerce.number().int().min(0).optional(), active: z.coerce.boolean().optional(), }) } }, async (req, reply) => {
      const feats = featuresFor(req);
      if (!(feats.browse || feats.search)) {
        return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Catalog browse/search disabled for this role', timestamp: new Date().toISOString() } });
      }
      const items = await svc.getCatalogItems((req as any).query as any);
      return reply.code(200).send({ success: true, data: items });
    });

    // Categories
    f.get('/categories', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (_req, reply) => {
      const cats = await svc.getCategories();
      return reply.code(200).send({ success: true, data: cats });
    });
    f.get('/categories/tree', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (_req, reply) => {
      const tree = await svc.getCategoriesTree();
      return reply.code(200).send({ success: true, data: tree });
    });

    // Contractor My Services (if enabled)
    f.get('/my-services', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (req, reply) => {
      const feats = featuresFor(req);
      if (!feats.myServices) return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
      const contractorId = (req as any).user!.userId;
      const items = await svc.getContractorServices(contractorId);
      return reply.code(200).send({ success: true, data: items });
    });

    const addSchema = z.object({ serviceId: z.coerce.number().int().positive() });
    f.post('/my-services', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { body: addSchema } }, async (req, reply) => {
      const feats = featuresFor(req);
      if (!feats.myServices) return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
      const contractorId = (req as any).user!.userId;
      const { serviceId } = (req as any).body as any;
      await svc.addContractorService(contractorId, serviceId);
      return reply.code(201).send({ success: true });
    });

    const patchSchema = z.object({ contractor_price: z.coerce.number().nonnegative().optional(), is_available: z.coerce.boolean().optional(), lead_time_hours: z.coerce.number().int().nonnegative().optional(), notes: z.string().max(500).optional(), });
    f.patch('/my-services/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: z.object({ serviceId: z.coerce.number().int().positive() }), body: patchSchema } }, async (req, reply) => {
      const feats = featuresFor(req);
      if (!feats.myServices) return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
      const contractorId = (req as any).user!.userId;
      const { serviceId } = (req as any).params as any;
      await svc.updateContractorService(contractorId, Number(serviceId), (req as any).body as any);
      return reply.code(200).send({ success: true });
    });

    f.delete('/my-services/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: z.object({ serviceId: z.coerce.number().int().positive() }) } }, async (req, reply) => {
      const feats = featuresFor(req);
      if (!feats.myServices) return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
      const contractorId = (req as any).user!.userId;
      const { serviceId } = (req as any).params as any;
      await svc.removeContractorService(contractorId, Number(serviceId));
      return reply.code(204).send();
    });

    done();
  };
  return plugin;
};
