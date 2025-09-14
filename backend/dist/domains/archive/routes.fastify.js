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
exports.createArchiveFastifyPlugin = void 0;
const zod_1 = require("zod");
const svc = __importStar(require("./service"));
const roleGuard_1 = require("../../core/fastify/roleGuard");
const requireCaps_1 = require("../../core/fastify/requireCaps");
const roleResolver_1 = require("../../core/config/roleResolver");
const createArchiveFastifyPlugin = (_config) => {
    const plugin = (app, _opts, done) => {
        const f = app.withTypeProvider();
        const requireRoleAndDomain = async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            if (!role)
                return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
            await (0, roleGuard_1.requireRoleFastify)(role)(req, reply);
            if (reply.sent)
                return;
            if (!(0, roleResolver_1.hasDomain)(role, 'archive')) {
                return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Archive not available for this role', details: { role }, timestamp: new Date().toISOString() } });
            }
        };
        const requireCap = (capKey) => async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            const caps = (0, roleResolver_1.getDomainCapabilities)(role, 'archive') || {};
            const cap = caps?.[capKey];
            if (!cap)
                return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
            return (0, requireCaps_1.requireCapsFastify)(cap)(req, reply);
        };
        // Archived orders listing
        f.get('/orders', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: zod_1.z.object({ limit: zod_1.z.coerce.number().int().min(1).max(200).optional(), page: zod_1.z.coerce.number().int().min(1).optional() }) } }, async (req, reply) => {
            const { limit, page } = req.query;
            const items = await svc.listArchivedOrders(limit, page);
            return reply.code(200).send({ success: true, data: items });
        });
        // Restore archived order
        f.post('/orders/:orderId/restore', { preHandler: [requireRoleAndDomain, requireCap('restore')], schema: { params: zod_1.z.object({ orderId: zod_1.z.coerce.number().int().positive() }) } }, async (req, reply) => {
            const { orderId } = req.params;
            const ok = await svc.restoreOrder(Number(orderId));
            if (!ok)
                return reply.code(404).send({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Order not archived or not found', timestamp: new Date().toISOString() } });
            return reply.code(200).send({ success: true, data: { restored: true, orderId: Number(orderId) } });
        });
        f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'archive', role } });
        });
        done();
    };
    return plugin;
};
exports.createArchiveFastifyPlugin = createArchiveFastifyPlugin;
//# sourceMappingURL=routes.fastify.js.map