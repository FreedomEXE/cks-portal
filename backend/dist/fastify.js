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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const roleContext_1 = require("./core/fastify/roleContext");
const auth_1 = require("./core/fastify/auth");
const routes_fastify_1 = require("./domains/dashboard/routes.fastify");
const routes_fastify_2 = require("./domains/catalog/routes.fastify");
const routes_fastify_3 = require("./domains/profile/routes.fastify");
const routes_fastify_4 = require("./domains/directory/routes.fastify");
const routes_fastify_5 = require("./domains/services/routes.fastify");
const routes_fastify_6 = require("./domains/orders/routes.fastify");
const routes_fastify_7 = require("./domains/assignments/routes.fastify");
const routes_fastify_8 = require("./domains/archive/routes.fastify");
const routes_fastify_9 = require("./domains/inventory/routes.fastify");
const routes_fastify_10 = require("./domains/deliveries/routes.fastify");
const routes_fastify_11 = require("./domains/reports/routes.fastify");
const routes_fastify_12 = require("./domains/support/routes.fastify");
// Role configs are resolved at request-time by domain plugins
function buildServer() {
    const app = (0, fastify_1.default)({
        logger: process.env.NODE_ENV === 'production'
            ? { level: 'info' }
            : { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } },
    }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    // Plugins
    app.register(cors_1.default, { origin: true, credentials: true });
    app.register(helmet_1.default, {});
    app.register(rate_limit_1.default, { max: 1000, timeWindow: '15 minutes' });
    // Docs
    app.register(swagger_1.default, {
        openapi: {
            info: { title: 'CKS Portal API (Fastify)', version: '2.0.0' },
        },
        transform: fastify_type_provider_zod_1.jsonSchemaTransform,
    });
    app.register(swagger_ui_1.default, { routePrefix: '/api/docs' });
    // Global Health (no auth required)
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || 'v2',
        environment: process.env.NODE_ENV || 'development'
    }));
    app.get('/api/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || 'v2',
        environment: process.env.NODE_ENV || 'development',
        availableRoles: ['admin', 'manager', 'warehouse', 'contractor', 'crew', 'customer', 'center']
    }));
    // Global catalog (auth required, role-agnostic)
    app.register(async function globalCatalog(instance) {
        // Dev mock auth (optional)
        try {
            (await Promise.resolve().then(() => __importStar(require('./core/fastify/mockAuth')))).mockAuthPlugin(instance, {}, () => { });
        }
        catch { }
        instance.addHook('preHandler', auth_1.authenticateFastify);
        instance.register((0, routes_fastify_2.createCatalogFastifyPlugin)(), { prefix: '/catalog' });
    }, { prefix: '/api' });
    // Dynamic role mount (shim) — forwards /api/:role/* to internal /api/_{role}/*
    app.register(async function roleMount(instance) {
        instance.addHook('onRequest', roleContext_1.roleContextFastify);
        // Dev mock auth (optional) — not required for redirect, but harmless
        try {
            (await Promise.resolve().then(() => __importStar(require('./core/fastify/mockAuth')))).mockAuthPlugin(instance, {}, () => { });
        }
        catch { }
        instance.addHook('preHandler', auth_1.authenticateFastify);
        // Register role-agnostic domain plugins; per-role access enforced inside
        instance.register((0, routes_fastify_1.createDashboardFastifyPlugin)(), { prefix: '/dashboard' });
        instance.register((0, routes_fastify_5.createServicesFastifyPlugin)(), { prefix: '/services' });
        instance.register((0, routes_fastify_6.createOrdersFastifyPlugin)(), { prefix: '/orders' });
        instance.register((0, routes_fastify_7.createAssignmentsFastifyPlugin)(), { prefix: '/assignments' });
        instance.register((0, routes_fastify_8.createArchiveFastifyPlugin)(), { prefix: '/archive' });
        instance.register((0, routes_fastify_12.createSupportFastifyPlugin)(), { prefix: '/support' });
        instance.register((0, routes_fastify_4.createDirectoryFastifyPlugin)(), { prefix: '/directory' });
        instance.register((0, routes_fastify_3.createProfileFastifyPlugin)(), { prefix: '/profile' });
        instance.register((0, routes_fastify_11.createReportsFastifyPlugin)(), { prefix: '/reports' });
        instance.register((0, routes_fastify_9.createInventoryFastifyPlugin)(), { prefix: '/inventory' });
        instance.register((0, routes_fastify_10.createDeliveriesFastifyPlugin)(), { prefix: '/deliveries' });
    }, { prefix: '/api/:role' });
    // Not found
    app.setNotFoundHandler((req, reply) => reply.code(404).send({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`,
            timestamp: new Date().toISOString()
        }
    }));
    // Error handler
    app.setErrorHandler((err, _req, reply) => {
        const isZod = err.name === 'ZodError';
        if (isZod) {
            return reply.code(422).send({
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: 'Invalid input',
                    details: err.issues || err.errors,
                    timestamp: new Date().toISOString()
                }
            });
        }
        reqLogSafe(err, app.log);
        reply.code(500).send({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error',
                timestamp: new Date().toISOString()
            }
        });
    });
    return app;
}
function reqLogSafe(err, log) {
    try {
        log.error({ err });
    }
    catch { /* ignore */ }
}
// Start if invoked directly
if (require.main === module) {
    const app = buildServer();
    const port = Number(process.env.PORT || 5000);
    const host = process.env.HOST || '0.0.0.0';
    app.listen({ port, host }).then(() => {
        app.log.info({ port, host }, 'CKS API (Fastify) listening');
    }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start Fastify server', e);
        process.exit(1);
    });
}
//# sourceMappingURL=fastify.js.map