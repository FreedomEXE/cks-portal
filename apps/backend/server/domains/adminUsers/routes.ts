import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from 'zod';
import {
  createAdminUser,
  getAdminUserById,
  getAdminUsers,
  removeAdminUser,
  setAdminUserStatus,
  updateAdminUser,
} from "./store";
import { requireActiveAdmin } from "./guards";
import { clerkClient } from "../../core/clerk/client";
import { getClerkUserIdByRoleAndCode, getIdentityContactByRoleAndCode, linkClerkUserToAccount } from "../identity";
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

function handleValidationError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(', ');
    reply.code(400).send({ error: message });
    return true;
  }
  return false;
}

async function getOrCreateClerkUserForEntity(entityType: string, entityId: string) {
  const contact = await getIdentityContactByRoleAndCode(entityType as any, entityId);
  const emailAddress = contact?.email ?? null;
  let clerkUserId = contact?.clerkUserId ?? null;
  let clerkUser: any = null;

  if (clerkUserId) {
    try {
      clerkUser = await clerkClient.users.getUser(clerkUserId);
    } catch {
      clerkUserId = null;
    }
  }

  if (!clerkUser) {
    if (!emailAddress) {
      throw new Error("User email not found");
    }

    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [emailAddress],
        externalId: entityId,
        publicMetadata: { role: entityType, cksCode: entityId },
        username: entityId,
        skipPasswordRequirement: true,
      });
    } catch (error: any) {
      const errorCode = error?.errors?.[0]?.code || error?.code;
      if (errorCode === "form_identifier_exists" || errorCode === "email_address_exists") {
        const existing = await clerkClient.users.getUserList({ emailAddress: [emailAddress] });
        clerkUser = existing?.[0] ?? null;
      } else {
        throw error;
      }
    }
  }

  if (!clerkUser?.id) {
    throw new Error("Failed to provision Clerk user");
  }

  if (clerkUser?.username !== entityId) {
    try {
      clerkUser = await clerkClient.users.updateUser(clerkUser.id, {
        username: entityId,
        publicMetadata: { role: entityType, cksCode: entityId },
      });
    } catch (error: any) {
      const errorCode = error?.errors?.[0]?.code || error?.code;
      if (errorCode === "form_identifier_exists" || errorCode === "username_exists") {
        throw new Error("CKS ID already exists in Clerk");
      }
      throw error;
    }
  }

  if (!contact?.clerkUserId || contact.clerkUserId !== clerkUser.id) {
    await linkClerkUserToAccount(entityType as any, entityId, clerkUser.id);
  }

  return clerkUser;
}

