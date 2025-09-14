"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRegistryFastify = void 0;
const config_1 = require("../roles/manager/config");
const routes_fastify_1 = require("../domains/dashboard/routes.fastify");
const routes_fastify_2 = require("../domains/catalog/routes.fastify");
const roleRegistryFastify = (app, _opts, done) => {
    const f = app.withTypeProvider();
    // TODO: When other roles have configs in REFACTOR/Backend/server/roles/*/config.ts, import them here
    const registry = {
        // Admin: wire domains as they’re converted
        admin: (instance) => {
            // Example: instance.register(createDashboardFastifyPlugin(AdminConfig.domains.dashboard), { prefix: '/dashboard' });
        },
        // Manager: demo wiring — dashboard + catalog
        manager: (instance) => {
            instance.register((0, routes_fastify_1.createDashboardFastifyPlugin)(config_1.ManagerConfig.domains.dashboard), { prefix: '/dashboard' });
            instance.register((0, routes_fastify_2.createCatalogFastifyPlugin)(config_1.ManagerConfig.domains.catalog), { prefix: '/catalog' });
        },
        contractor: (_instance) => { },
        customer: (_instance) => { },
        center: (_instance) => { },
        crew: (_instance) => { },
        warehouse: (_instance) => { },
    };
    // Based on :role param, register that role’s routes under this prefix
    f.register(async function roleScopedRoutes(instance) {
        const params = instance['prefix'] ? {} : {}; // no-op placeholder
        // The outer fastify.ts registers this under /api/:role, so we rely on that param
        const role = (instance.prefix || '').split('/').pop()?.toLowerCase();
        // Fallback: infer at request-time in a guard
        instance.addHook('onRequest', async (req, reply) => {
            const r = req.params.role;
            if (!r || !registry[r]) {
                return reply.code(400).send({ success: false, error: { code: 'CONTEXT_INVALID_ROLE', message: 'Invalid role', timestamp: new Date().toISOString() } });
            }
        });
        instance.addHook('onReady', () => {
            // Register lazily onReady to make sure sub-prefix is correct
            // We cannot get params here, so we register a per-request gating hook above
            // For now, mount manager statically; other roles can be added similarly
            registry.manager(instance);
        });
    });
    done();
};
exports.roleRegistryFastify = roleRegistryFastify;
//# sourceMappingURL=roleRegistry.fastify.js.map