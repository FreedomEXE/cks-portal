import { FastifyPluginCallback } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ManagerConfig } from '../roles/manager/config';
import { createDashboardFastifyPlugin } from '../domains/dashboard/routes.fastify';
import { createCatalogFastifyPlugin } from '../domains/catalog/routes.fastify';

type RoleCode = 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

export const roleRegistryFastify: FastifyPluginCallback = (app, _opts, done) => {
  const f = app.withTypeProvider<ZodTypeProvider>();

  // TODO: When other roles have configs in REFACTOR/Backend/server/roles/*/config.ts, import them here
  const registry: Record<RoleCode, (instance: typeof f) => void> = {
    // Admin: wire domains as they’re converted
    admin: (instance) => {
      // Example: instance.register(createDashboardFastifyPlugin(AdminConfig.domains.dashboard), { prefix: '/dashboard' });
    },

    // Manager: demo wiring — dashboard + catalog
    manager: (instance) => {
      instance.register(createDashboardFastifyPlugin(ManagerConfig.domains.dashboard), { prefix: '/dashboard' });
      instance.register(createCatalogFastifyPlugin(ManagerConfig.domains.catalog), { prefix: '/catalog' });
    },

    contractor: (_instance) => {},
    customer: (_instance) => {},
    center: (_instance) => {},
    crew: (_instance) => {},
    warehouse: (_instance) => {},
  };

  // Based on :role param, register that role’s routes under this prefix
  f.register(async function roleScopedRoutes(instance) {
    const params: any = instance['prefix'] ? {} : {}; // no-op placeholder
    // The outer fastify.ts registers this under /api/:role, so we rely on that param
    const role = (instance.prefix || '').split('/').pop()?.toLowerCase() as RoleCode | undefined;
    // Fallback: infer at request-time in a guard

    instance.addHook('onRequest', async (req, reply) => {
      const r = (req.params as any).role as RoleCode;
      if (!r || !registry[r]) {
        return reply.code(400).send({ success: false, error: { code: 'CONTEXT_INVALID_ROLE', message: 'Invalid role', timestamp: new Date().toISOString() } });
      }
    });

    instance.addHook('onReady', () => {
      // Register lazily onReady to make sure sub-prefix is correct
      // We cannot get params here, so we register a per-request gating hook above
      // For now, mount manager statically; other roles can be added similarly
      registry.manager(instance as any);
    });
  });

  done();
};

