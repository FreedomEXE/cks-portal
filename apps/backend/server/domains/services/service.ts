import { query } from '../../db/connection';
import type { HubRole } from '../profile/types';
import { normalizeIdentity } from '../identity';

export async function applyServiceAction(input: {
  serviceId: string;
  actorRole: HubRole | null;
  actorCode: string | null;
  action: 'start' | 'complete' | 'verify';
  notes?: string | null;
}) {
  const serviceId = (input.serviceId || '').trim().toUpperCase();
  if (!serviceId) throw new Error('Invalid service id');

  // Locate originating order by transformed_id
  const result = await query<{ order_id: string; transformed_id: string | null; metadata: any; center_id: string | null }>(
    `SELECT order_id, transformed_id, metadata, center_id FROM orders WHERE transformed_id = $1 LIMIT 1`,
    [serviceId]
  );
  const row = result.rows[0];
  if (!row) throw new Error('Service not found');

  normalizeIdentity(input.actorCode || null); // reserved for future role/actor checks
  const nowIso = new Date().toISOString();
  const meta = row.metadata || {};

  if (input.action === 'start') {
    (meta as any).serviceStartedAt = nowIso;
    (meta as any).serviceStartNotes = input.notes || (meta as any).serviceStartNotes || null;
  } else if (input.action === 'complete') {
    (meta as any).serviceCompletedAt = nowIso;
    (meta as any).serviceCompleteNotes = input.notes || (meta as any).serviceCompleteNotes || null;
  } else if (input.action === 'verify') {
    (meta as any).serviceVerifiedAt = nowIso;
    (meta as any).serviceVerifiedBy = input.actorCode || null;
    (meta as any).serviceVerifyNotes = input.notes || (meta as any).serviceVerifyNotes || null;
  }

  await query(
    `UPDATE orders SET metadata = $1::jsonb, updated_at = NOW() WHERE order_id = $2`,
    [JSON.stringify(meta), row.order_id]
  );

  return {
    orderId: row.order_id,
    serviceId: row.transformed_id,
    centerId: row.center_id,
    metadata: meta,
    updatedAt: nowIso,
  };
}

export async function getServiceById(serviceIdRaw: string) {
  const serviceId = (serviceIdRaw || '').trim().toUpperCase();
  if (!serviceId) return null;
  const result = await query<{ order_id: string; transformed_id: string | null; metadata: any; center_id: string | null; title: string | null }>(
    `SELECT order_id, transformed_id, metadata, center_id, title FROM orders WHERE transformed_id = $1 LIMIT 1`,
    [serviceId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    orderId: row.order_id,
    serviceId: row.transformed_id,
    centerId: row.center_id,
    title: row.title,
    metadata: row.metadata || {},
  };
}

export async function updateServiceMetadata(input: {
  serviceId: string;
  actorRole: HubRole | null;
  actorCode: string | null;
  crew?: string[];
  procedures?: any[];
  training?: any[];
}) {
  const service = await getServiceById(input.serviceId);
  if (!service) return null;
  const meta = service.metadata || {};
  const beforeCrew: string[] = Array.isArray((meta as any).crew) ? (meta as any).crew : [];
  const afterCrew: string[] = Array.isArray(input.crew) ? input.crew : beforeCrew;
  (meta as any).crew = afterCrew;
  if (input.procedures) (meta as any).procedures = input.procedures;
  if (input.training) (meta as any).training = input.training;
  // Diff crew participants
  const beforeSet = new Set(beforeCrew.map(c => (c || '').toUpperCase()));
  const afterSet = new Set(afterCrew.map(c => (c || '').toUpperCase()));
  const toAdd: string[] = Array.from(afterSet).filter(c => !beforeSet.has(c));
  const toRemove: string[] = Array.from(beforeSet).filter(c => !afterSet.has(c));

  // Persist metadata
  await query(`UPDATE orders SET metadata = $1::jsonb, updated_at = NOW() WHERE order_id = $2`, [JSON.stringify(meta), service.orderId]);

  // Add participants for new crew assignments
  for (const code of toAdd) {
    await query(
      `INSERT INTO order_participants (order_id, participant_id, participant_role, participation_type)
       VALUES ($1, $2, 'crew', 'actor')
       ON CONFLICT (order_id, participant_id, participant_role)
       DO UPDATE SET participation_type = EXCLUDED.participation_type`,
      [service.orderId, code]
    );
  }
  // Remove participants for removed crew
  for (const code of toRemove) {
    await query(
      `DELETE FROM order_participants WHERE order_id = $1 AND participant_id = $2 AND participant_role = 'crew'`,
      [service.orderId, code]
    );
  }
  return { ...service, metadata: meta };
}
