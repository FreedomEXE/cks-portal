import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../core/auth/clerk";
import {
  createAdminUser,
  findAdminUserByClerkIdentifier,
  getAdminUserById,
  getAdminUsers,
  removeAdminUser,
  updateAdminUser,
} from "./store";
import type { AdminUserCreateInput, AdminUserUpdateInput } from "./types";

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authContext = await authenticate(request, reply);
  if (!authContext) {
    return null;
  }

  if (authContext.role !== "admin") {
    reply.code(403).send({ error: "Forbidden" });
    return null;
  }

  if (authContext.status !== "active") {
    reply.code(403).send({ error: "Admin access is disabled", status: authContext.status });
    return null;
  }

  return authContext;
}

function normalizeInput(input: AdminUserCreateInput | AdminUserUpdateInput) {
  const copy: any = { ...input };
  if (copy.email) copy.email = copy.email.trim();
  if (copy.username) copy.username = copy.username.trim();
  if (copy.cksCode) copy.cksCode = copy.cksCode.trim().toLowerCase();
  return copy;
}

export async function registerAdminUserRoutes(server: FastifyInstance) {
  server.get("/api/admin/users", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const users = await getAdminUsers();
    reply.send({ data: users });
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

    const body = normalizeInput(request.body as AdminUserCreateInput);

    if (!body?.clerkUserId || !body?.cksCode) {
      reply.code(400).send({ error: "clerkUserId and cksCode are required" });
      return;
    }

    const duplicate = await findAdminUserByClerkIdentifier({
      clerkUserId: body.clerkUserId,
      email: body.email,
      username: body.username,
    });

    if (duplicate) {
      reply.code(409).send({ error: "Admin user already exists" });
      return;
    }

    const record = await createAdminUser(body);
    reply.code(201).send({ data: record });
  });

  server.patch("/api/admin/users/:id", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const body = normalizeInput(request.body as AdminUserUpdateInput);

    const updated = await updateAdminUser(id, body);
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
    const updated = await updateAdminUser(id, { status: "suspended" });
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
    const updated = await updateAdminUser(id, { status: "active" });
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
