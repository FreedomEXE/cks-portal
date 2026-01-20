import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import {
  getAccessCode,
  getActiveAccessGrant,
  getLatestAccessGrant,
  getCascadeGrantForCode,
  incrementAccessCodeRedemptions,
  insertAccessCode,
  insertAccessGrant,
  updateAccessGrant,
} from './repository';
import type { AccessCodeRecord, AccessGrantRecord, AccessTier } from './types';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROLE_PREFIXES: Array<{ prefix: string; role: string }> = [
  { prefix: 'MGR-', role: 'manager' },
  { prefix: 'CON-', role: 'contractor' },
  { prefix: 'CUS-', role: 'customer' },
  { prefix: 'CEN-', role: 'center' },
  { prefix: 'CRW-', role: 'crew' },
  { prefix: 'WAR-', role: 'warehouse' },
  { prefix: 'WHS-', role: 'warehouse' },
];

function normalizeRole(role: string | null | undefined): string | null {
  if (!role) {
    return null;
  }
  const trimmed = role.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

function generateCodeSegment(length: number): string {
  let segment = '';
  for (let i = 0; i < length; i += 1) {
    segment += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return segment;
}

function generateAccessCode(): string {
  const segA = generateCodeSegment(4);
  const segB = generateCodeSegment(4);
  const segC = generateCodeSegment(4);
  return `CKS-${segA}-${segB}-${segC}`;
}

function inferRoleFromCksCode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  for (const entry of ROLE_PREFIXES) {
    if (normalized.startsWith(entry.prefix)) {
      return entry.role;
    }
  }
  return null;
}

function isExpired(code: AccessCodeRecord): boolean {
  if (!code.expiresAt) {
    return false;
  }
  const expiry = new Date(code.expiresAt);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
}

async function getManagerForAccount(role: string, cksCode: string): Promise<string | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) return null;

  switch (role) {
    case 'manager':
      return normalized;
    case 'contractor': {
      const result = await query<{ cks_manager: string | null }>(
        `SELECT cks_manager FROM contractors WHERE UPPER(contractor_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    case 'customer': {
      const result = await query<{ cks_manager: string | null }>(
        `SELECT cks_manager FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    case 'center': {
      const result = await query<{ cks_manager: string | null }>(
        `SELECT cks_manager FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    case 'crew': {
      const result = await query<{ cks_manager: string | null }>(
        `SELECT cks_manager FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    default:
      return null;
  }
}

async function getContractorForAccount(role: string, cksCode: string): Promise<string | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) return null;

  switch (role) {
    case 'contractor':
      return normalized;
    case 'customer': {
      const result = await query<{ contractor_id: string | null }>(
        `SELECT contractor_id FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.contractor_id ?? null);
    }
    case 'center': {
      const result = await query<{ contractor_id: string | null }>(
        `SELECT contractor_id FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.contractor_id ?? null);
    }
    case 'crew': {
      const result = await query<{ contractor_id: string | null }>(
        `SELECT contractor_id
         FROM centers
         WHERE center_id = (
           SELECT assigned_center FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1
         )
         LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.contractor_id ?? null);
    }
    default:
      return null;
  }
}

async function getCustomerForAccount(role: string, cksCode: string): Promise<string | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) return null;

  switch (role) {
    case 'customer':
      return normalized;
    case 'center': {
      const result = await query<{ customer_id: string | null }>(
        `SELECT customer_id FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.customer_id ?? null);
    }
    case 'crew': {
      const result = await query<{ customer_id: string | null }>(
        `SELECT customer_id
         FROM centers
         WHERE center_id = (
           SELECT assigned_center FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1
         )
         LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.customer_id ?? null);
    }
    default:
      return null;
  }
}

async function getCenterForAccount(role: string, cksCode: string): Promise<string | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) return null;

  switch (role) {
    case 'center':
      return normalized;
    case 'crew': {
      const result = await query<{ assigned_center: string | null }>(
        `SELECT assigned_center FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
        [normalized],
      );
      return normalizeIdentity(result.rows[0]?.assigned_center ?? null);
    }
    default:
      return null;
  }
}

async function isWithinScope(
  scopeRole: string,
  scopeCode: string,
  role: string,
  cksCode: string,
): Promise<boolean> {
  const normalizedScope = normalizeIdentity(scopeCode) ?? scopeCode;
  if (!normalizedScope) {
    return false;
  }
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return false;
  }

  switch (scopeRole) {
    case 'manager': {
      const managerCode = await getManagerForAccount(normalizedRole, cksCode);
      return !!managerCode && managerCode === normalizedScope;
    }
    case 'contractor': {
      const contractorCode = await getContractorForAccount(normalizedRole, cksCode);
      return !!contractorCode && contractorCode === normalizedScope;
    }
    case 'customer': {
      const customerCode = await getCustomerForAccount(normalizedRole, cksCode);
      return !!customerCode && customerCode === normalizedScope;
    }
    case 'center': {
      const centerCode = await getCenterForAccount(normalizedRole, cksCode);
      return !!centerCode && centerCode === normalizedScope;
    }
    default:
      return false;
  }
}

