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
exports.createServicesFastifyPlugin = void 0;
const zod_1 = require("zod");
const svc = __importStar(require("./service"));
const roleGuard_1 = require("../../core/fastify/roleGuard");
const requireCaps_1 = require("../../core/fastify/requireCaps");
const roleResolver_1 = require("../../core/config/roleResolver");
const createServicesFastifyPlugin = (_config) => {
    const plugin = (app, _opts, done) => {
        const f = app.withTypeProvider();
        const requireRoleAndDomain = async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            if (!role)
                return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
            await (0, roleGuard_1.requireRoleFastify)(role)(req, reply);
            if (reply.sent)
                return;
            if (!(0, roleResolver_1.hasDomain)(role, 'services')) {
                return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Services not available for this role', details: { role }, timestamp: new Date().toISOString() } });
            }
        };
        const requireCap = (...capKeys) => {
            return async (req, reply) => {
                const role = (req.context?.role || req.params?.role || '').toLowerCase();
                const caps = (0, roleResolver_1.getDomainCapabilities)(role, 'services') || {};
                const found = capKeys.map((k) => caps?.[k]).find(Boolean);
                if (!found) {
                    return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { requiredAnyOf: capKeys }, timestamp: new Date().toISOString() } });
                }
                return (0, requireCaps_1.requireCapsFastify)(found)(req, reply);
            };
        };
        const listQuery = zod_1.z.object({
            q: zod_1.z.string().optional(),
            category: zod_1.z.string().optional(),
            status: zod_1.z.enum(['active', 'inactive', 'discontinued']).optional(),
            limit: zod_1.z.coerce.number().int().min(1).max(200).optional(),
            offset: zod_1.z.coerce.number().int().min(0).optional(),
        });
        f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: listQuery } }, async (req, reply) => {
            const items = await svc.list(req.query);
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            return reply.code(200).send({ success: true, data: items, meta: { role } });
        });
        f.get('/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: zod_1.z.object({ serviceId: zod_1.z.coerce.number().int().positive() }) } }, async (req, reply) => {
            const { serviceId } = req.params;
            const item = await svc.get(Number(serviceId));
            if (!item)
                return reply.code(404).send({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Service not found', timestamp: new Date().toISOString() } });
            return reply.code(200).send({ success: true, data: item });
        });
        const patchBody = zod_1.z.object({
            service_name: zod_1.z.string().min(1).max(200).optional(),
            description: zod_1.z.string().max(2000).optional(),
            price: zod_1.z.coerce.number().nonnegative().optional(),
            status: zod_1.z.enum(['active', 'inactive', 'discontinued']).optional(),
            unit: zod_1.z.string().max(24).optional(),
            category_id: zod_1.z.coerce.number().int().positive().optional(),
        });
        f.patch('/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('update', 'view')], schema: { params: zod_1.z.object({ serviceId: zod_1.z.coerce.number().int().positive() }), body: patchBody } }, async (req, reply) => {
            const { serviceId } = req.params;
            const updated = await svc.update(Number(serviceId), req.body);
            return reply.code(200).send({ success: true, data: updated });
        });
        f.post('/:serviceId/approve', { preHandler: [requireRoleAndDomain, async (req, reply) => {
                    const role = (req.context?.role || req.params?.role || '').toLowerCase();
                    const features = (0, roleResolver_1.getDomainFeatures)(role, 'services') || {};
                    if (!features.approval) {
                        return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Approval feature disabled for this role', timestamp: new Date().toISOString() } });
                    }
                }, requireCap('approve')], schema: { params: zod_1.z.object({ serviceId: zod_1.z.coerce.number().int().positive() }) } }, async (req, reply) => {
            const { serviceId } = req.params;
            const updated = await svc.update(Number(serviceId), { status: 'active' });
            return reply.code(200).send({ success: true, data: updated, meta: { action: 'approve' } });
        });
        f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'services', role } });
        });
        done();
    };
    return plugin;
};
exports.createServicesFastifyPlugin = createServicesFastifyPlugin;
//# sourceMappingURL=routes.fastify.js.map