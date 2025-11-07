import { query } from '../../db/connection';
import type { HubRole } from '../profile/types';
import { normalizeIdentity } from '../identity';
import { z } from 'zod';
import { recordActivity } from '../activity/writer';

export async function applyServiceAction(input: {
  serviceId: string;
  actorRole: HubRole | null;
  actorCode: string | null;
  action: 'start' | 'complete' | 'verify' | 'cancel' | 'update-notes';
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

  // Determine new service status
  let newServiceStatus: string | null = null;
  let actualStartTime: string | null = null;
  let actualEndTime: string | null = null;

  if (input.action === 'start') {
    (meta as any).serviceStartedAt = nowIso;
    (meta as any).actualStartDate = nowIso; // For frontend display
    (meta as any).serviceStartNotes = input.notes || (meta as any).serviceStartNotes || null;
    (meta as any).serviceStartedBy = input.actorCode || null;
    (meta as any).serviceStatus = 'in_progress';
    newServiceStatus = 'in_progress';
    actualStartTime = nowIso;
  } else if (input.action === 'complete') {
    (meta as any).serviceCompletedAt = nowIso;
    (meta as any).serviceCompleteNotes = input.notes || (meta as any).serviceCompleteNotes || null;
    (meta as any).serviceStatus = 'completed';
    newServiceStatus = 'completed';
    actualEndTime = nowIso;
  } else if (input.action === 'cancel') {
    (meta as any).serviceCancelledAt = nowIso;
    (meta as any).serviceCancellationReason = input.notes || (meta as any).serviceCancellationReason || null;
    (meta as any).serviceCancelledBy = input.actorCode || null;
    (meta as any).serviceStatus = 'cancelled';
    newServiceStatus = 'cancelled';
  } else if (input.action === 'verify') {
    (meta as any).serviceVerifiedAt = nowIso;
    (meta as any).serviceVerifiedBy = input.actorCode || null;
    (meta as any).serviceVerifyNotes = input.notes || (meta as any).serviceVerifyNotes || null;
    // Verify doesn't change service status
  } else if (input.action === 'update-notes') {
    // Allow warehouse to add/update notes at any point
    const currentStatus = (meta as any).serviceStatus;
    if (input.notes) {
      if (currentStatus === 'created' || !currentStatus) {
        // Service hasn't started yet - add as pre-service notes
        (meta as any).servicePreNotes = input.notes;
      } else if (currentStatus === 'in_progress') {
        // Service in progress - append to ongoing notes
        const existingNotes = (meta as any).serviceOngoingNotes || '';
        (meta as any).serviceOngoingNotes = existingNotes ? `${existingNotes}\n\n[${nowIso}]\n${input.notes}` : `[${nowIso}]\n${input.notes}`;
      }
    }
    // update-notes doesn't change service status
  }

  // Update order metadata (persist service status/timestamps)
  await query(
    `UPDATE orders SET metadata = $1::jsonb, updated_at = NOW() WHERE order_id = $2`,
    [JSON.stringify(meta), row.order_id]
  );

  // Update services table status if action changes status
  if (newServiceStatus) {
    if (actualStartTime) {
      await query(
        `UPDATE services
         SET status = $1,
             actual_start_time = $3,
             managed_by = $4,
             updated_at = NOW()
         WHERE service_id = $2`,
        [newServiceStatus, serviceId, actualStartTime, input.actorCode || null]
      );
    } else if (actualEndTime) {
      await query(
        `UPDATE services
         SET status = $1,
             actual_end_time = $3,
             updated_at = NOW()
         WHERE service_id = $2`,
        [newServiceStatus, serviceId, actualEndTime]
      );
    } else {
      await query(
        `UPDATE services
         SET status = $1,
             updated_at = NOW()
         WHERE service_id = $2`,
        [newServiceStatus, serviceId]
      );
    }
  }

  // Record activity for the action
  const actorId = normalizeIdentity(input.actorCode || null) ?? 'SYSTEM';
  const actorRole = input.actorRole || 'system';

  if (input.action === 'start') {
    await recordActivity({
      activityType: 'service_started',
      description: `Started Service ${serviceId}`,
      actorId,
      actorRole,
      targetId: serviceId,
      targetType: 'service',
      metadata: { notes: input.notes },
    });
  } else if (input.action === 'complete') {
    await recordActivity({
      activityType: 'service_completed',
      description: `Completed Service ${serviceId}`,
      actorId,
      actorRole,
      targetId: serviceId,
      targetType: 'service',
      metadata: { notes: input.notes },
    });
  } else if (input.action === 'cancel') {
    await recordActivity({
      activityType: 'service_cancelled',
      description: `Cancelled Service ${serviceId}`,
      actorId,
      actorRole,
      targetId: serviceId,
      targetType: 'service',
      metadata: { reason: input.notes },
    });
  } else if (input.action === 'verify') {
    await recordActivity({
      activityType: 'service_verified',
      description: `Verified Service ${serviceId}`,
      actorId,
      actorRole,
      targetId: serviceId,
      targetType: 'service',
      metadata: { notes: input.notes },
    });
  } else if (input.action === 'update-notes') {
    await recordActivity({
      activityType: 'service_notes_updated',
      description: `Updated Notes for Service ${serviceId}`,
      actorId,
      actorRole,
      targetId: serviceId,
      targetType: 'service',
      metadata: { notes: input.notes },
    });
  }

  return {
    orderId: row.order_id,
    serviceId: row.transformed_id,
    centerId: row.center_id,
    metadata: meta,
    status: newServiceStatus,
    updatedAt: nowIso,
  };
}

export async function getServiceById(serviceIdRaw: string) {
  const serviceId = (serviceIdRaw || '').trim().toUpperCase();
  if (!serviceId) return null;
  const result = await query<{
    order_id: string;
    transformed_id: string | null;
    metadata: any;
    center_id: string | null;
    title: string | null;
    notes: string | null;
    status: string | null;
  }>(
    `SELECT order_id, transformed_id, metadata, center_id, title, notes, status FROM orders WHERE transformed_id = $1 LIMIT 1`,
    [serviceId]
  );
  const row = result.rows[0];
  if (!row) return null;

  // Enrich metadata with crew names
  const metadata = row.metadata || {};
  let crewCodes: string[] = Array.isArray((metadata as any).crew) ? (metadata as any).crew : [];

  // If no crew array but there are accepted crewRequests, build crew array from those
  if (crewCodes.length === 0 && Array.isArray((metadata as any).crewRequests)) {
    const acceptedCrews = (metadata as any).crewRequests
      .filter((req: any) => req.status === 'accepted' && req.crewCode)
      .map((req: any) => req.crewCode);
    crewCodes = acceptedCrews;
  }

  if (crewCodes.length > 0) {
    // Fetch crew names from database
    const crewResult = await query<{ crew_id: string; name: string }>(
      `SELECT crew_id, name FROM crew WHERE crew_id = ANY($1::text[]) AND archived_at IS NULL`,
      [crewCodes]
    );

    // Build crew array with code and name
    const enrichedCrew = crewCodes.map(code => {
      const crewRow = crewResult.rows.find(r => r.crew_id === code);
      return {
        code: code,
        name: crewRow?.name || code
      };
    });

    (metadata as any).crew = enrichedCrew;
  }

  return {
    orderId: row.order_id,
    serviceId: row.transformed_id,
    centerId: row.center_id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    metadata,
  };
}

export async function updateServiceMetadata(input: {
  serviceId: string;
  actorRole: HubRole | null;
  actorCode: string | null;
  crew?: string[];
  procedures?: any[];
  training?: any[];
  tasks?: any[];
  notes?: string;
}) {
  const service = await getServiceById(input.serviceId);
  if (!service) return null;
  const meta = service.metadata || {};
  const beforeTasks: any[] = Array.isArray((meta as any).tasks) ? (meta as any).tasks : [];
  const beforeCrew: string[] = Array.isArray((meta as any).crew) ? (meta as any).crew : [];
  const afterCrew: string[] = Array.isArray(input.crew) ? input.crew : beforeCrew;
  (meta as any).crew = afterCrew;
  if (input.procedures) (meta as any).procedures = input.procedures;
  if (input.training) (meta as any).training = input.training;
  if (input.tasks) (meta as any).tasks = input.tasks;
  if (input.notes !== undefined) (meta as any).notes = input.notes;
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
    try {
      await recordActivity({
        activityType: 'crew_unassigned_from_service',
        description: `Crew ${code} unassigned from Service ${input.serviceId}`,
        actorId: normalizeIdentity(input.actorCode || '') || 'SYSTEM',
        actorRole: input.actorRole || 'system',
        targetId: input.serviceId,
        targetType: 'service',
        metadata: {
          crewId: code,
          serviceId: input.serviceId,
          managerId: normalizeIdentity(input.actorCode || '') || undefined,
        },
      });
    } catch {}
  }

  // Record activity when tasks updated
  try {
    if (input.tasks) {
      // Generic update event
      await recordActivity({
        activityType: 'service_tasks_updated',
        description: `Updated tasks for Service ${input.serviceId}`,
        actorId: normalizeIdentity(input.actorCode || '') || 'SYSTEM',
        actorRole: input.actorRole || 'system',
        targetId: input.serviceId,
        targetType: 'service',
        metadata: { taskCount: Array.isArray(input.tasks) ? input.tasks.length : 0 },
      });

      // Detect newly completed tasks (crew checklist)
      const role = (input.actorRole || '').toLowerCase();
      const prevMap = new Map<string, any>();
      for (const t of beforeTasks) {
        const id = String((t?.id ?? t?.title ?? '') || '').trim();
        if (id) prevMap.set(id, t);
      }
      for (const t of input.tasks) {
        const id = String((t?.id ?? t?.title ?? '') || '').trim();
        if (!id) continue;
        const was = prevMap.get(id);
        const nowCompletedAt = (t as any)?.completedAt || null;
        const wasCompletedAt = was ? (was as any)?.completedAt || null : null;
        if (nowCompletedAt && !wasCompletedAt && role === 'crew') {
          await recordActivity({
            activityType: 'service_task_completed',
            description: `Completed task "${(t as any)?.title || id}" on Service ${input.serviceId}`,
            actorId: normalizeIdentity(input.actorCode || '') || 'SYSTEM',
            actorRole: input.actorRole || 'system',
            targetId: input.serviceId,
            targetType: 'service',
            metadata: {
              taskId: id,
              title: (t as any)?.title || id,
              completedAt: nowCompletedAt,
              completedBy: normalizeIdentity(input.actorCode || '') || null,
            },
          });
        }
      }
    }
  } catch {}
  return { ...service, metadata: meta };
}