export async function createAccessCode(params: {
  targetRole: string;
  tier: AccessTier;
  maxRedemptions: number;
  scopeCode: string | null;
  createdByRole: string | null;
  createdByCode: string | null;
  notes: string | null;
  expiresAt: string | null;
}): Promise<AccessCodeRecord> {
  const scopeRole = params.scopeCode ? inferRoleFromCksCode(params.scopeCode) : null;
  const cascade = params.tier === 'premium';

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateAccessCode();
    const record = await insertAccessCode({
      code,
      targetRole: params.targetRole,
      tier: params.tier,
      status: 'active',
      maxRedemptions: params.maxRedemptions,
      scopeRole,
      scopeCode: params.scopeCode ? params.scopeCode.trim().toUpperCase() : null,
      cascade,
      createdByRole: params.createdByRole,
      createdByCode: params.createdByCode ? params.createdByCode.trim().toUpperCase() : null,
      notes: params.notes,
      expiresAt: params.expiresAt,
    });
    if (record) {
      return record;
    }
  }

  throw new Error('Failed to generate access code');
}

export async function redeemAccessCode(params: {
  code: string;
  role: string;
  cksCode: string;
  grantedByRole: string | null;
  grantedByCode: string | null;
}): Promise<AccessGrantRecord> {
  const normalizedCode = params.code.trim().toUpperCase();
  const role = normalizeRole(params.role);
  if (!role) {
    throw new Error('Invalid role for redemption');
  }

  const accessCode = await getAccessCode(normalizedCode);
  if (!accessCode) {
    throw new Error('Invalid access code');
  }

  if (accessCode.status !== 'active') {
    throw new Error('Access code is no longer active');
  }

  if (isExpired(accessCode)) {
    throw new Error('Access code has expired');
  }

  if (accessCode.targetRole.trim().toLowerCase() !== role) {
    throw new Error('Access code does not match your role');
  }

  if (accessCode.scopeRole && accessCode.scopeCode) {
    const ok = await isWithinScope(accessCode.scopeRole, accessCode.scopeCode, role, params.cksCode);
    if (!ok) {
      throw new Error('Access code is not valid for this account');
    }
  }

  if (accessCode.redeemedCount >= accessCode.maxRedemptions) {
    throw new Error('Access code has already been redeemed');
  }

  const existing = await getActiveAccessGrant(params.cksCode, role);
  if (existing) {
    return existing;
  }

  const grant = await insertAccessGrant({
    cksCode: params.cksCode,
    role,
    tier: accessCode.tier,
    status: 'active',
    sourceCode: accessCode.code,
    cascade: accessCode.cascade,
    grantedByRole: params.grantedByRole,
    grantedByCode: params.grantedByCode,
  });

  if (!grant) {
    throw new Error('Failed to create access grant');
  }

  await incrementAccessCodeRedemptions(accessCode.code);

  return grant;
}

export async function resolveAccessStatus(role: string, cksCode: string): Promise<{
  status: 'active' | 'locked';
  tier: AccessTier | null;
  source: 'direct' | 'cascade' | null;
}> {
  const normalizedRole = normalizeRole(role);
  const normalizedCode = normalizeIdentity(cksCode) ?? cksCode;

  if (!normalizedRole || !normalizedCode) {
    return { status: 'locked', tier: null, source: null };
  }

  const direct = await getActiveAccessGrant(normalizedCode, normalizedRole);
  if (direct) {
    return { status: 'active', tier: direct.tier, source: 'direct' };
  }

  const cascade = await resolveCascadeGrant(normalizedRole, normalizedCode);
  if (cascade) {
    return { status: 'active', tier: cascade.tier, source: 'cascade' };
  }

  return { status: 'locked', tier: null, source: null };
}

export async function hasActionAccess(role: string, cksCode: string): Promise<boolean> {
  const status = await resolveAccessStatus(role, cksCode);
  return status.status === 'active';
}

export async function getAccountAccessGrant(
  role: string,
  cksCode: string,
): Promise<AccessGrantRecord | null> {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return null;
  }
  return getLatestAccessGrant(cksCode, normalizedRole);
}

export async function setAccountAccessGrant(params: {
  role: string;
  cksCode: string;
  tier: AccessTier;
  status: 'active' | 'revoked';
  grantedByRole: string | null;
  grantedByCode: string | null;
}): Promise<AccessGrantRecord> {
  const normalizedRole = normalizeRole(params.role);
  if (!normalizedRole) {
    throw new Error('Invalid role for access grant');
  }

  const existing = await getLatestAccessGrant(params.cksCode, normalizedRole);
  if (existing) {
    const updated = await updateAccessGrant(existing.grantId, {
      tier: params.tier,
      status: params.status,
    });
    if (!updated) {
      throw new Error('Failed to update access grant');
    }
    return updated;
  }

  const created = await insertAccessGrant({
    cksCode: params.cksCode,
    role: normalizedRole,
    tier: params.tier,
    status: params.status,
    sourceCode: 'ADMIN',
    cascade: false,
    grantedByRole: params.grantedByRole,
    grantedByCode: params.grantedByCode,
  });

  if (!created) {
    throw new Error('Failed to create access grant');
  }

  return created;
}

async function resolveCascadeGrant(role: string, cksCode: string): Promise<AccessGrantRecord | null> {
  if (role === 'admin') {
    return null;
  }

  const parentManager = await getManagerForAccount(role, cksCode);
  if (parentManager) {
    const grant = await getCascadeGrantForCode(parentManager);
    if (grant) return grant;
  }

  const parentContractor = await getContractorForAccount(role, cksCode);
  if (parentContractor) {
    const grant = await getCascadeGrantForCode(parentContractor);
    if (grant) return grant;
  }

  const parentCustomer = await getCustomerForAccount(role, cksCode);
  if (parentCustomer) {
    const grant = await getCascadeGrantForCode(parentCustomer);
    if (grant) return grant;
  }

  const parentCenter = await getCenterForAccount(role, cksCode);
  if (parentCenter) {
    const grant = await getCascadeGrantForCode(parentCenter);
    if (grant) return grant;
  }

  return null;
}
