/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: store.ts
 *
 * Description:
 * Persistence helpers for Schedule blocks, assignments, and task instances.
 *
 * Responsibilities:
 * - Read and write authoritative schedule planning records
 * - Replace block assignments and task instances transactionally
 * - Support source-cancellation propagation
 *
 * Role in system:
 * - Used by the internal Schedule service and calendar projection helpers
 *
 * Notes:
 * - Schedule blocks are authoritative planning records
 * - Calendar events are projected from this data
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { QueryResultRow } from 'pg';
import { query, withTransaction } from '../../db/connection.js';
import { normalizeIdentity } from '../identity/customIdGenerator.js';
import type {
  CancelScheduleBlocksBySourceInput,
  ListScheduleBlocksQuery,
  ScheduleBlockAssignmentRecord,
  ScheduleBlockDetail,
  ScheduleBlockRecord,
  ScheduleBlockTaskRecord,
  UpsertScheduleBlockAssignmentInput,
  UpsertScheduleBlockInput,
  UpsertScheduleBlockTaskInput,
} from './types.js';

type TxQuery = <R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[],
) => Promise<{ rows: R[] }>;

type ScheduleBlockRow = QueryResultRow & {
  block_id: string;
  scope_type: string;
  scope_id: string;
  center_id: string | null;
  warehouse_id: string | null;
  building_name: string | null;
  area_name: string | null;
  start_at: Date | string;
  end_at: Date | string | null;
  timezone: string;
  block_type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  source_type: string | null;
  source_id: string | null;
  source_action: string | null;
  template_id: string | null;
  recurrence_rule: string | null;
  series_parent_id: string | null;
  occurrence_index: number | string | null;
  generator_key: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  created_by: string;
  updated_at: Date | string;
  updated_by: string | null;
  version: number | string;
  archived_at: Date | string | null;
  archived_by: string | null;
};

type ScheduleAssignmentRow = QueryResultRow & {
  assignment_id: number | string;
  block_id: string;
  participant_id: string;
  participant_role: string;
  assignment_type: string;
  is_primary: boolean;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  created_by: string;
  updated_at: Date | string;
  updated_by: string | null;
};

type ScheduleTaskRow = QueryResultRow & {
  task_id: string;
  block_id: string;
  sequence: number | string;
  task_type: string;
  catalog_item_code: string | null;
  catalog_item_type: string | null;
  title: string;
  description: string | null;
  area_name: string | null;
  estimated_minutes: number | string | null;
  status: string;
  version: number | string;
  required_tools: string[] | null;
  required_products: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  created_by: string;
  updated_at: Date | string;
  updated_by: string | null;
};

