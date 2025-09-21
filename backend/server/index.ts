import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { authenticate } from "./core/auth/clerk";
import { findAdminUserByClerkIdentifier } from "./domains/adminUsers/store";
import { registerAdminUserRoutes } from "./domains/adminUsers/routes";
import type { AdminUserStatus } from "./domains/adminUsers/types";

type BootstrapResponse = {
  role: string;
  code: string;
  email?: string;
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
    const authContext = await authenticate(request, reply);
    if (!authContext) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const adminUser = await findAdminUserByClerkIdentifier({
      clerkUserId: authContext.userId,
      email: authContext.email,
      username: authContext.username,
    });

    if (!adminUser) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    if (adminUser.status !== "active") {
      return reply.code(403).send({ error: "Admin access is disabled", status: adminUser.status });
    }

    if (adminUser.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const response: BootstrapResponse = {
      role: adminUser.role,
      code: adminUser.cksCode,
      email: adminUser.email ?? authContext.email,
      status: adminUser.status,
    };

    return reply.send(response);
  });

  await registerAdminUserRoutes(server);

  return server;
}

async function start() {
  const server = await buildServer();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
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
