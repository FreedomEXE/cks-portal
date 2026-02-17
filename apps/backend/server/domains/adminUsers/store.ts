import type { PoolClient } from 'pg';
import { getConnection, query } from '../../db/connection';
import {
  createAdminUserSchema,
  queryOptionsSchema,
  updateAdminUserSchema,
} from './validators';
import type {
  AdminUserCreateInput,
  AdminUserQueryOptions,
  AdminUserRecord,
  AdminUserStatus,
  AdminUserUpdateInput,
} from './types';

const TABLE_NAME = 'admin_users';
const SELECT_COLUMNS = [
  'clerk_user_id',
  'cks_code',
  'role',
  'status',
  'full_name',
  'email',
  'territory',
  'phone',
  'address',
  'reports_to',
  'created_at',
  'updated_at',
  'archived_at',
].join(', ');

interface PgError extends Error {
  code?: string;
}

function isPgError(error: unknown): error is PgError {
  return Boolean(error && typeof error === 'object' && 'code' in (error as Record<string, unknown>));
}

function asIso(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNullable(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapRow(row: Record<string, any> | undefined): AdminUserRecord | null {
  if (!row) {
    return null;
  }

  return {
    id: row.clerk_user_id,
    clerkUserId: row.clerk_user_id,
    cksCode: row.cks_code,
    role: row.role,
    status: row.status,
    fullName: row.full_name ?? null,
    email: row.email ?? null,
    territory: row.territory ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    reportsTo: row.reports_to ?? null,
    createdAt: asIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: asIso(row.updated_at) ?? new Date().toISOString(),
    archivedAt: asIso(row.archived_at),
  };
}

async function withTransaction<T>(handler: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = await getConnection();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function handleUniqueViolation(error: unknown): never {
  if (isPgError(error) && error.code === '23505') {
    const conflict = new Error('Admin user already exists');
    (conflict as any).statusCode = 409;
    throw conflict;
  }
  throw error;
}

export async function getAdminUsers(options: AdminUserQueryOptions = {}): Promise<AdminUserRecord[]> {
  const parsed = queryOptionsSchema.parse(options);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (parsed.filter?.status) {
    params.push(parsed.filter.status);
    conditions.push(`status = $${params.length}`);
  }

  if (parsed.filter?.territory) {
    params.push(parsed.filter.territory.trim());
    conditions.push(`territory = $${params.length}`);
  }

  if (parsed.filter?.role) {
    params.push(parsed.filter.role);
    conditions.push(`role = $${params.length}`);
  }

  let sql = `SELECT ${SELECT_COLUMNS} FROM ${TABLE_NAME}`;
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY created_at DESC';

  if (parsed.limit) {
    params.push(parsed.limit);
    sql += ` LIMIT $${params.length}`;
  }

  if (parsed.offset) {
    params.push(parsed.offset);
    sql += ` OFFSET $${params.length}`;
  }

  const result = await query(sql, params);
  return result.rows
    .map((row) => mapRow(row))
    .filter((record): record is AdminUserRecord => Boolean(record));
}

export async function getAdminUserByClerkId(clerkUserId: string): Promise<AdminUserRecord | null> {
  if (!clerkUserId) {
    return null;
  }
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM ${TABLE_NAME} WHERE clerk_user_id = $1 LIMIT 1`,
    [clerkUserId],
  );
  return mapRow(result.rows[0]);
}

export const getAdminUserById = getAdminUserByClerkId;

export async function getAdminUserByCksCode(cksCode: string): Promise<AdminUserRecord | null> {
  if (!cksCode) {
    return null;
  }

  const normalizedCode = cksCode.trim();
  if (!normalizedCode) {
    return null;
  }

  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM ${TABLE_NAME} WHERE UPPER(cks_code) = UPPER($1) LIMIT 1`,
    [normalizedCode],
  );
  return mapRow(result.rows[0]);
}

export async function findAdminUserByClerkIdentifier(options: {
  clerkUserId?: string;
  email?: string;
  username?: string;
}): Promise<AdminUserRecord | null> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (options.clerkUserId) {
    params.push(options.clerkUserId);
    clauses.push(`clerk_user_id = $${params.length}`);
  }
  if (options.email) {
    params.push(options.email.toLowerCase());
    clauses.push(`LOWER(email) = $${params.length}`);
  }
  if (options.username) {
    params.push(options.username.toLowerCase());
    clauses.push(`LOWER(cks_code) = $${params.length}`);
  }

  if (!clauses.length) {
    return null;
  }

  const sql = `SELECT ${SELECT_COLUMNS} FROM ${TABLE_NAME} WHERE ${clauses.join(' OR ')} LIMIT 1`;
  const result = await query(sql, params);
  return mapRow(result.rows[0]);
}

export async function createAdminUser(input: AdminUserCreateInput): Promise<AdminUserRecord> {
  const payload = createAdminUserSchema.parse(input);

  const columns = [
    'clerk_user_id',
    'cks_code',
    'role',
    'status',
    'full_name',
    'email',
    'territory',
    'phone',
    'address',
    'reports_to',
  ];

  const values = [
    payload.clerkUserId,
    payload.cksCode.trim().toLowerCase(),
    (payload.role ?? 'admin').toLowerCase(),
    payload.status ?? 'active',
    toNullable(payload.fullName ?? null),
    payload.email?.toLowerCase() ?? null,
    toNullable(payload.territory ?? null),
    toNullable(payload.phone ?? null),
    toNullable(payload.address ?? null),
    toNullable(payload.reportsTo ?? null),
  ];

  try {
    const row = await withTransaction(async (client) => {
      const insertSql = `INSERT INTO ${TABLE_NAME} (${columns.join(', ')})
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING ${SELECT_COLUMNS}`;
      const response = await client.query(insertSql, values);
      return response.rows[0];
    });
    const record = mapRow(row);
    if (!record) {
      throw new Error('Failed to create admin user record');
    }
    return record;
  } catch (error) {
    handleUniqueViolation(error);
  }
}

export async function updateAdminUser(
  clerkUserId: string,
  updates: AdminUserUpdateInput,
): Promise<AdminUserRecord | null> {
  if (!clerkUserId) {
    return null;
  }

  const parsed = updateAdminUserSchema.parse({ clerkUserId, ...updates });
  const fieldMap: Record<string, string> = {
    cksCode: 'cks_code',
    role: 'role',
    status: 'status',
    fullName: 'full_name',
    email: 'email',
    territory: 'territory',
    phone: 'phone',
    address: 'address',
    reportsTo: 'reports_to',
    archivedAt: 'archived_at',
  };

  const assignments: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, column] of Object.entries(fieldMap)) {
    if (!(key in parsed) || parsed[key as keyof typeof parsed] === undefined) {
      continue;
    }
    const value = parsed[key as keyof typeof parsed];
    let normalized: unknown = value;
    if (key === 'cksCode' && typeof value === 'string') {
      normalized = value.trim().toLowerCase();
    } else if (key === 'email' && typeof value === 'string') {
      normalized = value.toLowerCase();
    } else if (
      ['fullName', 'territory', 'phone', 'address', 'reportsTo'].includes(key) &&
      typeof value === 'string'
    ) {
      normalized = toNullable(value);
    }
    params.push(normalized);
    assignments.push(`${column} = $${idx}`);
    idx += 1;
  }

  if (!assignments.length) {
    return getAdminUserByClerkId(clerkUserId);
  }

  assignments.push('updated_at = NOW()');
  const sql = `UPDATE ${TABLE_NAME} SET ${assignments.join(', ')} WHERE clerk_user_id = $${idx} RETURNING ${SELECT_COLUMNS}`;
  params.push(clerkUserId);

  try {
    const result = await query(sql, params);
    return mapRow(result.rows[0]);
  } catch (error) {
    handleUniqueViolation(error);
  }
  return null;
}

