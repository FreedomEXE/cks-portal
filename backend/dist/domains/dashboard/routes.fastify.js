"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashboardFastifyPlugin = void 0;
const zod_1 = require("zod");
const dashboardService = __importStar(require("./service"));
const requireCaps_1 = require("../../core/fastify/requireCaps");
const roleGuard_1 = require("../../core/fastify/roleGuard");
const roleResolver_1 = require("../../core/config/roleResolver");
const kpisQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['day', 'week', 'month', 'year']).default('month'),
    metrics: zod_1.z.string().optional(),
});
const activityQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    category: zod_1.z.string().optional(),
    date_from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
const createDashboardFastifyPlugin = (_config) => {
    const plugin = (app, _opts, done) => {
        const f = app.withTypeProvider();
        // Pre-handlers
        const requireRoleAndDomain = async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            if (!role) {
                return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
            }
            // Keep role guard present (validates presence/equality under dynamic routing)
            await (0, roleGuard_1.requireRoleFastify)(role)(req, reply);
            if (reply.sent)
                return;
            if (!(0, roleResolver_1.hasDomain)(role, 'dashboard')) {
                return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Dashboard not available for this role', details: { role }, timestamp: new Date().toISOString() } });
            }
        };
        const requireCap = (capKey) => {
            return async (req, reply) => {
                const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
                const caps = (0, roleResolver_1.getDomainCapabilities)(role, 'dashboard') || {};
                const cap = caps?.[capKey];
                if (!cap) {
                    return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
                }
                return (0, requireCaps_1.requireCapsFastify)(cap)(req, reply);
            };
        };
        // KPIs (feature-gated at request-time)
        f.get('/kpis', {
            preHandler: [requireRoleAndDomain, requireCap('view')],
            schema: { querystring: kpisQuerySchema },
        }, async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            const features = (0, roleResolver_1.getDomainFeatures)(role, 'dashboard') || {};
            if (!features.kpis) {
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'KPIs feature disabled for this role', timestamp: new Date().toISOString() } });
            }
            const cfg = (0, roleResolver_1.resolveDomainConfig)(role, 'dashboard');
            const userId = req.user.userId;
            const { period, metrics } = req.query;
            const kpis = await dashboardService.getDashboardKPIs(userId, cfg.scope, role, { period, metrics });
            return reply.code(200).send({ success: true, data: kpis, meta: { role, scope: cfg.scope, period } });
        });
        // Data
        f.get('/data', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            const cfg = (0, roleResolver_1.resolveDomainConfig)(role, 'dashboard');
            const features = (0, roleResolver_1.getDomainFeatures)(role, 'dashboard');
            const userId = req.user.userId;
            const data = await dashboardService.getDashboardData(userId, cfg.scope, role, features);
            return reply.code(200).send({ success: true, data, meta: { role, scope: cfg.scope, features } });
        });
        // Orders overview
        f.get('/orders', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            const cfg = (0, roleResolver_1.resolveDomainConfig)(role, 'dashboard');
            const features = (0, roleResolver_1.getDomainFeatures)(role, 'dashboard') || {};
            if (!features.orders) {
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Orders feature disabled for this role', timestamp: new Date().toISOString() } });
            }
            const userId = req.user.userId;
            const orders = await dashboardService.getOrdersOverview(userId, cfg.scope, role);
            return reply.code(200).send({ success: true, data: orders, meta: { role, scope: cfg.scope } });
        });
        // Activity
        f.get('/activity', {
            preHandler: [requireRoleAndDomain, requireCap('view')],
            schema: { querystring: activityQuerySchema },
        }, async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            const cfg = (0, roleResolver_1.resolveDomainConfig)(role, 'dashboard');
            const features = (0, roleResolver_1.getDomainFeatures)(role, 'dashboard') || {};
            if (!features.activity) {
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Activity feature disabled for this role', timestamp: new Date().toISOString() } });
            }
            const userId = req.user.userId;
            const { limit, category, date_from, date_to } = req.query;
            const items = await dashboardService.getRecentActivity(userId, cfg.scope, role, { limit, category, date_from, date_to });
            return reply.code(200).send({ success: true, data: items, meta: { role, scope: cfg.scope, filters: { category, date_from, date_to } } });
        });
        // Clear activity
        const clearBodySchema = zod_1.z.object({ code: zod_1.z.string().min(1), category: zod_1.z.string().optional() });
        f.post('/clear-activity', {
            preHandler: [requireRoleAndDomain, requireCap('manage')],
            schema: { body: clearBodySchema },
        }, async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            const features = (0, roleResolver_1.getDomainFeatures)(role, 'dashboard') || {};
            if (!features.clearActivity) {
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Clear activity disabled for this role', timestamp: new Date().toISOString() } });
            }
            const userId = req.user.userId;
            const { code, category } = req.body;
            const result = await dashboardService.clearActivity(userId, role, code, category);
            return reply.code(200).send({ success: true, data: result, meta: { role, action: 'clear_activity' } });
        });
        // Health
        f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
            const role = (req.roleContext?.role || req.params?.role || '').toLowerCase();
            const features = (0, roleResolver_1.getDomainFeatures)(role, 'dashboard') || {};
            return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'dashboard', role, features: Object.keys(features).filter((k) => features[k]) } });
        });
        done();
    };
    return plugin;
};
exports.createDashboardFastifyPlugin = createDashboardFastifyPlugin;
//# sourceMappingURL=routes.fastify.js.map