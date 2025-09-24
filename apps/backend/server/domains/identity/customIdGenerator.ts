import { query } from '../../db/connection';
import type { IdentityDescriptor, IdentityEntity } from './types';

const IDENTITY_DESCRIPTORS: Record<IdentityEntity, IdentityDescriptor> = {
  manager: { prefix: 'MGR', sequence: 'manager_id_seq' },
  contractor: { prefix: 'CON', sequence: 'contractor_id_seq' },
  customer: { prefix: 'CUS', sequence: 'customer_id_seq' },
  center: { prefix: 'CEN', sequence: 'center_id_seq' },
  crew: { prefix: 'CRW', sequence: 'crew_id_seq' },
  warehouse: { prefix: 'WHS', sequence: 'warehouse_id_seq' },
};

const VALID_SEQUENCES = new Set(
  Object.values(IDENTITY_DESCRIPTORS).map((descriptor) => descriptor.sequence),
);

function formatSerial(prefix: string, numericValue: number): string {
  const absolute = Math.max(0, numericValue);
  const digits = absolute.toString();
  if (absolute < 1000) {
    return `${prefix}-${digits.padStart(3, '0')}`;
  }
  return `${prefix}-${digits}`;
}

async function ensureSequence(sequence: string): Promise<void> {
  if (!VALID_SEQUENCES.has(sequence)) {
    throw new Error(`Unsupported sequence requested: ${sequence}`);
  }
  // Additional validation for SQL safety
  if (!/^[a-z_]+$/.test(sequence)) {
    throw new Error(`Invalid sequence name format: ${sequence}`);
  }
  await query(`CREATE SEQUENCE IF NOT EXISTS ${sequence} AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE`);
}

async function nextSerial(sequence: string): Promise<number> {
  if (!VALID_SEQUENCES.has(sequence)) {
    throw new Error(`Unsupported sequence requested: ${sequence}`);
  }
  const result = await query<{ value: string }>(`SELECT nextval('${sequence}') AS value`);
  const record = result.rows[0];
  if (!record) {
    throw new Error(`Failed to fetch next value for sequence ${sequence}`);
  }
  const value = Number(record.value);
  if (Number.isNaN(value)) {
    throw new Error(`Sequence ${sequence} returned non-numeric value`);
  }
  return value;
}

export async function generatePrefixedId(entity: IdentityEntity): Promise<string> {
  const descriptor = IDENTITY_DESCRIPTORS[entity];
  if (!descriptor) {
    throw new Error(`Unsupported identity entity: ${entity}`);
  }
  await ensureSequence(descriptor.sequence);
  const value = await nextSerial(descriptor.sequence);
  return formatSerial(descriptor.prefix, value);
}

export function normalizeIdentity(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
}
