/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: service.ts
 *
 * Description:
 * Internal Schedule-domain orchestration helpers.
 *
 * Responsibilities:
 * - Generate canonical BLK/TSK IDs
 * - Persist schedule blocks and their task instances
 * - Trigger calendar projection updates and source-cancellation propagation
 *
 * Role in system:
 * - Imported by future Schedule routes and source-domain write paths
 *
 * Notes:
 * - Public authoring routes are intentionally deferred to the next wave
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { generateScheduleBlockId, generateScheduleTaskId } from '../identity/service.js';
import { syncScheduleBlockCalendarProjection } from './projections.js';
import { cancelScheduleBlocksBySource, getScheduleBlockById, listScheduleBlocksInWindow, upsertScheduleBlock } from './store.js';
import type {
  CancelScheduleBlocksBySourceInput,
  ListScheduleBlocksQuery,
  ScheduleBlockDetail,
  ScheduleBlockRecord,
  UpsertScheduleBlockInput,
  UpsertScheduleBlockTaskInput,
} from './types.js';

function buildGeneratorKey(blockId: string): string {
  return `block:${blockId}`;
}

async function materializeTasks(
  blockId: string,
  tasks: UpsertScheduleBlockTaskInput[] | undefined,
): Promise<UpsertScheduleBlockTaskInput[] | undefined> {
  if (!tasks?.length) {
    return tasks;
  }

  const materialized: UpsertScheduleBlockTaskInput[] = [];
  for (const [index, task] of tasks.entries()) {
    materialized.push({
      ...task,
      sequence: task.sequence ?? index + 1,
      taskId: task.taskId ?? await generateScheduleTaskId(blockId),
    });
  }
  return materialized;
}

export async function syncScheduleBlockCalendarProjectionSafely(blockId: string): Promise<void> {
  try {
    await syncScheduleBlockCalendarProjection(blockId);
  } catch (error) {
    console.warn(`[schedule] calendar projection sync failed for ${blockId}`, error);
  }
}

export async function saveScheduleBlock(input: UpsertScheduleBlockInput): Promise<string> {
  const blockId = input.blockId ?? await generateScheduleBlockId({ test: input.isTest === true });
  const tasks = await materializeTasks(blockId, input.tasks);
  const savedBlockId = await upsertScheduleBlock({
    ...input,
    blockId,
    generatorKey: input.generatorKey ?? buildGeneratorKey(blockId),
    tasks,
  });
  await syncScheduleBlockCalendarProjectionSafely(savedBlockId);
  return savedBlockId;
}

export async function getScheduleBlock(blockId: string): Promise<ScheduleBlockDetail | null> {
  return getScheduleBlockById(blockId);
}

export async function listScheduleBlocks(query: ListScheduleBlocksQuery): Promise<ScheduleBlockRecord[]> {
  return listScheduleBlocksInWindow(query);
}

export async function cancelBlocksForSource(input: CancelScheduleBlocksBySourceInput): Promise<string[]> {
  const blockIds = await cancelScheduleBlocksBySource(input);
  for (const blockId of blockIds) {
    await syncScheduleBlockCalendarProjectionSafely(blockId);
  }
  return blockIds;
}
