import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// __dirname is not available in ESM/tsx runtime – reconstruct from import.meta.url
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(CURRENT_DIR, "../.env") });
console.log('DATABASE_URL loaded?', !!process.env.DATABASE_URL ? 'yes' : 'no');

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import z from "zod";
import { authenticate } from "./core/auth/authenticate";
import { registerAdminUserRoutes } from "./domains/adminUsers/routes";
import { getAdminUserByClerkId } from "./domains/adminUsers/store";
import { getHubAccountByClerkId, getHubAccountByCode } from "./domains/identity";
import { registerAssignmentRoutes } from "./domains/assignments";
import { registerDirectoryRoutes } from "./domains/directory/routes.fastify";
import { registerProvisioningRoutes } from "./domains/provisioning";
import { registerArchiveRoutes } from "./domains/archive/routes.fastify";
import { registerActivityRoutes } from "./domains/activity/routes.fastify";
import { registerProfileRoutes } from "./domains/profile/routes.fastify";
import { registerDashboardRoutes } from "./domains/dashboard/routes.fastify";
import { registerScopeRoutes } from "./domains/scope/routes.fastify";
import { registerOrdersRoutes } from "./domains/orders/routes.fastify";
import { registerServicesRoutes } from "./domains/services/routes.fastify";
import { registerCatalogRoutes } from "./domains/catalog/routes.fastify";
import { registerCalendarRoutes } from "./domains/calendar/index.js";
import { reportsRoutes } from "./domains/reports/routes.fastify";
import { registerInventoryRoutes } from "./domains/inventory/routes.fastify";
import entityRoutes from "./domains/entities/routes.fastify";
import { registerAccountRoutes } from "./domains/account/routes.fastify";
import { registerAccessRoutes } from "./domains/access";
import { resolveAccessStatus } from "./domains/access/service";
import { registerMemosRoutes } from "./domains/memos/routes.fastify";
import { registerNewsRoutes } from "./domains/news/routes.fastify";
import { registerPreferencesRoutes } from "./domains/preferences/routes.fastify";
import { registerSupportRoutes } from "./domains/support/routes.fastify";
import { initializeSequences } from "./db/init-sequences";

type BootstrapResponse = {
  role: string;
  code: string | null;
  email: string | null;
  status: string | null;
  fullName: string | null;
  firstName: string | null;
  ownerFirstName: string | null;
  accessStatus: "active" | "locked";
  accessTier: string | null;
  accessSource: "direct" | "cascade" | null;
};

const DEV_AUTH_ENABLED = String(process.env.CKS_ENABLE_DEV_AUTH ?? 'false') === 'true' && process.env.NODE_ENV !== 'production';

const bootstrapSchema = z.object({
  Authorization: z.string().startsWith('Bearer ').optional(),
  devRole: z.string().trim().optional(),
  devCode: z.string().trim().optional(),
});

const bootstrapResponseSchema = z.object({
  role: z.string(),
  code: z.string().nullable(),
  email: z.string().nullable(),
  status: z.string().nullable(),
  fullName: z.string().nullable(),
  firstName: z.string().nullable(),
  ownerFirstName: z.string().nullable(),
  accessStatus: z.enum(["active", "locked"]),
  accessTier: z.string().nullable(),
  accessSource: z.enum(["direct", "cascade"]).nullable(),
});

function extractFirstName(fullName?: string | null): string | null {
  if (!fullName) {
    return null;
  }
  const trimmed = fullName.trim();
  if (!trimmed) {
    return null;
  }
  const [first] = trimmed.split(/\s+/);
  return first || null;
}

function emailPrefix(email?: string | null): string | null {
  if (!email) {
    return null;
  }
  const prefix = email.split('@')[0]?.trim();
  return prefix ? prefix : null;
}

