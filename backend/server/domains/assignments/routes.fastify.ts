import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AssignmentsRouteConfig } from './types';
import * as svc from './service';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createAssignmentsFastifyPlugin = (_config?: AssignmentsRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();
    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'assignments')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Assignments not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (capKey: string): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'assignments') || {};
      const cap = caps?.[capKey];
      if (!cap) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(cap) as any)(req as any, reply as any);
    };
    const statusEnum = z.enum(['pending','assigned','in_progress','completed','cancelled']);
    const priorityEnum = z.enum(['low','medium','high','urgent']);

    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: z.object({ status: statusEnum.optional(), assignee_id: z.string().optional(), page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(200).optional() }) } }, async (req, reply) => {
      const items = await svc.list(req.query as any);
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: items, meta: { role } });
    });

    f.post('/', { preHandler: [requireRoleAndDomain, requireCap('create')], schema: { body: z.object({ type: z.string().default('task'), subject: z.string().min(3).max(200), assignee_id: z.string().min(3), priority: priorityEnum.default('medium') }) } }, async (req, reply) => {
      const { type, subject, assignee_id, priority } = (req as any).body as any;
      const created = await svc.create(type, subject, assignee_id, priority);
      return reply.code(201).send({ success: true, data: created });
    });

    f.patch('/:assignmentId/status', { preHandler: [requireRoleAndDomain, requireCap('update')], schema: { params: z.object({ assignmentId: z.coerce.number().int().positive() }), body: z.object({ status: statusEnum }) } }, async (req, reply) => {
      const { assignmentId } = (req as any).params as any;
      const { status } = (req as any).body as any;
      const updated = await svc.updateStatus(Number(assignmentId), status);
      return reply.code(200).send({ success: true, data: updated, meta: { action: 'update_status' } });
    });

    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'assignments', role } });
    });

    done();
  };
  return plugin;
};
