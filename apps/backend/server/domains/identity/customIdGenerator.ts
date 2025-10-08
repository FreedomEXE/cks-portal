import { query } from '../../db/connection';
import type { IdentityDescriptor, IdentityEntity } from './types';

const IDENTITY_DESCRIPTORS: Record<IdentityEntity, IdentityDescriptor> = {
  manager: { prefix: 'MGR', sequence: 'manager_id_seq' },
  contractor: { prefix: 'CON', sequence: 'contractor_id_seq' },
  customer: { prefix: 'CUS', sequence: 'customer_id_seq' },
  center: { prefix: 'CEN', sequence: 'center_id_seq' },
  crew: { prefix: 'CRW', sequence: 'crew_id_seq' },
  warehouse: { prefix: 'WHS', sequence: 'warehouse_id_seq' },
  // System records
  report: { prefix: 'RPT', sequence: 'report_id_seq' },
  feedback: { prefix: 'FBK', sequence: 'feedback_id_seq' },
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

/**
 * Generate a prefixed ID for reports/feedback that includes the creator's ID
 * Format: CREATOR_ID-TYPE-NNN (e.g., CEN-001-RPT-001)
 */
export async function generateReportFeedbackId(
  entity: 'report' | 'feedback',
  creatorId: string
): Promise<string> {
  const descriptor = IDENTITY_DESCRIPTORS[entity];
  if (!descriptor) {
    throw new Error(`Unsupported identity entity: ${entity}`);
  }

  // Normalize the creator ID
  const normalizedCreatorId = normalizeIdentity(creatorId);
  if (!normalizedCreatorId) {
    throw new Error('Invalid creator ID provided');
  }

  // Create a per-creator sequence name (e.g., report_id_seq_cen_001)
  const creatorSequence = `${descriptor.sequence}_${normalizedCreatorId.toLowerCase().replace(/-/g, '_')}`;

  // Ensure the per-creator sequence exists
  if (!/^[a-z0-9_]+$/.test(creatorSequence)) {
    throw new Error(`Invalid sequence name format: ${creatorSequence}`);
  }
  await query(`CREATE SEQUENCE IF NOT EXISTS ${creatorSequence} AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE`);

  // Get the next value for this creator's sequence
  const result = await query<{ value: string }>(`SELECT nextval('${creatorSequence}') AS value`);
  const record = result.rows[0];
  if (!record) {
    throw new Error(`Failed to fetch next value for sequence ${creatorSequence}`);
  }
  const value = Number(record.value);
  if (Number.isNaN(value)) {
    throw new Error(`Sequence ${creatorSequence} returned non-numeric value`);
  }

  // Format as CREATOR_ID-TYPE-NNN
  const absolute = Math.max(0, value);
  const digits = absolute.toString().padStart(3, '0');
  return `${normalizedCreatorId}-${descriptor.prefix}-${digits}`;
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
