import type { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "./authenticate";
import { getAdminUserByClerkId } from "../../domains/adminUsers/store";
import {
  normalizeIdentity,
  getHubAccountByClerkId,
  type HubAccountRecord,
  type HubAccountRole,
} from "../../domains/identity";
import type { AdminUserRecord } from "../../domains/adminUsers/types";

export type RequiredRole = string | readonly string[];

export interface RoleGuardOptions {
  role?: RequiredRole;
  cksCode?: string | readonly string[];
  allowInactive?: boolean;
}

const HUB_ROLES = ["manager", "contractor", "customer", "center", "crew", "warehouse"] as const;
const DEV_ROLE_SET = new Set<string>(["admin", ...HUB_ROLES]);

type GuardAccount = HubAccountRecord & {
  isAdmin: boolean;
};

export type RequireActiveRoleResult = GuardAccount;

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

function parseDevRole(value: string | null | undefined): HubAccountRole | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return DEV_ROLE_SET.has(normalized) ? (normalized as HubAccountRole) : null;
}

function ensureAccountAllowed(account: GuardAccount, options: RoleGuardOptions, reply: FastifyReply): boolean {
  if (!options.allowInactive) {
    const status = (account.status ?? "").trim().toLowerCase();
    if (status && status !== "active") {
      if ((account.role ?? "").trim().toLowerCase() === "admin") {
        reply.code(403).send({ error: "Admin access is disabled", status: account.status });
      } else {
        reply.code(403).send({ error: "Account access is disabled", status: account.status });
      }
      return false;
    }
  }

  if (!matchesRole(account.role, options.role)) {
    if (!account.isAdmin) {
      reply.code(403).send({ error: "Forbidden", reason: "role_mismatch" });
      return false;
    }
  }

  if (!matchesCksCode(account.cksCode, options.cksCode)) {
    reply.code(403).send({ error: "Forbidden", reason: "code_mismatch" });
    return false;
  }

  return true;
}

function buildAdminAccount(adminUser: AdminUserRecord, fallbackEmail: string | null): GuardAccount {
  const role = (adminUser.role ?? "admin").trim().toLowerCase();
  const cksCode = normalizeIdentity(adminUser.cksCode) ?? adminUser.cksCode ?? "";
  return {
    role,
    cksCode,
    status: adminUser.status ?? null,
    fullName: adminUser.fullName ?? null,
    email: adminUser.email ?? fallbackEmail,
    isAdmin: true,
  };
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
}

export async function requireActiveRole(
  request: FastifyRequest,
  reply: FastifyReply,
  options: RoleGuardOptions = {},
): Promise<RequireActiveRoleResult | null> {
  if (process.env.CKS_ENABLE_DEV_AUTH === "true") {
    const devRoleHeader = asString(request.headers["x-cks-dev-role"]);
    const devCodeHeader = asString(request.headers["x-cks-dev-code"]);

    if (devRoleHeader) {
      const devRole = parseDevRole(devRoleHeader);
      if (!devRole) {
        reply.code(400).send({ error: "Invalid dev role override" });
        return null;
      }

      const normalizedCode = normalizeIdentity(devCodeHeader ?? null);
      if (devRole !== "admin" && !normalizedCode) {
        reply.code(400).send({ error: "Dev override requires a valid CKS code" });
        return null;
      }

      const devAccount: GuardAccount = {
        role: devRole,
        cksCode: normalizedCode ?? "",
        status: "active",
        fullName: null,
        email: null,
        isAdmin: devRole === "admin",
      };

      if (!ensureAccountAllowed(devAccount, options, reply)) {
        return null;
      }

      return devAccount;
    }
  }

  const auth = await authenticate(request);
  if (!auth.ok) {
    reply.code(401).send({ error: "Unauthorized", reason: auth.reason });
    return null;
  }

  const adminUser = await getAdminUserByClerkId(auth.userId);
  const isAdmin = adminUser?.role?.trim().toLowerCase() === "admin";

  if (adminUser && isAdmin) {
    const baseAccount = buildAdminAccount(adminUser, auth.email);

    if (!ensureAccountAllowed(baseAccount, options, reply)) {
      return null;
    }

    return baseAccount;
  }

  const account = await getHubAccountByClerkId(auth.userId);
  if (!account) {
    reply.code(403).send({ error: "Forbidden", reason: "not_provisioned" });
    return null;
  }

  const guardAccount: GuardAccount = {
    ...account,
    isAdmin: false,
  };

  if (!ensureAccountAllowed(guardAccount, options, reply)) {
    return null;
  }

  return guardAccount;
}
