import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProfileRouteConfig } from './types';
import * as service from './service';
import { requireCapsFastify } from '../../core/fastify/requireCaps';
import { requireRoleFastify } from '../../core/fastify/roleGuard';
import { getDomainCapabilities, hasDomain } from '../../core/config/roleResolver';

export const createProfileFastifyPlugin = (_config?: ProfileRouteConfig): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (app, _opts, done) => {
    const f = app.withTypeProvider<ZodTypeProvider>();

    const requireRoleAndDomain: preHandlerHookHandler = async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      if (!role) return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
      await (requireRoleFastify(role) as any)(req as any, reply as any);
      if ((reply as any).sent) return;
      if (!hasDomain(role as any, 'profile')) {
        return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Profile not available for this role', details: { role }, timestamp: new Date().toISOString() } });
      }
    };

    const requireCap = (...capKeys: string[]): preHandlerHookHandler => async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const caps: any = getDomainCapabilities(role as any, 'profile') || {};
      const found = capKeys.map((k) => caps?.[k]).find(Boolean);
      if (!found) return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { requiredAnyOf: capKeys }, timestamp: new Date().toISOString() } });
      return (requireCapsFastify(found) as any)(req as any, reply as any);
    };

    // GET / - current user's profile
    f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (req, reply) => {
      const userId = (req as any).user!.userId;
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      const profile = await service.getSelfProfile(userId);
      return reply.code(200).send({ success: true, data: profile, meta: { role } });
    });

    // PATCH / - update parts of current user's profile
    const patchSchema = z.object({
      user_name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      template_version: z.string().regex(/^v\d+$/).optional(),
    });

    f.patch('/', { preHandler: [requireRoleAndDomain, requireCap('update','view')], schema: { body: patchSchema } }, async (req, reply) => {
      const userId = (req as any).user!.userId;
      const updated = await service.updateSelfProfile(userId, (req as any).body as any);
      return reply.code(200).send({ success: true, data: updated });
    });

    // Health
    f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
      const role = ((req as any).context?.role || (req.params as any)?.role || '').toLowerCase();
      return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'profile', role } });
    });

    done();
  };
  return plugin;
};
