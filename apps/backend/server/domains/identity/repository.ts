import { query } from "../../db/connection";
import { normalizeIdentity } from "./customIdGenerator";
import type { IdentityEntity } from "./types";

export type HubAccountRole = IdentityEntity | "admin";

export interface HubAccountRecord {
  role: HubAccountRole;
  cksCode: string;
  status: string | null;
  fullName: string | null;
  email: string | null;
}

interface RoleTableConfig {
  role: IdentityEntity;
  tableName: string;
  codeColumn: string;
  fullNameColumns: readonly string[];
  statusColumn?: string;
  emailColumn?: string;
}

interface AdminAccountRow {
  role: string | null;
  cks_code: string | null;
  status: string | null;
  full_name: string | null;
  email: string | null;
}

const ROLE_TABLES: readonly RoleTableConfig[] = [
  {
    role: "manager",
    tableName: "managers",
    codeColumn: "manager_id",
    fullNameColumns: ["name"],
    statusColumn: "status",
    emailColumn: "email",
  },
  {
    role: "contractor",
    tableName: "contractors",
    codeColumn: "contractor_id",
    fullNameColumns: ["contact_person", "name"],
    statusColumn: "status",
    emailColumn: "email",
  },
  {
    role: "customer",
    tableName: "customers",
    codeColumn: "customer_id",
    fullNameColumns: ["main_contact", "name"],
    statusColumn: "status",
    emailColumn: "email",
  },
  {
    role: "center",
    tableName: "centers",
    codeColumn: "center_id",
    fullNameColumns: ["main_contact", "name"],
    statusColumn: "status",
    emailColumn: "email",
  },
  {
    role: "crew",
    tableName: "crew",
    codeColumn: "crew_id",
    fullNameColumns: ["name"],
    statusColumn: "status",
    emailColumn: "email",
  },
  {
    role: "warehouse",
    tableName: "warehouses",
    codeColumn: "warehouse_id",
    fullNameColumns: ["main_contact", "name"],
    statusColumn: "status",
    emailColumn: "email",
  },
] as const;

const IDENTITY_ROLE_SET = new Set<IdentityEntity>(ROLE_TABLES.map((config) => config.role));

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
}

function resolveRole(value: string | null): HubAccountRole {
  const normalized = toNullableString(value)?.toLowerCase() ?? null;
  if (!normalized) {
    return "admin";
  }
  if (normalized === "admin") {
    return "admin";
  }
  return IDENTITY_ROLE_SET.has(normalized as IdentityEntity)
    ? (normalized as IdentityEntity)
    : "admin";
}

function selectColumns(config: RoleTableConfig): string {
  const columns = new Set<string>([config.codeColumn]);
  for (const column of config.fullNameColumns) {
    columns.add(column);
  }
  if (config.statusColumn) {
    columns.add(config.statusColumn);
  }
  if (config.emailColumn) {
    columns.add(config.emailColumn);
  }
  return Array.from(columns)
    .map((column) => `${column}`)
    .join(", ");
}

function mapAdminRow(row: AdminAccountRow | undefined): HubAccountRecord | null {
  if (!row) {
    return null;
  }
  const code = normalizeIdentity(toNullableString(row.cks_code)) ?? toNullableString(row.cks_code);
  if (!code) {
    return null;
  }
  return {
    role: resolveRole(row.role),
    cksCode: code,
    status: toNullableString(row.status),
    fullName: toNullableString(row.full_name),
    email: toNullableString(row.email),
  };
}

function mapRoleRow(config: RoleTableConfig, row: Record<string, unknown>): HubAccountRecord | null {
  const codeValue = toNullableString(row[config.codeColumn]);
  const normalizedCode = normalizeIdentity(codeValue) ?? codeValue;
  if (!normalizedCode) {
    return null;
  }

  let fullName: string | null = null;
  for (const column of config.fullNameColumns) {
    const candidate = toNullableString(row[column]);
    if (candidate) {
      fullName = candidate;
      break;
    }
  }

  const status = config.statusColumn ? toNullableString(row[config.statusColumn]) : null;
  const email = config.emailColumn ? toNullableString(row[config.emailColumn]) : null;

  return {
    role: config.role,
    cksCode: normalizedCode,
    status,
    fullName,
    email,
  };
}

export async function getClerkUserIdByRoleAndCode(
  role: IdentityEntity,
  cksCode: string,
): Promise<string | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const config = ROLE_TABLES.find((entry) => entry.role === role);
  if (!config) {
    return null;
  }

  const result = await query<{ clerk_user_id: string | null }>(
    `SELECT clerk_user_id FROM ${config.tableName} WHERE UPPER(${config.codeColumn}) = $1 LIMIT 1`,
    [normalizedCode],
  );

  return toNullableString(result.rows[0]?.clerk_user_id ?? null);
}