export async function addServiceCrewRequests(input: {
  serviceId: string;
  managerCode: string;
  crewCodes: string[];
  message?: string | null;
}) {
  const service = await getServiceById(input.serviceId);
  if (!service) throw new Error('Service not found');

  const orderId = service.orderId;
  const result = await query<{ metadata: any }>(
    `SELECT metadata FROM orders WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
  if (!result.rowCount) throw new Error('Order not found for service');
  const currentMetadata = (result.rows[0].metadata || {}) as any;

  const crewRequests: Array<{ crewCode: string; status: 'pending' | 'accepted' | 'rejected'; message?: string; requestedAt: string; respondedAt?: string }>
    = Array.isArray(currentMetadata.crewRequests) ? currentMetadata.crewRequests : [];

  const newRequests = input.crewCodes.map((code) => ({
    crewCode: normalizeIdentity(code || '') || (code || '').toUpperCase(),
    status: 'pending' as const,
    message: input.message ?? undefined,
    requestedAt: new Date().toISOString(),
  }));

  const updatedMetadata = {
    ...currentMetadata,
    crewRequests: [...crewRequests, ...newRequests],
  } as Record<string, unknown>;

  await query(
    `UPDATE orders SET metadata = $1::jsonb, updated_at = NOW() WHERE order_id = $2`,
    [JSON.stringify(updatedMetadata), orderId]
  );

  // Ensure participants for requested crew so they can see the service
  for (const code of input.crewCodes) {
    const id = normalizeIdentity(code || '') || (code || '').toUpperCase();
    if (!id) continue;
    await query(
      `INSERT INTO order_participants (order_id, participant_id, participant_role, participation_type)
       VALUES ($1, $2, 'crew', 'actor')
       ON CONFLICT (order_id, participant_id, participant_role)
       DO UPDATE SET participation_type = EXCLUDED.participation_type`,
      [orderId, id]
    );
  }

  // Record activity for crew request
  const actorId = normalizeIdentity(input.managerCode) ?? 'MANAGER';
  // 1) Manager-level log (for manager feeds and service history)
  await recordActivity({
    activityType: 'service_crew_requested',
    description: `Requested Crew for Service ${input.serviceId}`,
    actorId,
    actorRole: 'manager',
    targetId: input.serviceId,
    targetType: 'service',
    metadata: {
      crewCodes: input.crewCodes,
      message: input.message,
    },
  });
  // 2) Per-crew notifications (target = crew)
  for (const code of input.crewCodes) {
    const crewId = normalizeIdentity(code || '') || (code || '').toUpperCase();
    if (!crewId) continue;
    await recordActivity({
      activityType: 'service_crew_requested',
      description: `Requested you to work on Service ${input.serviceId}`,
      actorId,
      actorRole: 'manager',
      targetId: crewId,
      targetType: 'crew',
      metadata: {
        crewId,
        serviceId: input.serviceId,
        managerId: actorId,
        message: input.message ?? undefined,
      },
    });
  }

  return { ...service, metadata: updatedMetadata };
}

export async function respondToServiceCrewRequest(input: {
  serviceId: string;
  crewCode: string;
  accept: boolean;
}) {
  const service = await getServiceById(input.serviceId);
  if (!service) throw new Error('Service not found');
  const orderId = service.orderId;

  // Load metadata
  const res = await query<{ metadata: any }>(
    `SELECT metadata FROM orders WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
  if (!res.rowCount) throw new Error('Order not found for service');
  const currentMetadata = (res.rows[0].metadata || {}) as any;
  const crewRequests: Array<{ crewCode: string; status: 'pending'|'accepted'|'rejected'; message?: string; requestedAt: string; respondedAt?: string }>
    = Array.isArray(currentMetadata.crewRequests) ? currentMetadata.crewRequests : [];

  const code = normalizeIdentity(input.crewCode || '') || (input.crewCode || '').toUpperCase();
  let found = false;
  const updated = crewRequests.map((req) => {
    if (req.crewCode === code && req.status === 'pending') {
      found = true;
      return { ...req, status: input.accept ? 'accepted' : 'rejected', respondedAt: new Date().toISOString() };
    }
    return req;
  });
  if (!found) {
    throw new Error('No pending crew request found for this user');
  }

  const updatedMetadata = { ...currentMetadata, crewRequests: updated } as Record<string, unknown>;

  // If accepting, add crew code to metadata.crew array for display
  if (input.accept) {
    const currentCrew: string[] = Array.isArray((updatedMetadata as any).crew) ? (updatedMetadata as any).crew : [];
    if (!currentCrew.includes(code)) {
      (updatedMetadata as any).crew = [...currentCrew, code];
    }
  }

  await query(
    `UPDATE orders SET metadata = $1::jsonb, updated_at = NOW() WHERE order_id = $2`,
    [JSON.stringify(updatedMetadata), orderId]
  );

  if (!input.accept) {
    // Remove from participants so it disappears from their view
    await query(
      `DELETE FROM order_participants WHERE order_id = $1 AND participant_id = $2 AND participant_role = 'crew'`,
      [orderId, code]
    );
  } else {
    // Ensure participant entry exists/updated as actor
    await query(
      `INSERT INTO order_participants (order_id, participant_id, participant_role, participation_type)
       VALUES ($1, $2, 'crew', 'actor')
       ON CONFLICT (order_id, participant_id, participant_role)
       DO UPDATE SET participation_type = EXCLUDED.participation_type`,
      [orderId, code]
    );
  }

  // Look up manager for scoping metadata on activities
  let managerId: string | null = null;
  try {
    const mgr = await query<{ manager_id: string | null }>(
      `SELECT manager_id FROM orders WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    managerId = (mgr.rows[0]?.manager_id || null) as any;
    managerId = normalizeIdentity(managerId || null);
  } catch {}

  // Record activity for crew response
  const actorId = normalizeIdentity(code) ?? 'CREW';
  await recordActivity({
    activityType: 'service_crew_response',
    description: input.accept
      ? `Accepted Crew Request for Service ${input.serviceId}`
      : `Declined Crew Request for Service ${input.serviceId}`,
    actorId,
    actorRole: 'crew',
    targetId: input.serviceId,
    targetType: 'service',
    metadata: {
      accepted: input.accept,
      crewCode: code,
      managerId: managerId || undefined,
    },
  });

  // On acceptance, emit an assignment event so others can be notified
  if (input.accept) {
    await recordActivity({
      activityType: 'crew_assigned_to_service',
      description: `Crew ${code} assigned to Service ${input.serviceId}`,
      actorId,
      actorRole: 'crew',
      targetId: input.serviceId,
      targetType: 'service',
      metadata: {
        crewId: code,
        serviceId: input.serviceId,
        managerId: managerId || undefined,
        // Optionally include center if available in future
      },
    });
  }

  return { ...service, metadata: updatedMetadata };
}
