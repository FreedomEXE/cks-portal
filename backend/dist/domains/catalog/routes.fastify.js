"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCatalogFastifyPlugin = void 0;
const zod_1 = require("zod");
const connection_1 = __importDefault(require("../../db/connection"));
const repository_1 = require("./repository");
const service_1 = require("./service");
const requireCaps_1 = require("../../core/fastify/requireCaps");
const roleGuard_1 = require("../../core/fastify/roleGuard");
const roleResolver_1 = require("../../core/config/roleResolver");
const repo = new repository_1.CatalogRepository(connection_1.default);
const svc = new service_1.CatalogService(repo);
const createCatalogFastifyPlugin = (_config) => {
    const plugin = (app, _opts, done) => {
        const f = app.withTypeProvider();
        // Global catalog: role-aware via req.context.role; deny-by-default
        const requireRoleAndDomain = async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            // Catalog is mounted under /api, not /api/:role; we still require a role context from auth/mock
            if (!role)
                return reply.code(401).send({ success: false, error: { code: 'AUTH_CONTEXT_REQUIRED', message: 'Authenticated role required', timestamp: new Date().toISOString() } });
            await (0, roleGuard_1.requireRoleFastify)(role)(req, reply);
            if (reply.sent)
                return;
            if (!(0, roleResolver_1.hasDomain)(role, 'catalog')) {
                return reply.code(403).send({ success: false, error: { code: 'DOMAIN_FORBIDDEN', message: 'Catalog not available for this role', details: { role }, timestamp: new Date().toISOString() } });
            }
        };
        const requireCap = (capKey) => async (req, reply) => {
            const role = (req.context?.role || req.params?.role || '').toLowerCase();
            const caps = (0, roleResolver_1.getDomainCapabilities)(role, 'catalog') || {};
            const cap = caps?.[capKey];
            if (!cap)
                return reply.code(403).send({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions', details: { required: capKey }, timestamp: new Date().toISOString() } });
            return (0, requireCaps_1.requireCapsFastify)(cap)(req, reply);
        };
        const featuresFor = (req) => (0, roleResolver_1.getDomainFeatures)((req.context?.role || '').toLowerCase(), 'catalog') || {};
        // Browse catalog
        f.get('/', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { querystring: zod_1.z.object({ q: zod_1.z.string().optional(), type: zod_1.z.enum(['service', 'product']).optional(), category: zod_1.z.string().optional(), limit: zod_1.z.coerce.number().int().min(1).max(200).optional(), offset: zod_1.z.coerce.number().int().min(0).optional(), active: zod_1.z.coerce.boolean().optional(), }) } }, async (req, reply) => {
            const feats = featuresFor(req);
            if (!(feats.browse || feats.search)) {
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'Catalog browse/search disabled for this role', timestamp: new Date().toISOString() } });
            }
            const items = await svc.getCatalogItems(req.query);
            return reply.code(200).send({ success: true, data: items });
        });
        // Categories
        f.get('/categories', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (_req, reply) => {
            const cats = await svc.getCategories();
            return reply.code(200).send({ success: true, data: cats });
        });
        f.get('/categories/tree', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (_req, reply) => {
            const tree = await svc.getCategoriesTree();
            return reply.code(200).send({ success: true, data: tree });
        });
        // Contractor My Services (if enabled)
        f.get('/my-services', { preHandler: [requireRoleAndDomain, requireCap('view')] }, async (req, reply) => {
            const feats = featuresFor(req);
            if (!feats.myServices)
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
            const contractorId = req.user.userId;
            const items = await svc.getContractorServices(contractorId);
            return reply.code(200).send({ success: true, data: items });
        });
        const addSchema = zod_1.z.object({ serviceId: zod_1.z.coerce.number().int().positive() });
        f.post('/my-services', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { body: addSchema } }, async (req, reply) => {
            const feats = featuresFor(req);
            if (!feats.myServices)
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
            const contractorId = req.user.userId;
            const { serviceId } = req.body;
            await svc.addContractorService(contractorId, serviceId);
            return reply.code(201).send({ success: true });
        });
        const patchSchema = zod_1.z.object({ contractor_price: zod_1.z.coerce.number().nonnegative().optional(), is_available: zod_1.z.coerce.boolean().optional(), lead_time_hours: zod_1.z.coerce.number().int().nonnegative().optional(), notes: zod_1.z.string().max(500).optional(), });
        f.patch('/my-services/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: zod_1.z.object({ serviceId: zod_1.z.coerce.number().int().positive() }), body: patchSchema } }, async (req, reply) => {
            const feats = featuresFor(req);
            if (!feats.myServices)
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
            const contractorId = req.user.userId;
            const { serviceId } = req.params;
            await svc.updateContractorService(contractorId, Number(serviceId), req.body);
            return reply.code(200).send({ success: true });
        });
        f.delete('/my-services/:serviceId', { preHandler: [requireRoleAndDomain, requireCap('view')], schema: { params: zod_1.z.object({ serviceId: zod_1.z.coerce.number().int().positive() }) } }, async (req, reply) => {
            const feats = featuresFor(req);
            if (!feats.myServices)
                return reply.code(403).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'My Services disabled for this role', timestamp: new Date().toISOString() } });
            const contractorId = req.user.userId;
            const { serviceId } = req.params;
            await svc.removeContractorService(contractorId, Number(serviceId));
            return reply.code(204).send();
        });
        done();
    };
    return plugin;
};
exports.createCatalogFastifyPlugin = createCatalogFastifyPlugin;
//# sourceMappingURL=routes.fastify.js.map