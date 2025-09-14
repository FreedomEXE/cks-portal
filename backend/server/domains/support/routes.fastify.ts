import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { SupportRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createSupportFastifyPlugin = (_config?: SupportRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();

    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'support')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Support not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'support') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };

    const statusEnum = z.enum(['open','in_progress','resolved','closed']);
    const priorityEnum = z.enum(['low','medium','high','urgent']);

    // List tickets
    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: z.object({ status: statusEnum.optional(), priority: priorityEnum.optional(), limit: z.coerce.number().int().min(1).max(200).optional(), page: z.coerce.number().int().min(1).optional() }) } }, async (req, reply) => {
      const items = await svc.list(req.query as any);
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: items, meta: { role } });
    });

    // Create ticket
    f.post('/', { preHandler: [requireRoleAndDomain, requireCap('create')], schema: { body: z.object({ subject: z.string().min(3).max(200), description: z.string().max(4000).optional(), priority: priorityEnum.default('medium') }) } }, async (req, reply) => {
      const body = (req as any).body as any;
      const created = await svc.create(body.subject, body.description, body.priority, (req as any).user!.userId);
      return reply.code(201).send({ success: true, data: created });
    });

    // Update status
    f.patch('/:ticketId/status', { preHandler: [requireRoleAndDomain, requireCap('update')], schema: { params: z.object({ ticketId: z.coerce.number().int().positive() }), body: z.object({ status: statusEnum }) } }, async (req, reply) => {
      const { ticketId } = (req as any).params as any;
      const { status } = (req as any).body as any;
      const updated = await svc.updateStatus(Number(ticketId), status);
      return reply.code(200).send({ success: true, data: updated, meta: { action: 'update_status' } });
    });

    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'support', role } });
    });

    done();
  };
  return plugin;
};
