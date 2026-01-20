import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { AccessCodeRecord, AccessGrantRecord, AccessTier } from './types';

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function mapAccessCode(row: Record<string, unknown>): AccessCodeRecord {
  return {
    code: String(row.code),
    targetRole: String(row.target_role),
    tier: (row.tier as AccessTier) ?? 'standard',
    status: String(row.status),
    maxRedemptions: Number(row.max_redemptions ?? 1),
    redeemedCount: Number(row.redeemed_count ?? 0),
    scopeRole: toNullableString(row.scope_role),
    scopeCode: toNullableString(row.scope_code),
    cascade: Boolean(row.cascade),
    notes: toNullableString(row.notes),
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapAccessGrant(row: Record<string, unknown>): AccessGrantRecord {
  return {
    grantId: Number(row.grant_id),
    cksCode: String(row.cks_code),
    role: String(row.role),
    tier: row.tier as AccessTier,
    status: String(row.status),
    sourceCode: String(row.source_code),
    cascade: Boolean(row.cascade),
    grantedByRole: toNullableString(row.granted_by_role),
    grantedByCode: toNullableString(row.granted_by_code),
    grantedAt: toIso(row.granted_at) ?? new Date().toISOString(),
    revokedAt: toIso(row.revoked_at),
  };
}

export async function insertAccessCode(payload: {
  code: string;
  targetRole: string;
  tier: AccessTier;
  status: string;
  maxRedemptions: number;
  scopeRole: string | null;
  scopeCode: string | null;
  cascade: boolean;
  createdByRole: string | null;
  createdByCode: string | null;
  notes: string | null;
  expiresAt: string | null;
}): Promise<AccessCodeRecord | null> {
  const result = await query<Record<string, unknown>>(
    `INSERT INTO access_codes (
      code,
      target_role,
      tier,
      status,
      max_redemptions,
      scope_role,
      scope_code,
      cascade,
      created_by_role,
      created_by_code,
      notes,
      expires_at,
      created_at,
      updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
    RETURNING *`,
    [
      payload.code,
      payload.targetRole,
      payload.tier,
      payload.status,
      payload.maxRedemptions,
      payload.scopeRole,
      payload.scopeCode,
      payload.cascade,
      payload.createdByRole,
      payload.createdByCode,
      payload.notes,
      payload.expiresAt,
    ],
  );

  const row = result.rows[0];
  return row ? mapAccessCode(row) : null;
}

export async function getAccessCode(code: string): Promise<AccessCodeRecord | null> {
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM access_codes WHERE UPPER(code) = $1 LIMIT 1`,
    [code.trim().toUpperCase()],
  );
  const row = result.rows[0];
  return row ? mapAccessCode(row) : null;
}

export async function incrementAccessCodeRedemptions(code: string): Promise<AccessCodeRecord | null> {
  const result = await query<Record<string, unknown>>(
    `UPDATE access_codes
     SET redeemed_count = redeemed_count + 1,
         status = CASE WHEN redeemed_count + 1 >= max_redemptions THEN 'redeemed' ELSE status END,
         updated_at = NOW()
     WHERE UPPER(code) = $1
     RETURNING *`,
    [code.trim().toUpperCase()],
  );
  const row = result.rows[0];
  return row ? mapAccessCode(row) : null;
}

export async function insertAccessGrant(payload: {
  cksCode: string;
  role: string;
  tier: AccessTier;
  status: string;
  sourceCode: string;
  cascade: boolean;
  grantedByRole: string | null;
  grantedByCode: string | null;
}): Promise<AccessGrantRecord | null> {
  const normalizedCode = normalizeIdentity(payload.cksCode) ?? payload.cksCode;
  const result = await query<Record<string, unknown>>(
    `INSERT INTO access_grants (
      cks_code,
      role,
      tier,
      status,
      source_code,
      cascade,
      granted_by_role,
      granted_by_code,
      granted_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
    RETURNING *`,
    [
      normalizedCode,
      payload.role,
      payload.tier,
      payload.status,
      payload.sourceCode,
      payload.cascade,
      payload.grantedByRole,
      payload.grantedByCode,
    ],
  );
  const row = result.rows[0];
  return row ? mapAccessGrant(row) : null;
}

export async function getActiveAccessGrant(
  cksCode: string,
  role: string,
): Promise<AccessGrantRecord | null> {
  const normalizedCode = normalizeIdentity(cksCode) ?? cksCode;
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM access_grants
     WHERE UPPER(cks_code) = $1 AND role = $2 AND status = 'active'
     ORDER BY granted_at DESC
     LIMIT 1`,
    [normalizedCode, role],
  );
  const row = result.rows[0];
  return row ? mapAccessGrant(row) : null;
}

export async function getLatestAccessGrant(
  cksCode: string,
  role: string,
): Promise<AccessGrantRecord | null> {
  const normalizedCode = normalizeIdentity(cksCode) ?? cksCode;
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM access_grants
     WHERE UPPER(cks_code) = $1 AND role = $2
     ORDER BY granted_at DESC
     LIMIT 1`,
    [normalizedCode, role],
  );
  const row = result.rows[0];
  return row ? mapAccessGrant(row) : null;
}

export async function getCascadeGrantForCode(
  cksCode: string,
): Promise<AccessGrantRecord | null> {
  const normalizedCode = normalizeIdentity(cksCode) ?? cksCode;
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM access_grants
     WHERE UPPER(cks_code) = $1 AND status = 'active' AND cascade = true
     ORDER BY granted_at DESC
     LIMIT 1`,
    [normalizedCode],
  );
  const row = result.rows[0];
  return row ? mapAccessGrant(row) : null;
}

export async function updateAccessGrant(
  grantId: number,
  payload: {
    tier?: AccessTier;
    status?: string;
  },
): Promise<AccessGrantRecord | null> {
  const updates: string[] = [];
  const values: Array<string | number | null> = [];
  let index = 1;

  if (payload.tier !== undefined) {
    updates.push(`tier = $${index}`);
    values.push(payload.tier);
    index += 1;
  }

  if (payload.status !== undefined) {
    updates.push(`status = $${index}`);
    values.push(payload.status);
    index += 1;
    updates.push(`revoked_at = CASE WHEN $${index - 1} = 'revoked' THEN NOW() ELSE NULL END`);
  }

  if (updates.length === 0) {
    return null;
  }

  const result = await query<Record<string, unknown>>(
    `UPDATE access_grants
     SET ${updates.join(', ')}
     WHERE grant_id = $${index}
     RETURNING *`,
    [...values, grantId],
  );

  const row = result.rows[0];
  return row ? mapAccessGrant(row) : null;
}
