import type { FastifyReply, FastifyRequest } from "fastify";
import { requireActiveRole } from "../../core/auth/guards";

export async function requireActiveAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return requireActiveRole(request, reply, { role: "admin" });
}
