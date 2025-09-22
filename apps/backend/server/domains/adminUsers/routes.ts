import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from 'zod';
import { authenticate } from "../../core/auth/authenticate";
import {
  createAdminUser,
  getAdminUserByClerkId,
  getAdminUserById,
  getAdminUsers,
  removeAdminUser,
  setAdminUserStatus,
  updateAdminUser,
} from "./store";
import type { AdminUserCreateInput, AdminUserUpdateInput, AdminUserQueryOptions } from "./types";

function coerceQuery(query: FastifyRequest['query']): AdminUserQueryOptions {
  const source = (query as Record<string, string | undefined>) || {};
  const filter: Record<string, string | undefined> = {
    status: source.status,
    role: source.role,
    territory: source.territory,
  };

  const options: AdminUserQueryOptions = {};
  if (filter.status || filter.role || filter.territory) {
    options.filter = {} as AdminUserQueryOptions['filter'];
    if (filter.status) options.filter!.status = filter.status as any;
    if (filter.role) options.filter!.role = filter.role as any;
    if (filter.territory) options.filter!.territory = filter.territory;
  }

  if (source.limit !== undefined) {
    const limit = Number(source.limit);
    if (!Number.isNaN(limit)) {
      options.limit = limit;
    }
  }

  if (source.offset !== undefined) {
    const offset = Number(source.offset);
    if (!Number.isNaN(offset)) {
      options.offset = offset;
    }
  }

  return options;
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authContext = await authenticate(request);
  if (!authContext) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }

  const adminUser = await getAdminUserByClerkId(authContext.userId);
  if (!adminUser) {
    reply.code(403).send({ error: "Forbidden" });
    return null;
  }

  if (adminUser.role !== "admin") {
    reply.code(403).send({ error: "Forbidden" });
    return null;
  }

  if (adminUser.status !== "active") {
    reply.code(403).send({ error: "Admin access is disabled", status: adminUser.status });
    return null;
  }

  return adminUser;
}

function handleValidationError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(', ');
    reply.code(400).send({ error: message });
    return true;
  }
  return false;
}

export async function registerAdminUserRoutes(server: FastifyInstance) {
  server.get("/api/admin/users", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    try {
      const users = await getAdminUsers(coerceQuery(request.query));
      reply.send({ data: users });
    } catch (error) {
      if (!handleValidationError(reply, error)) {
        throw error;
      }
    }
  });

  server.get("/api/admin/users/:id", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const user = await getAdminUserById(id);
    if (!user) {
      reply.code(404).send({ error: "Admin user not found" });
      return;
    }

    reply.send({ data: user });
  });

  server.post("/api/admin/users", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const body = request.body as AdminUserCreateInput;

    try {
      const record = await createAdminUser(body);
      reply.code(201).send({ data: record });
    } catch (error) {
      if (handleValidationError(reply, error)) {
        return;
      }
      if ((error as any)?.statusCode === 409) {
        reply.code(409).send({ error: (error as Error).message });
        return;
      }
      throw error;
    }
  });

  server.patch("/api/admin/users/:id", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const body = request.body as AdminUserUpdateInput;

    let updated;
    try {
      updated = await updateAdminUser(id, body);
    } catch (error) {
      if (handleValidationError(reply, error)) {
        return;
      }
      if ((error as any)?.statusCode === 409) {
        reply.code(409).send({ error: (error as Error).message });
        return;
      }
      throw error;
    }

    if (!updated) {
      reply.code(404).send({ error: "Admin user not found" });
      return;
    }

    reply.send({ data: updated });
  });

  server.post("/api/admin/users/:id/suspend", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const updated = await setAdminUserStatus(id, 'suspended');
    if (!updated) {
      reply.code(404).send({ error: "Admin user not found" });
      return;
    }

    reply.send({ data: updated });
  });

  server.post("/api/admin/users/:id/activate", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const updated = await setAdminUserStatus(id, 'active');
    if (!updated) {
      reply.code(404).send({ error: "Admin user not found" });
      return;
    }

    reply.send({ data: updated });
  });

  server.delete("/api/admin/users/:id", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const removed = await removeAdminUser(id);
    if (!removed) {
      reply.code(404).send({ error: "Admin user not found" });
      return;
    }

    reply.send({ data: removed });
  });
}