function createScheduleConflictError(message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = 409;
  return error;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function mapBlockRow(row: ScheduleBlockRow): ScheduleBlockRecord {
  return {
    blockId: row.block_id,
    scopeType: row.scope_type as ScheduleBlockRecord['scopeType'],
    scopeId: row.scope_id,
    centerId: row.center_id,
    warehouseId: row.warehouse_id,
    buildingName: row.building_name,
    areaName: row.area_name,
    startAt: toIso(row.start_at) || new Date().toISOString(),
    endAt: toIso(row.end_at),
    timezone: row.timezone,
    blockType: row.block_type,
    title: row.title,
    description: row.description,
    status: row.status as ScheduleBlockRecord['status'],
    priority: row.priority as ScheduleBlockRecord['priority'],
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceAction: row.source_action,
    templateId: row.template_id,
    recurrenceRule: row.recurrence_rule,
    seriesParentId: row.series_parent_id,
    occurrenceIndex: row.occurrence_index === null ? null : Number(row.occurrence_index),
    generatorKey: row.generator_key,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    createdBy: row.created_by,
    updatedAt: toIso(row.updated_at) || new Date().toISOString(),
    updatedBy: row.updated_by,
    version: Number(row.version || 1),
    archivedAt: toIso(row.archived_at),
    archivedBy: row.archived_by,
  };
}

function mapAssignmentRow(row: ScheduleAssignmentRow): ScheduleBlockAssignmentRecord {
  return {
    assignmentId: Number(row.assignment_id),
    blockId: row.block_id,
    participantId: row.participant_id,
    participantRole: row.participant_role,
    assignmentType: row.assignment_type,
    isPrimary: Boolean(row.is_primary),
    status: row.status,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    createdBy: row.created_by,
    updatedAt: toIso(row.updated_at) || new Date().toISOString(),
    updatedBy: row.updated_by,
  };
}

function mapTaskRow(row: ScheduleTaskRow): ScheduleBlockTaskRecord {
  return {
    taskId: row.task_id,
    blockId: row.block_id,
    sequence: Number(row.sequence || 1),
    taskType: row.task_type,
    catalogItemCode: row.catalog_item_code,
    catalogItemType: row.catalog_item_type,
    title: row.title,
    description: row.description,
    areaName: row.area_name,
    estimatedMinutes: row.estimated_minutes === null ? null : Number(row.estimated_minutes),
    status: row.status as ScheduleBlockTaskRecord['status'],
    version: Number(row.version || 1),
    requiredTools: Array.isArray(row.required_tools) ? row.required_tools : [],
    requiredProducts: Array.isArray(row.required_products) ? row.required_products : [],
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    createdBy: row.created_by,
    updatedAt: toIso(row.updated_at) || new Date().toISOString(),
    updatedBy: row.updated_by,
  };
}

async function replaceAssignments(
  tx: TxQuery,
  blockId: string,
  assignments: UpsertScheduleBlockAssignmentInput[] | undefined,
  actorId: string,
): Promise<void> {
  await tx(`DELETE FROM schedule_block_assignments WHERE block_id = $1`, [blockId]);
  if (!assignments?.length) {
    return;
  }

  const participantIds: string[] = [];
  const participantRoles: string[] = [];
  const assignmentTypes: string[] = [];
  const primaryFlags: boolean[] = [];
  const statuses: string[] = [];
  const metadataValues: string[] = [];
  const seen = new Set<string>();

  for (const assignment of assignments) {
    const participantId = normalizeIdentity(assignment.participantId);
    const participantRole = String(assignment.participantRole || '').trim().toLowerCase();
    if (!participantId || !participantRole) continue;
    const assignmentType = String(assignment.assignmentType || 'assignee').trim().toLowerCase() || 'assignee';
    const uniqueKey = `${participantId}:${participantRole}:${assignmentType}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);
    participantIds.push(participantId);
    participantRoles.push(participantRole);
    assignmentTypes.push(assignmentType);
    primaryFlags.push(Boolean(assignment.isPrimary));
    statuses.push(String(assignment.status || 'assigned').trim().toLowerCase() || 'assigned');
    metadataValues.push(JSON.stringify(assignment.metadata || {}));
  }

  if (!participantIds.length) {
    return;
  }

  await tx(
    `
      INSERT INTO schedule_block_assignments (
        block_id,
        participant_id,
        participant_role,
        assignment_type,
        is_primary,
        status,
        metadata,
        created_by,
        updated_by
      )
      SELECT
        $1,
        participant_id,
        participant_role,
        assignment_type,
        is_primary,
        status,
        metadata::jsonb,
        $7,
        $7
      FROM UNNEST(
        $2::text[],
        $3::text[],
        $4::text[],
        $5::boolean[],
        $6::text[],
        $8::text[]
      ) AS batch(participant_id, participant_role, assignment_type, is_primary, status, metadata)
    `,
    [blockId, participantIds, participantRoles, assignmentTypes, primaryFlags, statuses, actorId, metadataValues],
  );
}

async function replaceTasks(
  tx: TxQuery,
  blockId: string,
  tasks: UpsertScheduleBlockTaskInput[] | undefined,
  actorId: string,
): Promise<void> {
  if (!tasks?.length) {
    await tx(`DELETE FROM schedule_block_tasks WHERE block_id = $1`, [blockId]);
    return;
  }

  const taskIds: string[] = [];
  const sequences: number[] = [];
  const taskTypes: string[] = [];
  const catalogCodes: (string | null)[] = [];
  const catalogTypes: (string | null)[] = [];
  const titles: string[] = [];
  const descriptions: (string | null)[] = [];
  const areaNames: (string | null)[] = [];
  const estimatedMinutes: (number | null)[] = [];
  const statuses: string[] = [];
  const requiredTools: string[] = [];
  const requiredProducts: string[] = [];
  const metadataValues: string[] = [];
  const versions: number[] = [];

  for (const [index, task] of tasks.entries()) {
    const title = String(task.title || '').trim();
    const taskId = normalizeIdentity(task.taskId);
    if (!title || !taskId) continue;
    taskIds.push(taskId);
    sequences.push(task.sequence ?? index + 1);
    taskTypes.push(String(task.taskType || 'task').trim().toLowerCase() || 'task');
    catalogCodes.push(task.catalogItemCode ?? null);
    catalogTypes.push(task.catalogItemType ?? null);
    titles.push(title);
    descriptions.push(task.description ?? null);
    areaNames.push(task.areaName ?? null);
    estimatedMinutes.push(task.estimatedMinutes ?? null);
    statuses.push(String(task.status || 'pending').trim().toLowerCase() || 'pending');
    requiredTools.push(JSON.stringify((task.requiredTools ?? []).map((item) => String(item).trim()).filter(Boolean)));
    requiredProducts.push(JSON.stringify((task.requiredProducts ?? []).map((item) => String(item).trim()).filter(Boolean)));
    metadataValues.push(JSON.stringify(task.metadata || {}));
    versions.push(task.version ?? 1);
  }

  if (!taskIds.length) {
    await tx(`DELETE FROM schedule_block_tasks WHERE block_id = $1`, [blockId]);
    return;
  }

  await tx(
    `
      DELETE FROM schedule_block_tasks
      WHERE block_id = $1
        AND NOT (task_id = ANY($2::text[]))
    `,
    [blockId, taskIds],
  );

  const taskUpsertResult = await tx<{ task_id: string }>(
    `
      INSERT INTO schedule_block_tasks (
        task_id,
        block_id,
        sequence,
        version,
        task_type,
        catalog_item_code,
        catalog_item_type,
        title,
        description,
        area_name,
        estimated_minutes,
        status,
        required_tools,
        required_products,
        metadata,
        created_by,
        updated_by
      )
      SELECT
        ($2::text[])[idx],
        $1,
        ($3::int[])[idx],
        ($4::int[])[idx],
        ($5::text[])[idx],
        ($6::text[])[idx],
        ($7::text[])[idx],
        ($8::text[])[idx],
        ($9::text[])[idx],
        ($10::text[])[idx],
        ($11::int[])[idx],
        ($12::text[])[idx],
        COALESCE(ARRAY(SELECT jsonb_array_elements_text((($13::jsonb[])[idx]))), '{}'::text[]),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text((($14::jsonb[])[idx]))), '{}'::text[]),
        (($15::text[])[idx])::jsonb,
        $16,
        $16
      FROM generate_subscripts($2::text[], 1) AS idx
      ON CONFLICT (task_id) DO UPDATE SET
        sequence = EXCLUDED.sequence,
        task_type = EXCLUDED.task_type,
        catalog_item_code = EXCLUDED.catalog_item_code,
        catalog_item_type = EXCLUDED.catalog_item_type,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        area_name = EXCLUDED.area_name,
        estimated_minutes = EXCLUDED.estimated_minutes,
        status = EXCLUDED.status,
        required_tools = EXCLUDED.required_tools,
        required_products = EXCLUDED.required_products,
        metadata = EXCLUDED.metadata,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by,
        version = schedule_block_tasks.version + 1
      WHERE schedule_block_tasks.block_id = $1
        AND schedule_block_tasks.version = EXCLUDED.version
      RETURNING task_id
    `,
    [
      blockId,
      taskIds,
      sequences,
      versions,
      taskTypes,
      catalogCodes,
      catalogTypes,
      titles,
      descriptions,
      areaNames,
      estimatedMinutes,
      statuses,
      requiredTools,
      requiredProducts,
      metadataValues,
      actorId,
    ],
  );

  const persistedTaskIds = new Set(taskUpsertResult.rows.map((row) => row.task_id));
  const conflictedTaskId = taskIds.find((taskId) => !persistedTaskIds.has(taskId));
  if (conflictedTaskId) {
    throw createScheduleConflictError(`Schedule task ${conflictedTaskId} was updated by another user. Refresh and try again.`);
  }
}

export async function upsertScheduleBlock(input: UpsertScheduleBlockInput & { blockId: string; generatorKey: string }): Promise<string> {
  return withTransaction(async (tx) => {
    const normalizedBlockId = normalizeIdentity(input.blockId) ?? input.blockId;
    const actorId = input.updatedBy ?? input.createdBy ?? 'SYSTEM';
    const existingResult = await tx<{ block_id: string; version: number }>(
      `
        SELECT block_id, version
        FROM schedule_blocks
        WHERE UPPER(block_id) = UPPER($1)
        LIMIT 1
      `,
      [normalizedBlockId],
    );
    const existing = existingResult.rows[0] ?? null;
    if (existing && input.expectedVersion !== undefined && input.expectedVersion !== null && Number(existing.version) !== Number(input.expectedVersion)) {
      throw createScheduleConflictError(`Schedule block ${normalizedBlockId} was updated by another user. Refresh and try again.`);
    }

    let blockId = normalizedBlockId;
    if (!existing) {
      const result = await tx<{ block_id: string }>(
        `
          INSERT INTO schedule_blocks (
            block_id,
            scope_type,
            scope_id,
            center_id,
            warehouse_id,
            building_name,
            area_name,
            start_at,
            end_at,
            timezone,
            block_type,
            title,
            description,
            status,
            priority,
            source_type,
            source_id,
            source_action,
            template_id,
            recurrence_rule,
            series_parent_id,
            occurrence_index,
            generator_key,
            metadata,
            created_by,
            updated_by
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8::timestamptz, $9::timestamptz,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22,
            $23, $24::jsonb, $25, $26
          )
          RETURNING block_id
        `,
        [
          normalizedBlockId,
          input.scopeType,
          normalizeIdentity(input.scopeId) ?? input.scopeId,
          normalizeIdentity(input.centerId ?? null),
          normalizeIdentity(input.warehouseId ?? null),
          input.buildingName ?? null,
          input.areaName ?? null,
          input.startAt,
          input.endAt ?? null,
          input.timezone ?? 'America/Toronto',
          input.blockType,
          input.title,
          input.description ?? null,
          input.status ?? 'scheduled',
          input.priority ?? 'normal',
          input.sourceType ?? null,
          normalizeIdentity(input.sourceId ?? null),
          input.sourceAction ?? null,
          input.templateId ?? null,
          input.recurrenceRule ?? null,
          input.seriesParentId ?? null,
          input.occurrenceIndex ?? null,
          input.generatorKey,
          JSON.stringify(input.metadata ?? {}),
          input.createdBy ?? 'SYSTEM',
          actorId,
        ],
      );
      blockId = result.rows[0]?.block_id;
    } else {
      const result = await tx<{ block_id: string }>(
        `
          UPDATE schedule_blocks
          SET
            scope_type = $2,
            scope_id = $3,
            center_id = $4,
            warehouse_id = $5,
            building_name = $6,
            area_name = $7,
            start_at = $8::timestamptz,
            end_at = $9::timestamptz,
            timezone = $10,
            block_type = $11,
            title = $12,
            description = $13,
            status = $14,
            priority = $15,
            source_type = $16,
            source_id = $17,
            source_action = $18,
            template_id = $19,
            recurrence_rule = $20,
            series_parent_id = $21,
            occurrence_index = $22,
            generator_key = $23,
            metadata = $24::jsonb,
            updated_at = NOW(),
            updated_by = $25,
            version = version + 1
          WHERE UPPER(block_id) = UPPER($1)
            AND ($26::int IS NULL OR version = $26)
          RETURNING block_id
        `,
        [
          normalizedBlockId,
          input.scopeType,
          normalizeIdentity(input.scopeId) ?? input.scopeId,
          normalizeIdentity(input.centerId ?? null),
          normalizeIdentity(input.warehouseId ?? null),
          input.buildingName ?? null,
          input.areaName ?? null,
          input.startAt,
          input.endAt ?? null,
          input.timezone ?? 'America/Toronto',
          input.blockType,
          input.title,
          input.description ?? null,
          input.status ?? 'scheduled',
          input.priority ?? 'normal',
          input.sourceType ?? null,
          normalizeIdentity(input.sourceId ?? null),
          input.sourceAction ?? null,
          input.templateId ?? null,
          input.recurrenceRule ?? null,
          input.seriesParentId ?? null,
          input.occurrenceIndex ?? null,
          input.generatorKey,
          JSON.stringify(input.metadata ?? {}),
          actorId,
          input.expectedVersion ?? null,
        ],
      );
      if (!result.rows[0]?.block_id) {
        throw createScheduleConflictError(`Schedule block ${normalizedBlockId} was updated by another user. Refresh and try again.`);
      }
      blockId = result.rows[0]?.block_id;
    }

    await replaceAssignments(tx, blockId, input.assignments, actorId);
    await replaceTasks(tx, blockId, input.tasks, actorId);
    return blockId;
  });
}

export async function getScheduleBlockById(blockId: string): Promise<ScheduleBlockDetail | null> {
  const blockResult = await query<ScheduleBlockRow>(
    `
      SELECT *
      FROM schedule_blocks
      WHERE UPPER(block_id) = UPPER($1)
      LIMIT 1
    `,
    [blockId],
  );
  const blockRow = blockResult.rows[0];
  if (!blockRow) {
    return null;
  }

  const [assignmentResult, taskResult] = await Promise.all([
    query<ScheduleAssignmentRow>(
      `
        SELECT *
        FROM schedule_block_assignments
        WHERE block_id = $1
        ORDER BY is_primary DESC, assignment_id ASC
      `,
      [blockRow.block_id],
    ),
    query<ScheduleTaskRow>(
      `
        SELECT *
        FROM schedule_block_tasks
        WHERE block_id = $1
        ORDER BY sequence ASC, task_id ASC
      `,
      [blockRow.block_id],
    ),
  ]);

  return {
    ...mapBlockRow(blockRow),
    assignments: assignmentResult.rows.map(mapAssignmentRow),
    tasks: taskResult.rows.map(mapTaskRow),
  };
}

export async function listScheduleBlocksInWindow(input: ListScheduleBlocksQuery): Promise<ScheduleBlockRecord[]> {
  const params: unknown[] = [input.start, input.end];
  let whereClause = `
    WHERE archived_at IS NULL
      AND COALESCE(end_at, start_at) >= $1::timestamptz
      AND start_at <= $2::timestamptz
  `;

  if (input.scopeType && input.scopeId) {
    params.push(input.scopeType, normalizeIdentity(input.scopeId) ?? input.scopeId);
    whereClause += ` AND scope_type = $${params.length - 1} AND UPPER(scope_id) = UPPER($${params.length})`;
  }
  if (input.centerId) {
    params.push(normalizeIdentity(input.centerId) ?? input.centerId);
    whereClause += ` AND UPPER(COALESCE(center_id, '')) = UPPER($${params.length})`;
  }
  if (input.warehouseId) {
    params.push(normalizeIdentity(input.warehouseId) ?? input.warehouseId);
    whereClause += ` AND UPPER(COALESCE(warehouse_id, '')) = UPPER($${params.length})`;
  }
  if (input.statuses?.length) {
    params.push(input.statuses);
    whereClause += ` AND status = ANY($${params.length}::text[])`;
  }

  params.push(input.limit ?? 250);
  const result = await query<ScheduleBlockRow>(
    `
      SELECT *
      FROM schedule_blocks
      ${whereClause}
      ORDER BY start_at ASC, block_id ASC
      LIMIT $${params.length}
    `,
    params,
  );

  return result.rows.map(mapBlockRow);
}

export async function listScheduleBlockDetailsInWindow(input: ListScheduleBlocksQuery): Promise<ScheduleBlockDetail[]> {
  const blocks = await listScheduleBlocksInWindow(input);
  if (!blocks.length) {
    return [];
  }

  const blockIds = blocks.map((block) => block.blockId);
  const [assignmentResult, taskResult] = await Promise.all([
    query<ScheduleAssignmentRow>(
      `
        SELECT *
        FROM schedule_block_assignments
        WHERE block_id = ANY($1::text[])
        ORDER BY is_primary DESC, assignment_id ASC
      `,
      [blockIds],
    ),
    query<ScheduleTaskRow>(
      `
        SELECT *
        FROM schedule_block_tasks
        WHERE block_id = ANY($1::text[])
        ORDER BY sequence ASC, task_id ASC
      `,
      [blockIds],
    ),
  ]);

  const assignmentsByBlock = new Map<string, ScheduleBlockAssignmentRecord[]>();
  for (const row of assignmentResult.rows) {
    const assignment = mapAssignmentRow(row);
    const bucket = assignmentsByBlock.get(assignment.blockId) ?? [];
    bucket.push(assignment);
    assignmentsByBlock.set(assignment.blockId, bucket);
  }

  const tasksByBlock = new Map<string, ScheduleBlockTaskRecord[]>();
  for (const row of taskResult.rows) {
    const task = mapTaskRow(row);
    const bucket = tasksByBlock.get(task.blockId) ?? [];
    bucket.push(task);
    tasksByBlock.set(task.blockId, bucket);
  }

  return blocks.map((block) => ({
    ...block,
    assignments: assignmentsByBlock.get(block.blockId) ?? [],
    tasks: tasksByBlock.get(block.blockId) ?? [],
  }));
}

export async function cancelScheduleBlocksBySource(input: CancelScheduleBlocksBySourceInput): Promise<string[]> {
  const result = await query<{ block_id: string }>(
    `
      UPDATE schedule_blocks
      SET
        status = 'cancelled',
        updated_at = NOW(),
        updated_by = $3,
        version = version + 1
      WHERE archived_at IS NULL
        AND LOWER(COALESCE(source_type, '')) = LOWER($1)
        AND UPPER(COALESCE(source_id, '')) = UPPER($2)
        AND status <> 'cancelled'
      RETURNING block_id
    `,
    [input.sourceType, input.sourceId, input.updatedBy ?? 'SYSTEM'],
  );

  return result.rows.map((row) => row.block_id);
}
