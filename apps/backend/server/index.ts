import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { authenticate } from "./core/auth/authenticate";
import { getAdminUserByClerkId } from "./domains/adminUsers/store";
import { registerAdminUserRoutes } from "./domains/adminUsers/routes";
import type { AdminUserStatus } from "./domains/adminUsers/types";

type BootstrapResponse = {
  role: string;
  code: string;
  email?: string | null;
  status: AdminUserStatus;
};

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
      const authContext = await authenticate(request);
      if (!authContext) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const adminUser = await getAdminUserByClerkId(authContext.userId);

      if (!adminUser || adminUser.status !== "active") {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const response: BootstrapResponse = {
        role: adminUser.role,
        code: adminUser.cksCode,
        email: adminUser.email ?? authContext.email ?? null,
        status: adminUser.status,
      };

      return reply.send(response);
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
