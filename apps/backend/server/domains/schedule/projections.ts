/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: projections.ts
 *
 * Description:
 * Schedule-block to calendar projection helpers.
 *
 * Responsibilities:
 * - Re-read schedule block state
 * - Materialize calendar read-model rows from authoritative blocks
 * - Remove projections when blocks are archived or missing
 *
 * Role in system:
 * - Called by the Schedule service after block writes or source cancellations
 *
 * Notes:
 * - Hard rule: schedule blocks project into calendar_events via block:{blockId}
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import crypto from 'node:crypto';
import { normalizeIdentity } from '../identity/customIdGenerator.js';
import { deleteCalendarProjectionByGeneratorKey, upsertCalendarProjection } from '../calendar/store.js';
import { getScheduleBlockById } from './store.js';
import type { ScheduleBlockDetail } from './types.js';

function hashPayload(value: Record<string, unknown>): string {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');
}

function mapParticipants(block: ScheduleBlockDetail) {
  const participants = new Map<string, {
    participantId: string;
    participantRole: string;
    participationType: string;
    notify: boolean;
  }>();

  const push = (
    participantId: string | null | undefined,
    participantRole: string | null | undefined,
    participationType = 'watcher',
  ) => {
    const normalizedId = normalizeIdentity(participantId ?? null);
    const normalizedRole = String(participantRole || '').trim().toLowerCase();
    if (!normalizedId || !normalizedRole) return;
    const key = `${normalizedId}:${normalizedRole}`;
    if (participants.has(key)) return;
    participants.set(key, {
      participantId: normalizedId,
      participantRole: normalizedRole,
      participationType,
      notify: true,
    });
  };

  push(block.scopeId, block.scopeType);
  push(block.centerId, 'center');
  push(block.warehouseId, 'warehouse');

  for (const assignment of block.assignments) {
    push(
      assignment.participantId,
      assignment.participantRole,
      assignment.assignmentType === 'assignee' ? 'actor' : assignment.assignmentType,
    );
  }

  return Array.from(participants.values());
}

function buildProjectionMetadata(block: ScheduleBlockDetail): Record<string, unknown> {
  return {
    blockId: block.blockId,
    scopeType: block.scopeType,
    scopeId: block.scopeId,
    blockType: block.blockType,
    sourceType: block.sourceType,
    sourceId: block.sourceId,
    buildingName: block.buildingName,
    areaName: block.areaName,
    centerId: block.centerId,
    warehouseId: block.warehouseId,
    serviceId: block.sourceType === 'service' ? block.sourceId : null,
    orderId: block.sourceType && block.sourceType.includes('order') ? block.sourceId : null,
    assignments: block.assignments.map((assignment) => ({
      assignmentId: assignment.assignmentId,
      participantId: assignment.participantId,
      participantRole: assignment.participantRole,
      assignmentType: assignment.assignmentType,
      isPrimary: assignment.isPrimary,
      status: assignment.status,
    })),
    tasks: block.tasks.map((task) => ({
      taskId: task.taskId,
      sequence: task.sequence,
      title: task.title,
      status: task.status,
      areaName: task.areaName,
      estimatedMinutes: task.estimatedMinutes,
      catalogItemCode: task.catalogItemCode,
      catalogItemType: task.catalogItemType,
    })),
  };
}

export async function syncScheduleBlockCalendarProjection(blockId: string): Promise<void> {
  const block = await getScheduleBlockById(blockId);
  const generatorKey = `block:${normalizeIdentity(blockId) ?? blockId}`;
  if (!block || block.archivedAt) {
    await deleteCalendarProjectionByGeneratorKey(generatorKey);
    return;
  }

  const metadata = buildProjectionMetadata(block);
  await upsertCalendarProjection({
    generatorKey,
    eventType: block.blockType || 'schedule_block',
    eventCategory: 'schedule',
    title: block.title,
    description: block.description,
    plannedStartAt: block.startAt,
    plannedEndAt: block.endAt,
    actualStartAt: typeof block.metadata.actualStartAt === 'string' ? block.metadata.actualStartAt : null,
    actualEndAt: typeof block.metadata.actualEndAt === 'string' ? block.metadata.actualEndAt : null,
    timezone: block.timezone,
    status: block.status,
    priority: block.priority,
    sourceType: 'schedule_block',
    sourceId: block.blockId,
    sourceAction: block.sourceAction ?? block.status,
    centerId: block.centerId,
    warehouseId: block.warehouseId,
    locationName: block.buildingName ?? block.areaName ?? block.centerId ?? block.scopeId,
    metadata,
    tags: ['schedule', block.blockType].filter(Boolean),
    createdBy: block.createdBy,
    createdByRole: 'system',
    updatedBy: block.updatedBy ?? block.createdBy,
    sourceVersion: block.updatedAt,
    sourceHash: hashPayload(metadata),
    participants: mapParticipants(block),
  });
}
