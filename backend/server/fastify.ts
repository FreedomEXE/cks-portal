import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { ZodTypeProvider, jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { roleContextFastify } from './core/fastify/roleContext';
import { authenticateFastify } from './core/fastify/auth';
import { createDashboardFastifyPlugin } from './domains/dashboard/routes.fastify';
import { createCatalogFastifyPlugin } from './domains/catalog/routes.fastify';
import { createProfileFastifyPlugin } from './domains/profile/routes.fastify';
import { createDirectoryFastifyPlugin } from './domains/directory/routes.fastify';
import { createServicesFastifyPlugin } from './domains/services/routes.fastify';
import { createOrdersFastifyPlugin } from './domains/orders/routes.fastify';
import { createAssignmentsFastifyPlugin } from './domains/assignments/routes.fastify';
import { createArchiveFastifyPlugin } from './domains/archive/routes.fastify';
import { createInventoryFastifyPlugin } from './domains/inventory/routes.fastify';
import { createDeliveriesFastifyPlugin } from './domains/deliveries/routes.fastify';
import { createReportsFastifyPlugin } from './domains/reports/routes.fastify';
import { createSupportFastifyPlugin } from './domains/support/routes.fastify';
// Role configs are resolved at request-time by domain plugins

export function buildServer() {
  const app = fastify({
    logger: process.env.NODE_ENV === 'production'
      ? { level: 'info' }
      : { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Plugins
  app.register(cors, { origin: true, credentials: true });
  app.register(helmet, {});
  app.register(rateLimit, { max: 1000, timeWindow: '15 minutes' });

  // Docs
  app.register(swagger, {
    openapi: {
      info: { title: 'CKS Portal API (Fastify)', version: '2.0.0' },
    },
    transform: jsonSchemaTransform,
  });
  app.register(swaggerUi, { routePrefix: '/api/docs' });

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
    try { (await import('./core/fastify/mockAuth')).mockAuthPlugin(instance as any, {}, ()=>{}); } catch {}
    instance.addHook('preHandler', authenticateFastify);
    instance.register(createCatalogFastifyPlugin({}), { prefix: '/catalog' });
  }, { prefix: '/api' });

  // Dynamic role mount (shim) — forwards /api/:role/* to internal /api/_{role}/*
  app.register(async function roleMount(instance) {
    instance.addHook('onRequest', roleContextFastify);
    // Dev mock auth (optional) — not required for redirect, but harmless
    try { (await import('./core/fastify/mockAuth')).mockAuthPlugin(instance as any, {}, ()=>{}); } catch {}
    instance.addHook('preHandler', authenticateFastify);

    // Register role-agnostic domain plugins; per-role access enforced inside
    instance.register(createDashboardFastifyPlugin({}), { prefix: '/dashboard' });
    instance.register(createServicesFastifyPlugin({}), { prefix: '/services' });
    instance.register(createOrdersFastifyPlugin({}), { prefix: '/orders' });
    instance.register(createAssignmentsFastifyPlugin({}), { prefix: '/assignments' });
    instance.register(createArchiveFastifyPlugin({}), { prefix: '/archive' });
    instance.register(createSupportFastifyPlugin({}), { prefix: '/support' });
    instance.register(createDirectoryFastifyPlugin({}), { prefix: '/directory' });
    instance.register(createProfileFastifyPlugin({}), { prefix: '/profile' });
    instance.register(createReportsFastifyPlugin({}), { prefix: '/reports' });
    instance.register(createInventoryFastifyPlugin({}), { prefix: '/inventory' });
    instance.register(createDeliveriesFastifyPlugin({}), { prefix: '/deliveries' });
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
    const isZod = (err as any).name === 'ZodError';
    if (isZod) {
      return reply.code(422).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid input',
          details: (err as any).issues || (err as any).errors,
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

function reqLogSafe(err: any, log: any) {
  try { log.error({ err }); } catch { /* ignore */ }
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
