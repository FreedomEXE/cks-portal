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
exports.createProfileFastifyPlugin = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./service"));
const requireCaps_1 = require("../../core/fastify/requireCaps");
const roleGuard_1 = require("../../core/fastify/roleGuard");
const roleResolver_1 = require("../../core/config/roleResolver");
const createProfileFastifyPlugin = (_config) => {
    const plugin = (app, _opts, done) => {
        const f = app.withTypeProvider();
        const requireRoleAndDomain = async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            if (!role)
                return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
            await (0, roleGuard_1.requireRoleFastify)(role)(req, reply);
            if (reply.sent)
                return;
            if (!(0, roleResolver_1.hasDomain)(role, 'profile')) {
                return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Profile not available for this role', details: { role }, timestamp: new Date().toISOString() } });
            }
        };
        const requireCap = (...capKeys) => async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            const caps = (0, roleResolver_1.getDomainCapabilities)(role, 'profile') || {};
            const found = capKeys.map((k) => caps?.[k]).find(Boolean);
            if (!found)
                return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { requiredAnyOf: capKeys }, timestamp: new Date().toISOString() } });
            return (0, requireCaps_1.requireCapsFastify)(found)(req, reply);
        };
        // GET / - current user's profile
        f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (req, reply) => {
            const userId = req.user.userId;
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            const profile = await service.getSelfProfile(userId);
            return reply.code(200).send({ success: true, data: profile, meta: { role } });
        });
        // PATCH / - update parts of current user's profile
        const patchSchema = zod_1.z.object({
            user_name: zod_1.z.string().min(1).max(100).optional(),
            email: zod_1.z.string().email().optional(),
            template_version: zod_1.z.string().regex(/^v\d+$/).optional(),
        });
        f.patch('/', { preHandler: [requireRoleAndDomain, requireCap('update', 'view')], schema: { body: patchSchema } }, async (req, reply) => {
            const userId = req.user.userId;
            const updated = await service.updateSelfProfile(userId, req.body);
            return reply.code(200).send({ success: true, data: updated });
        });
        // Health
        f.get('/health', { preHandler: [requireRoleAndDomain] }, async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            return reply.code(200).send({ success: true, data: { status: 'ok', domain: 'profile', role } });
        });
        done();
    };
    return plugin;
};
exports.createProfileFastifyPlugin = createProfileFastifyPlugin;
//# sourceMappingURL=routes.fastify.js.map