export async function registerAdminUserRoutes(server: FastifyInstance) {
  server.get("/api/admin/users", async (request, reply) => {
    const auth = await requireActiveAdmin(request, reply);
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
    const auth = await requireActiveAdmin(request, reply);
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
    const auth = await requireActiveAdmin(request, reply);
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
    const auth = await requireActiveAdmin(request, reply);
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
    const auth = await requireActiveAdmin(request, reply);
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
    const auth = await requireActiveAdmin(request, reply);
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
    const auth = await requireActiveAdmin(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const removed = await removeAdminUser(id);
    if (!removed) {
      reply.code(404).send({ error: "Admin user not found" });
      return;
    }

    reply.send({ data: removed });
  });

  server.post("/api/admin/impersonations", async (request, reply) => {
    const auth = await requireActiveAdmin(request, reply);
    if (!auth) return;

    const body = request.body as { entityType?: string; entityId?: string };
    const entityType = String(body?.entityType ?? "").trim().toLowerCase();
    const entityId = String(body?.entityId ?? "").trim().toUpperCase();
    request.log.info(
      { entityType, entityId },
      "[impersonations] request"
    );

    const allowedEntityTypes = new Set([
      "manager",
      "contractor",
      "customer",
      "center",
      "crew",
      "warehouse",
    ]);

    if (!allowedEntityTypes.has(entityType)) {
      request.log.warn({ entityType }, "[impersonations] invalid entity type");
      reply.code(400).send({ error: "Invalid entity type" });
      return;
    }

    if (!entityId) {
      request.log.warn({ entityType }, "[impersonations] missing entity id");
      reply.code(400).send({ error: "Invalid entity id" });
      return;
    }

    let clerkUserId = await getClerkUserIdByRoleAndCode(entityType as any, entityId);
    if (!clerkUserId) {
      try {
        request.log.info({ entityType, entityId }, "[impersonations] provisioning Clerk user");
        const clerkUser = await getOrCreateClerkUserForEntity(entityType, entityId);
        clerkUserId = clerkUser?.id ?? null;
      } catch (error) {
        request.log.warn(
          { entityType, entityId, error: error instanceof Error ? error.message : error },
          "[impersonations] provisioning failed"
        );
        reply.code(404).send({ error: error instanceof Error ? error.message : "User is not linked to Clerk" });
        return;
      }
    }
    request.log.info({ entityType, entityId, clerkUserId }, "[impersonations] clerk user resolved");

    const sessionsApi = (clerkClient as any)?.sessions;
    if (sessionsApi?.createSession) {
      try {
        const session = await sessionsApi.createSession({ userId: clerkUserId });
        const sessionId = session?.id;
        if (sessionId) {
          request.log.info({ entityType, entityId, sessionId }, "[impersonations] session created");
          reply.send({ data: { sessionId } });
          return;
        }
      } catch (error: any) {
        const clerkCode = error?.errors?.[0]?.code;
        if (clerkCode === "request_invalid_for_environment") {
          request.log.info(
            { entityType, entityId },
            "[impersonations] session create not allowed in production, falling back to sign-in token"
          );
        } else {
          throw error;
        }
      }
    }

    const signInTokensApi = (clerkClient as any)?.signInTokens;
    if (!signInTokensApi?.createSignInToken && !signInTokensApi?.create) {
      reply.code(501).send({ error: "Impersonation is not available" });
      return;
    }

    const tokenResponse = signInTokensApi?.createSignInToken
      ? await signInTokensApi.createSignInToken({ userId: clerkUserId })
      : await signInTokensApi.create({ userId: clerkUserId });
    const token = tokenResponse?.token || tokenResponse?.id || tokenResponse?.signInToken;

    if (!token) {
      reply.code(500).send({ error: "Failed to create impersonation token" });
      return;
    }

    reply.send({ data: { token } });
  });

  server.post("/api/admin/invitations", async (request, reply) => {
    const auth = await requireActiveAdmin(request, reply);
    if (!auth) return;

    const body = request.body as { entityType?: string; entityId?: string };
    const entityType = String(body?.entityType ?? "").trim().toLowerCase();
    const entityId = String(body?.entityId ?? "").trim().toUpperCase();

    const allowedEntityTypes = new Set([
      "manager",
      "contractor",
      "customer",
      "center",
      "crew",
      "warehouse",
    ]);

    if (!allowedEntityTypes.has(entityType)) {
      reply.code(400).send({ error: "Invalid entity type" });
      return;
    }

    if (!entityId) {
      reply.code(400).send({ error: "Invalid entity id" });
      return;
    }

    const contact = await getIdentityContactByRoleAndCode(entityType as any, entityId);
    if (!contact?.email) {
      reply.code(404).send({ error: "User email not found" });
      return;
    }

    let clerkUser: any;
    try {
      clerkUser = await getOrCreateClerkUserForEntity(entityType, entityId);
    } catch (error) {
      reply.code(404).send({ error: error instanceof Error ? error.message : "Failed to provision Clerk user" });
      return;
    }

    await clerkClient.invitations.createInvitation({
      emailAddress: contact.email,
      publicMetadata: {
        cksCode: entityId,
        role: entityType,
      },
      notify: true,
      ignoreExisting: true,
    });

    reply.send({
      data: {
        userId: clerkUser.id,
        email: contact.email,
      },
    });
  });

  server.post("/api/admin/test-ecosystem/provision", async (request, reply) => {
    const auth = await requireActiveAdmin(request, reply);
    if (!auth) return;

    const testEntities = [
      { entityType: "manager", entityId: "MGR-001-TEST" },
      { entityType: "contractor", entityId: "CON-001-TEST" },
      { entityType: "customer", entityId: "CUS-001-TEST" },
      { entityType: "center", entityId: "CEN-001-TEST" },
      { entityType: "crew", entityId: "CRW-001-TEST" },
      { entityType: "warehouse", entityId: "WHS-001-TEST" },
    ];

    const results = [];
    for (const entity of testEntities) {
      try {
        const clerkUser = await getOrCreateClerkUserForEntity(entity.entityType, entity.entityId);
        results.push({
          ...entity,
          status: "linked",
          clerkUserId: clerkUser?.id ?? null,
        });
      } catch (error) {
        results.push({
          ...entity,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    reply.send({ data: { results } });
  });
}
