import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ReportsRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createReportsFastifyPlugin = (_config?: ReportsRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();
    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'reports')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Reports not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'reports') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };

    const timeframeEnum = z.enum(['week','month','quarter','year']).default('month');

    // GET /summary -> status counts + revenue trend
    f.get('/summary', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: z.object({ timeframe: timeframeEnum.optional() }) } }, async (req, reply) => {
      const { timeframe } = ((req as any).query as any) || {};
      const data = await svc.getSummary(timeframe);
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data, meta: { role, timeframe: timeframe || 'month' } });
    });

    // Export (basic JSON export for now)
    f.get('/export', { preHandler: [requireRoleAndDomain, requireCap('export')], schema: { querystring: z.object({ report: z.enum(['orders_status','revenue_trend']), timeframe: timeframeEnum.optional() }) } }, async (req, reply) => {
      const { report, timeframe } = (req as any).query as any;
      if (report === 'orders_status') {
        const data = (await svc.getSummary(timeframe)).statusCounts;
        return reply.code(200).send({ success: true, data, meta: { report } });
      }
      if (report === 'revenue_trend') {
        const data = (await svc.getSummary(timeframe)).revenueTrend;
        return reply.code(200).send({ success: true, data, meta: { report } });
      }
      return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'Unsupported report type', timestamp: new Date().toISOString() } });
    });

    // Health
    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'reports', role } });
    });

    done();
  };
  return plugin;
};
