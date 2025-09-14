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
exports.createReportsFastifyPlugin = void 0;
const zod_1 = require("zod");
const svc = __importStar(require("./service"));
const roleGuard_1 = require("../../core/fastify/roleGuard");
const requireCaps_1 = require("../../core/fastify/requireCaps");
const roleResolver_1 = require("../../core/config/roleResolver");
const createReportsFastifyPlugin = (_config) => {
    const plugin = (app, _opts, done) => {
        const f = app.withTypeProvider();
        const requireRoleAndDomain = async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            if (!role)
                return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
            await (0, roleGuard_1.requireRoleFastify)(role)(req, reply);
            if (reply.sent)
                return;
            if (!(0, roleResolver_1.hasDomain)(role, 'reports')) {
                return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Reports not available for this role', details: { role }, timestamp: new Date().toISOString() } });
            }
        };
        const requireCap = (capKey) => async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            const caps = (0, roleResolver_1.getDomainCapabilities)(role, 'reports') || {};
            const cap = caps?.[capKey];
            if (!cap)
                return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
            return (0, requireCaps_1.requireCapsFastify)(cap)(req, reply);
        };
        const timeframeEnum = zod_1.z.enum(['week', 'month', 'quarter', 'year']).default('month');
        // GET /summary -> status counts + revenue trend
        f.get('/summary', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: zod_1.z.object({ timeframe: timeframeEnum.optional() }) } }, async (req, reply) => {
            const { timeframe } = req.query || {};
            const data = await svc.getSummary(timeframe);
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            return reply.code(200).send({ success: true, data, meta: { role, timeframe: timeframe || 'month' } });
        });
        // Export (basic JSON export for now)
        f.get('/export', { preHandler: [requireRoleAndDomain, requireCap('export')], schema: { querystring: zod_1.z.object({ report: zod_1.z.enum(['orders_status', 'revenue_trend']), timeframe: timeframeEnum.optional() }) } }, async (req, reply) => {
            const { report, timeframe } = req.query;
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
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'reports', role } });
        });
        done();
    };
    return plugin;
};
exports.createReportsFastifyPlugin = createReportsFastifyPlugin;
//# sourceMappingURL=routes.fastify.js.map