export async function getIdentityContactByRoleAndCode(
  role: IdentityEntity,
  cksCode: string,
): Promise<{ email: string | null; fullName: string | null; clerkUserId: string | null } | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const config = ROLE_TABLES.find((entry) => entry.role === role);
  if (!config) {
    return null;
  }

  const columns = [config.codeColumn, "clerk_user_id", ...(config.fullNameColumns ?? [])];
  if (config.emailColumn) {
    columns.push(config.emailColumn);
  }

  const sql = `SELECT ${Array.from(new Set(columns)).join(", ")} FROM ${config.tableName} WHERE UPPER(${config.codeColumn}) = $1 LIMIT 1`;
  const result = await query<Record<string, unknown>>(sql, [normalizedCode]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  let fullName: string | null = null;
  for (const column of config.fullNameColumns) {
    const candidate = toNullableString(row[column]);
    if (candidate) {
      fullName = candidate;
      break;
    }
  }

  return {
    email: config.emailColumn ? toNullableString(row[config.emailColumn]) : null,
    fullName,
    clerkUserId: toNullableString(row["clerk_user_id"]),
  };
}

export async function linkClerkUserToAccount(
  role: IdentityEntity,
  cksCode: string,
  clerkUserId: string,
): Promise<boolean> {
  const normalizedCode = normalizeIdentity(cksCode);
  const normalizedUserId = toNullableString(clerkUserId);
  if (!normalizedCode || !normalizedUserId) {
    return false;
  }

  const config = ROLE_TABLES.find((entry) => entry.role === role);
  if (!config) {
    return false;
  }

  const result = await query(
    `UPDATE ${config.tableName} SET clerk_user_id = $1, updated_at = NOW() WHERE UPPER(${config.codeColumn}) = $2`,
    [normalizedUserId, normalizedCode],
  );

  return result.rowCount > 0;
}

export async function unlinkClerkUserFromAccount(
  role: IdentityEntity,
  cksCode: string,
): Promise<boolean> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return false;
  }

  const config = ROLE_TABLES.find((entry) => entry.role === role);
  if (!config) {
    return false;
  }

  const result = await query(
    `UPDATE ${config.tableName}
     SET clerk_user_id = NULL, updated_at = NOW()
     WHERE UPPER(${config.codeColumn}) = $1 AND clerk_user_id IS NOT NULL`,
    [normalizedCode],
  );

  return result.rowCount > 0;
}

async function findRoleAccountByClerkId(config: RoleTableConfig, clerkUserId: string): Promise<HubAccountRecord | null> {
  const sql = `SELECT ${selectColumns(config)} FROM ${config.tableName} WHERE clerk_user_id = $1 LIMIT 1`;
  const result = await query<Record<string, unknown>>(sql, [clerkUserId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return mapRoleRow(config, row);
}

async function findRoleAccountByCode(config: RoleTableConfig, cksCode: string): Promise<HubAccountRecord | null> {
  const sql = `SELECT ${selectColumns(config)} FROM ${config.tableName} WHERE UPPER(${config.codeColumn}) = $1 LIMIT 1`;
  const result = await query<Record<string, unknown>>(sql, [cksCode]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return mapRoleRow(config, row);
}

export async function getHubAccountByClerkId(clerkUserId: string): Promise<HubAccountRecord | null> {
  const normalizedId = toNullableString(clerkUserId);
  if (!normalizedId) {
    return null;
  }

  const adminResult = await query<AdminAccountRow>(
    'SELECT role, cks_code, status, full_name, email FROM admin_users WHERE clerk_user_id = $1 LIMIT 1',
    [normalizedId],
  );
  const adminAccount = mapAdminRow(adminResult.rows[0]);
  if (adminAccount) {
    return adminAccount;
  }

  for (const config of ROLE_TABLES) {
    const account = await findRoleAccountByClerkId(config, normalizedId);
    if (account) {
      return account;
    }
  }

  return null;
}

export async function getHubAccountByCode(cksCode: string): Promise<HubAccountRecord | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const adminResult = await query<AdminAccountRow>(
    'SELECT role, cks_code, status, full_name, email FROM admin_users WHERE UPPER(cks_code) = $1 LIMIT 1',
    [normalizedCode],
  );
  const adminAccount = mapAdminRow(adminResult.rows[0]);
  if (adminAccount) {
    return adminAccount;
  }

  for (const config of ROLE_TABLES) {
    const account = await findRoleAccountByCode(config, normalizedCode);
    if (account) {
      return account;
    }
  }

  return null;
}