export async function setAdminUserStatus(
  clerkUserId: string,
  status: AdminUserStatus,
): Promise<AdminUserRecord | null> {
  const updates: AdminUserUpdateInput = { status };
  if (status === 'archived') {
    updates.archivedAt = new Date().toISOString();
  } else {
    updates.archivedAt = null;
  }
  return updateAdminUser(clerkUserId, updates);
}

export async function removeAdminUser(clerkUserId: string): Promise<AdminUserRecord | null> {
  if (!clerkUserId) {
    return null;
  }
  const result = await query(
    `DELETE FROM ${TABLE_NAME} WHERE clerk_user_id = $1 RETURNING ${SELECT_COLUMNS}`,
    [clerkUserId],
  );
  return mapRow(result.rows[0]);
}

export async function upsertAdminUserFromSession(input: {
  clerkUserId: string;
  email?: string;
  username?: string;
  defaultCode?: string;
}): Promise<AdminUserRecord> {
  const existingById = await getAdminUserByClerkId(input.clerkUserId);
  if (existingById) {
    return existingById;
  }

  const existingByOtherIdentifier = await findAdminUserByClerkIdentifier({
    email: input.email,
    username: input.username,
  });
  if (existingByOtherIdentifier) {
    return existingByOtherIdentifier;
  }

  const fallbackCode =
    input.defaultCode ||
    input.username?.toLowerCase() ||
    input.email?.split('@')[0]?.toLowerCase() ||
    `adm-${input.clerkUserId}`;

  try {
    return await createAdminUser({
      clerkUserId: input.clerkUserId,
      cksCode: fallbackCode,
      email: input.email,
      status: 'active',
      role: 'admin',
    });
  } catch (error) {
    if ((error as any)?.statusCode === 409) {
      const record = await getAdminUserByClerkId(input.clerkUserId);
      if (record) {
        return record;
      }
    }
    throw error;
  }
}
