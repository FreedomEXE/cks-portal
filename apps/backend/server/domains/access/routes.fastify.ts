import type { FastifyInstance } from "fastify";
import { requireActiveRole } from "../../core/auth/guards";
import { requireActiveAdmin } from "../adminUsers/guards";
import { createAccessCodeSchema, redeemAccessCodeSchema } from "./validators";
import { createAccessCode, redeemAccessCode } from "./service";

export async function registerAccessRoutes(server: FastifyInstance) {
  server.post("/api/admin/access-codes", async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const parsed = createAccessCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid access code payload", details: parsed.error.flatten() });
      return;
    }

    try {
      const code = await createAccessCode({
        targetRole: parsed.data.targetRole,
        tier: parsed.data.tier,
        maxRedemptions: parsed.data.maxRedemptions,
        scopeCode: parsed.data.scopeCode ?? null,
        createdByRole: admin.role ?? "admin",
        createdByCode: admin.cksCode ?? null,
        notes: parsed.data.notes ?? null,
        expiresAt: parsed.data.expiresAt ?? null,
      });

      reply.send({ data: code });
    } catch (error) {
      request.log.error({ err: error }, "[access] Failed to create access code");
      reply.code(400).send({ error: error instanceof Error ? error.message : "Failed to create access code" });
    }
  });

  server.post("/api/account/access-codes/redeem", async (request, reply) => {
    const account = await requireActiveRole(request, reply, { allowInactive: true });
    if (!account) {
      return;
    }

    const parsed = redeemAccessCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid redemption payload", details: parsed.error.flatten() });
      return;
    }

    const role = (account.role ?? "").trim().toLowerCase();
    const cksCode = account.cksCode ?? null;
    if (!role || !cksCode) {
      reply.code(400).send({ error: "No role or CKS code found for this account" });
      return;
    }

    try {
      const grant = await redeemAccessCode({
        code: parsed.data.code,
        role,
        cksCode,
        grantedByRole: role,
        grantedByCode: cksCode,
      });

      reply.send({ data: grant });
    } catch (error) {
      request.log.error({ err: error }, "[access] Failed to redeem access code");
      reply.code(400).send({ error: error instanceof Error ? error.message : "Failed to redeem access code" });
    }
  });
}
