import type { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../core/auth/authenticate";
import { getAdminUserByClerkId } from "./store";

export async function requireActiveAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    reply.code(401).send({ error: "Unauthorized", reason: auth.reason });
    return null;
  }

  const adminUser = await getAdminUserByClerkId(auth.userId);
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