function resolveFirstName(options: {
  fullName?: string | null;
  email?: string | null;
  fallback?: string | null;
}): string | null {
  const firstFromName = extractFirstName(options.fullName);
  if (firstFromName) {
    return firstFromName;
  }
  const prefix = emailPrefix(options.email);
  if (prefix) {
    return prefix;
  }
  if (options.fallback) {
    const trimmed = options.fallback.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

export async function buildServer() {
  const server = Fastify({ logger: true });

  // CORS configuration with proper origin validation
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175'
  ];

  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        cb(null, true);
        return;
      }

      // Check if the origin is in our whitelist
      if (ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await server.register(cookie);
  await server.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

  // Security headers with Helmet
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // May need to be false for some API integrations
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100, // Maximum 100 requests
    timeWindow: '1 minute', // Per minute
    cache: 10000, // Cache up to 10000 entries
    allowList: [], // You can add IPs to bypass rate limiting
    continueExceeding: false,
    skipOnError: false,
  });

  server.get("/api/health", async () => ({ status: "ok" }));

  server.get("/api/me/bootstrap", async (request, reply) => {
    try {
      const headerSchema = bootstrapSchema.safeParse({
        Authorization:
          (request.headers.authorization as string | undefined) ??
          (request.headers.Authorization as string | undefined) ??
          undefined,
        devRole: typeof request.headers["x-cks-dev-role"] === "string" ? request.headers["x-cks-dev-role"] : undefined,
        devCode: typeof request.headers["x-cks-dev-code"] === "string" ? request.headers["x-cks-dev-code"] : undefined,
      });

      if (!headerSchema.success) {
        return reply.code(400).send({ error: 'Invalid headers' });
      }

      const auth = await authenticate(request);
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[bootstrap] Auth context:',
          auth.ok ? 'valid' : 'invalid (' + (auth.reason || 'unknown') + ')'
        );
      }

      const authContext = auth.ok ? auth : null;

      let hubAccount = authContext ? await getHubAccountByClerkId(authContext.userId) : null;
      if (!hubAccount && DEV_AUTH_ENABLED && headerSchema.data.devRole) {
        hubAccount = await getHubAccountByCode(headerSchema.data.devCode ?? '');
        if (!hubAccount) {
          return reply.code(404).send({ error: 'Not provisioned' });
        }
      }

      if (!hubAccount) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const normalizedStatus = (hubAccount.status ?? '').trim().toLowerCase();
      const allowedStatuses = new Set(['', 'active', 'unassigned', 'pending']);
      if (normalizedStatus && !allowedStatuses.has(normalizedStatus)) {
        return reply.code(403).send({ error: 'Inactive', status: hubAccount.status });
      }

      const resolvedEmail = hubAccount.email ?? authContext?.email ?? null;
      const responseCode = hubAccount.cksCode ?? null;
      const fallback = responseCode ?? authContext?.userId ?? headerSchema.data.devCode ?? null;
      const firstName = resolveFirstName({
        fullName: hubAccount.fullName,
        email: resolvedEmail,
        fallback,
      });

      const response: BootstrapResponse = {
        role: hubAccount.role,
        code: responseCode,
        email: resolvedEmail,
        status: hubAccount.status ?? 'active',
        fullName: hubAccount.fullName ?? null,
        firstName,
        ownerFirstName: firstName,
        accessStatus: hubAccount.role === 'admin' ? "active" : "locked",
        accessTier: hubAccount.role === 'admin' ? "premium" : null,
        accessSource: hubAccount.role === 'admin' ? "direct" : null,
      };

      if (responseCode && hubAccount.role !== 'admin') {
        const access = await resolveAccessStatus(hubAccount.role, responseCode);
        response.accessStatus = access.status;
        response.accessTier = access.tier;
        response.accessSource = access.source;
      }

      return reply.send(bootstrapResponseSchema.parse(response));
    } catch (error) {
      request.log.error({ err: error }, "bootstrap failure");
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  await registerAdminUserRoutes(server);
  await registerProvisioningRoutes(server);
  await registerAssignmentRoutes(server);
  await registerDirectoryRoutes(server);
  await registerArchiveRoutes(server);
  await registerActivityRoutes(server);
  await registerProfileRoutes(server);
  await registerDashboardRoutes(server);
  await registerScopeRoutes(server);
  await registerOrdersRoutes(server);
  await registerServicesRoutes(server);
  await registerCatalogRoutes(server);
  await registerCalendarRoutes(server);
  await registerInventoryRoutes(server);
  await registerAccountRoutes(server);
  await registerAccessRoutes(server);
  await registerMemosRoutes(server);
  await registerNewsRoutes(server);
  registerPreferencesRoutes(server);
  await registerSupportRoutes(server);
  await server.register(reportsRoutes, { prefix: '/api' });
  await server.register(entityRoutes, { prefix: '/api' });

  return server;
}

async function start() {
  // Initialize database sequences and tables
  await initializeSequences();

  const server = await buildServer();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
    await server.ready();
    await server.listen({ port, host });
    server.log.info(`Backend listening on http://${host}:${port}`);
  } catch (err) {
    const anyErr = err as any;
    if (anyErr && anyErr.code === 'EADDRINUSE') {
      server.log.error({ port, host }, `Port already in use: ${host}:${port}`);
      console.error('\nPort is in use. To identify and stop the process:');
      console.error(`- Windows PowerShell:\n    netstat -ano | findstr :${port}\n    taskkill /PID <pid> /F`);
      console.error(`- macOS/Linux:\n    lsof -i :${port}\n    kill -9 <pid>\n`);
      console.error('Alternatively, set PORT to a different free port and retry.');
    } else {
      server.log.error(anyErr);
    }
    process.exit(1);
  }
}

// ESM-safe entrypoint check (equivalent of `require.main === module`)
try {
  const entryHref = process?.argv?.[1] ? pathToFileURL(process.argv[1]).href : '';
  const isMain = import.meta.url === entryHref;
  if (isMain) {
    await start();
  }
} catch {
  // Fallback: start server when check fails in constrained runtimes
  await start();
}

