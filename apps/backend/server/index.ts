import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(__dirname, "../.env") });
console.log('DATABASE_URL loaded?', !!process.env.DATABASE_URL ? 'yes' : 'no');

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import z from "zod";
import { authenticate } from "./core/auth/authenticate";
import { registerAdminUserRoutes } from "./domains/adminUsers/routes";
import { getAdminUserByClerkId } from "./domains/adminUsers/store";
import type { AdminUserStatus } from "./domains/adminUsers/types";
import { registerAssignmentRoutes } from "./domains/assignments";
import { registerDirectoryRoutes } from "./domains/directory/routes.fastify";
import { registerProvisioningRoutes } from "./domains/provisioning";

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

  await server.register(cors, {
    origin: (_origin, cb) => {
      cb(null, true);
    },
    credentials: true,
  });

  await server.register(cookie);

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
      console.log(
        '[bootstrap] Auth context:',
        auth.ok
          ? `valid (userId: ${auth.userId.slice(-4)})`
          : `invalid (${auth.reason || 'unknown'})`,
      );

      const authContext = auth.ok ? auth : null;
      if (!authContext) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Check for impersonation header
      const impersonationCode = request.headers['x-impersonate-code'] as string | undefined;
      console.log('[bootstrap] Impersonation code:', impersonationCode);

      if (impersonationCode) {
        // User is impersonating, look up the target user
        const { findUserByCode } = await import('./domains/identity/impersonation.routes');
        const targetUser = await (findUserByCode as any)(impersonationCode);

        if (targetUser) {
          console.log('[bootstrap] Impersonating user:', targetUser);

          const response: BootstrapResponse = {
            role: targetUser.role,
            code: targetUser.code,
            email: null,  // Don't expose impersonated user's email
            status: 'active',
            fullName: targetUser.displayName,
            firstName: targetUser.firstName,
            ownerFirstName: targetUser.firstName,
          };

          return reply.send(bootstrapResponseSchema.parse(response));
        }
        console.log('[bootstrap] Failed to find impersonated user:', impersonationCode);
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
  const { registerImpersonationRoutes } = await import('./domains/identity/impersonation.routes');
  await registerImpersonationRoutes(server);

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
