import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, "../.env") });
console.log('DATABASE_URL loaded?', !!process.env.DATABASE_URL ? 'yes' : 'no');

import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import z from "zod";
import { authenticate } from "./core/auth/authenticate";
import { getAdminUserByClerkId } from "./domains/adminUsers/store";
import { registerAdminUserRoutes } from "./domains/adminUsers/routes";
import type { AdminUserStatus } from "./domains/adminUsers/types";

type BootstrapResponse = {
  role: string;
  code: string | null;
  email: string | null;
  status: AdminUserStatus;
};

const bootstrapSchema = z.object({
  Authorization: z.string().startsWith('Bearer '),
});

const bootstrapResponseSchema = z.object({
  role: z.string(),
  code: z.string().nullable(),
  email: z.string().nullable(),
  status: z.enum(['active']),
});

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

      const adminUser = await getAdminUserByClerkId(authContext.userId);
      if (!adminUser) {
        return reply.code(404).send({ error: 'Not provisioned' });
      }
      if (adminUser.status !== 'active') {
        return reply.code(403).send({ error: 'Inactive' });
      }

      const role = adminUser.role;
      console.log('[bootstrap] Sending role:', role);

      const response: BootstrapResponse = {
        role,
        code: adminUser.cksCode ?? null,
        email: adminUser.email ?? authContext.email ?? null,
        status: adminUser.status,
      };

      return reply.send(bootstrapResponseSchema.parse(response));
    } catch (error) {
      request.log.error({ err: error }, "bootstrap failure");
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  await registerAdminUserRoutes(server);

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

