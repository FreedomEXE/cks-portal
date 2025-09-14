import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { z } from 'zod';
import * as dashboardService from './service';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import {
  getDomainCapabilities,
  getDomainFeatures,
  hasDomain,
  resolveDomainConfig,
} from '../../core/config/roleResolver';

// Role-agnostic: config is resolved at request time via roleResolver
export interface DashboardRouteConfig {
  // kept for compatibility; unused in dynamic mode
  capabilities?: any;
  features?: any;
  scope?: 'global' | 'ecosystem' | 'entity';
  roleCode?: string;
}

const kpisQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  metrics: z.string().optional(),
});

const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createDashboardFastifyPlugin = (_config?: DashboardRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();

    // Pre-handlers
    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) {
        return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      }
      // Keep role guard present (validates presence/equality under dynamic routing)
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'dashboard')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Dashboard not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => {
      return async (req, reply) => {
        const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
        const caps: any = getDomainCapabilities(role as any, 'dashboard') || {};
        const cap = caps?.[capKey];
        if (!cap) {
          return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
        }
        return (requireCapsFastify(cap) as any)(req as any, reply as any);
      };
    };

    // KPIs (feature-gated at request-time)
    f.get(
      '/kpis',
      {
        preHandler: [requireRoleAndDomain, requireCap('view')],
        schema: { querystring: kpisQuerySchema },
      },
      async (req, reply) => {
        const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
        const features: any = getDomainFeatures(role as any, 'dashboard') || {};
        if (!features.kpis) {
          return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'KPIs feature disabled for this role', timestamp: new Date().toISOString() } });
        }
        const cfg = resolveDomainConfig(role as any, 'dashboard') as any;
        const userId = (req as any).user!.userId;
        const { period, metrics } = (req as any).query as any;
        const kpis = await dashboardService.getDashboardKPIs(userId, cfg.scope, role as any, { period, metrics });
        return reply.code(200).send({ success: true, data: kpis, meta: { role, scope: cfg.scope, period } });
      }
    );

    // Data
    f.get(
      '/data',
      { preHandler: [requireRoleAndDomain, requireCap('view')] },
      async (req, reply) => {
        const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
        const cfg = resolveDomainConfig(role as any, 'dashboard') as any;
        const features = getDomainFeatures(role as any, 'dashboard') as any;
        const userId = (req as any).user!.userId;
        const data = await dashboardService.getDashboardData(userId, cfg.scope, role as any, features);
        return reply.code(200).send({ success: true, data, meta: { role, scope: cfg.scope, features } });
      }
    );

    // Orders overview
    f.get(
      '/orders',
      { preHandler: [requireRoleAndDomain, requireCap('view')] },
      async (req, reply) => {
        const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
        const cfg = resolveDomainConfig(role as any, 'dashboard') as any;
        const features: any = getDomainFeatures(role as any, 'dashboard') || {};
        if (!features.orders) {
          return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Orders feature disabled for this role', timestamp: new Date().toISOString() } });
        }
        const userId = (req as any).user!.userId;
        const orders = await dashboardService.getOrdersOverview(userId, cfg.scope, role as any);
        return reply.code(200).send({ success: true, data: orders, meta: { role, scope: cfg.scope } });
      }
    );

    // Activity
    f.get(
      '/activity',
      {
        preHandler: [requireRoleAndDomain, requireCap('view')],
        schema: { querystring: activityQuerySchema },
      },
      async (req, reply) => {
        const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
        const cfg = resolveDomainConfig(role as any, 'dashboard') as any;
        const features: any = getDomainFeatures(role as any, 'dashboard') || {};
        if (!features.activity) {
          return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Activity feature disabled for this role', timestamp: new Date().toISOString() } });
        }
        const userId = (req as any).user!.userId;
        const { limit, category, date_from, date_to } = (req as any).query as any;
        const items = await dashboardService.getRecentActivity(userId, cfg.scope, role as any, { limit, category, date_from, date_to });
        return reply.code(200).send({ success: true, data: items, meta: { role, scope: cfg.scope, filters: { category, date_from, date_to } } });
      }
    );

    // Clear activity
    const clearBodySchema = z.object({ code: z.string().min(1), category: z.string().optional() });
    f.post(
      '/clear-activity',
      {
        preHandler: [requireRoleAndDomain, requireCap('manage')],
        schema: { body: clearBodySchema },
      },
      async (req, reply) => {
        const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
        const features: any = getDomainFeatures(role as any, 'dashboard') || {};
        if (!features.clearActivity) {
          return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Clear activity disabled for this role', timestamp: new Date().toISOString() } });
        }
        const userId = (req as any).user!.userId;
        const { code, category } = (req as any).body as any;
        const result = await dashboardService.clearActivity(userId, role as any, code, category);
        return reply.code(200).send({ success: true, data: result, meta: { role, action: 'clear_activity' } });
      }
    );

    // Health
    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).roleContext?.role || (req.params as any)?.role || '').toLowerCase();
      const features: any = getDomainFeatures(role as any, 'dashboard') || {};
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'dashboard', role, features: Object.keys(features).filter((k) => (features as any)[k]) } });
    });

    done();
  };
  return plugin;
};
