import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(__dirname, "../.env") });
console.log('DATABASE_URL loaded?', !!process.env.DATABASE_URL ? 'yes' : 'no');

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import z from "zod";
import { authenticate } from "./core/auth/authenticate";
import { registerAdminUserRoutes } from "./domains/adminUsers/routes";
import { getAdminUserByClerkId } from "./domains/adminUsers/store";
import type { AdminUserStatus } from "./domains/adminUsers/types";
import { registerAssignmentRoutes } from "./domains/assignments";
import { registerDirectoryRoutes } from "./domains/directory/routes.fastify";
import { registerProvisioningRoutes } from "./domains/provisioning";
import { registerArchiveRoutes } from "./domains/archive/routes.fastify";
import { registerProfileRoutes } from "./domains/profile/routes.fastify";
import { registerDashboardRoutes } from "./domains/dashboard/routes.fastify";
import { registerOrdersRoutes } from "./domains/orders/routes.fastify";
import { reportsRoutes } from "./domains/reports/routes.fastify";
import { registerInventoryRoutes } from "./domains/inventory/routes.fastify";

type BootstrapResponse = {
  role: string;
  code: string | null;
  email: string | null;
  status: AdminUserStatus;
  fullName: string | null;
  firstName: string | null;
  ownerFirstName: string | null;
};

const bootstrapSchema = z.object({
  Authorization: z.string().startsWith('Bearer '),
});

const bootstrapResponseSchema = z.object({
  role: z.string(),
  code: z.string().nullable(),
  email: z.string().nullable(),
  status: z.enum(['active']),
  fullName: z.string().nullable(),
  firstName: z.string().nullable(),
  ownerFirstName: z.string().nullable(),
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
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
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
    credentials: true,
  });

  await server.register(cookie);

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
          '',
      });

      if (!headerSchema.success) {
        return reply.code(400).send({ error: 'Invalid headers' });
      }

      const auth = await authenticate(request);
      // Log authentication status without exposing sensitive data
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[bootstrap] Auth context:',
          auth.ok ? 'valid' : `invalid (${auth.reason || 'unknown'})`
        );
      }

      const authContext = auth.ok ? auth : null;
      if (!authContext) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
        const adminUser = await getAdminUserByClerkId(authContext.userId);
      if (!adminUser) {
        return reply.code(404).send({ error: 'Not provisioned' });
      }
      if (adminUser.status !== 'active') {
        return reply.code(403).send({ error: 'Inactive' });
      }

      const role = adminUser.role;
      console.log('[bootstrap] Sending role:', role);

      const resolvedEmail = adminUser.email ?? authContext.email ?? null;
      const firstName = resolveFirstName({
        fullName: adminUser.fullName,
        email: resolvedEmail,
        fallback: adminUser.cksCode ?? authContext.userId,
      });

      const response: BootstrapResponse = {
        role,
        code: adminUser.cksCode ?? null,
        email: resolvedEmail,
        status: adminUser.status,
        fullName: adminUser.fullName ?? null,
        firstName,
        ownerFirstName: firstName,
      };

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
  await registerProfileRoutes(server);
  await registerDashboardRoutes(server);
  await registerOrdersRoutes(server);
  await registerInventoryRoutes(server);
  await server.register(reportsRoutes, { prefix: '/api' });

  return server;
}

async function start() {
  const server = await buildServer();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
    await server.ready();
    await server.listen({ port, host });
    server.log.info(`Backend listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

