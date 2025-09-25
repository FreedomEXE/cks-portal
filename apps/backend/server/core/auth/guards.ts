import type { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "./authenticate";
import { getAdminUserByClerkId } from "../../domains/adminUsers/store";
import { normalizeIdentity } from "../../domains/identity";

export type RequiredRole = string | readonly string[];

export interface RoleGuardOptions {
  role?: RequiredRole;
  cksCode?: string | readonly string[];
  allowInactive?: boolean;
}

function matchesRole(actual: string | null | undefined, expected: RequiredRole | undefined): boolean {
  if (!expected) {
    return true;
  }
  if (!actual) {
    return false;
  }
  const normalized = actual.trim().toLowerCase();
  if (typeof expected === "string") {
    return normalized === expected.trim().toLowerCase();
  }
  return expected.some((candidate) => normalized === candidate.trim().toLowerCase());
}

function matchesCksCode(actual: string | null | undefined, expected: string | readonly string[] | undefined) {
  if (!expected) {
    return true;
  }
  const normalizedActual = normalizeIdentity(actual ?? null);
  if (!normalizedActual) {
    return false;
  }
  if (typeof expected === "string") {
    return normalizedActual === normalizeIdentity(expected);
  }
  return expected.some((candidate) => normalizedActual === normalizeIdentity(candidate));
}

export async function requireActiveRole(
  request: FastifyRequest,
  reply: FastifyReply,
  options: RoleGuardOptions = {},
) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    reply.code(401).send({ error: "Unauthorized", reason: auth.reason });
    return null;
  }

  const adminUser = await getAdminUserByClerkId(auth.userId);
  if (!adminUser) {
    reply.code(403).send({ error: "Forbidden", reason: "not_provisioned" });
    return null;
  }

  if (!options.allowInactive && adminUser.status !== "active") {
    reply.code(403).send({ error: "Admin access is disabled", status: adminUser.status });
    return null;
  }

  // Check for impersonation header
  const impersonationCode = request.headers['x-impersonate-code'] as string | undefined;
  if (impersonationCode && adminUser.role === 'admin') {
    // Admin is impersonating - load the target user
    const { findUserByCode } = await import('../../domains/identity/impersonation.routes');
    const targetUser = await (findUserByCode as any)(impersonationCode);

    if (targetUser) {
      // Return a synthetic user object with the impersonated role and code
      return {
        ...adminUser,
        role: targetUser.role,
        cksCode: targetUser.code,
        fullName: targetUser.displayName,
        // Keep the admin's actual ID for audit purposes
        impersonatedBy: adminUser.id,
      };
    }
  }

  if (!matchesRole(adminUser.role, options.role)) {
    reply.code(403).send({ error: "Forbidden", reason: "role_mismatch" });
    return null;
  }

  if (!matchesCksCode(adminUser.cksCode, options.cksCode)) {
    reply.code(403).send({ error: "Forbidden", reason: "code_mismatch" });
    return null;
  }

  return adminUser;
}
