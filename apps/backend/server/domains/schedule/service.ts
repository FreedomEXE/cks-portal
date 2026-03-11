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
 * - Read routes enforce scope using the existing hub scope graph
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { HubRole } from '../profile/types.js';
import { normalizeIdentity } from '../identity/customIdGenerator.js';
import { generateScheduleBlockId, generateScheduleTaskId } from '../identity/service.js';
import { getRoleScope } from '../scope/service.js';
import { syncScheduleBlockCalendarProjection } from './projections.js';
import {
  cancelScheduleBlocksBySource,
  getScheduleBlockById,
  listScheduleBlockDetailsInWindow,
  listScheduleBlocksInWindow,
  upsertScheduleBlock,
} from './store.js';
import type {
  CancelScheduleBlocksBySourceInput,
  ListScheduleBlocksQuery,
  ScheduleBlockDetail,
  ScheduleBlockRecord,
  ScheduleDayPlanBuilding,
  ScheduleDayPlanLane,
  ScheduleDayPlanResponse,
  ScheduleReadQuery,
  UpsertScheduleBlockInput,
  UpsertScheduleBlockTaskInput,
} from './types.js';

function buildGeneratorKey(blockId: string): string {
  return `block:${blockId}`;
}

function isScheduleInfraUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  return code === '42P01' || code === '42703';
}

function normalizeIds(values: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeIdentity(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function collectScopeIds(value: unknown, ids: Set<string>, parentKey?: string): void {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectScopeIds(item, ids, parentKey));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      collectScopeIds(nestedValue, ids, key);
    });
    return;
  }
  if (typeof value !== 'string' || !parentKey) {
    return;
  }
  const normalizedKey = parentKey.toLowerCase();
  if (normalizedKey === 'id' || normalizedKey.endsWith('id')) {
    const normalized = normalizeIdentity(value);
    if (normalized) {
      ids.add(normalized);
    }
  }
}

async function resolveViewerAccessibleIds(viewerRole: HubRole, viewerCode: string | null): Promise<string[] | undefined> {
  if (viewerRole === 'admin') {
    return undefined;
  }
  const normalizedViewerCode = normalizeIdentity(viewerCode ?? null);
  if (!normalizedViewerCode) {
    return undefined;
  }
  const ids = new Set<string>([normalizedViewerCode]);
  const scope = await getRoleScope(viewerRole, normalizedViewerCode);
  if (scope) {
    ids.add(scope.cksCode);
    collectScopeIds(scope.relationships, ids);
  }
  return Array.from(ids);
}

function deriveRequestedScopeIds(
  viewerRole: HubRole,
  viewerCode: string | null,
  viewerAccessibleIds: string[] | undefined,
  requestedScopeIds?: string[],
): string[] {
  const normalizedRequested = normalizeIds(requestedScopeIds);
  if (viewerRole === 'admin') {
    return normalizedRequested;
  }
  const normalizedViewerCode = normalizeIdentity(viewerCode ?? null);
  const accessible = new Set((viewerAccessibleIds ?? []).map((value) => value.toUpperCase()));
  if (normalizedViewerCode) {
    accessible.add(normalizedViewerCode);
  }
  if (!normalizedRequested.length) {
    return Array.from(accessible);
  }
  const filtered = normalizedRequested.filter((value) => accessible.has(value));
  return filtered.length ? filtered : Array.from(accessible);
}

function isTestBlock(block: ScheduleBlockDetail): boolean {
  if (
    [block.blockId, block.scopeId, block.centerId, block.warehouseId, block.sourceId]
      .map((value) => String(value || '').toUpperCase())
      .some((value) => value.includes('-TEST'))
  ) {
    return true;
  }
  return block.assignments.some((assignment) => assignment.participantId.toUpperCase().includes('-TEST'));
}

function matchesTestMode(block: ScheduleBlockDetail, testMode: ScheduleReadQuery['testMode']): boolean {
  if (!testMode || testMode === 'include') {
    return true;
  }
  const isTest = isTestBlock(block);
  return testMode === 'only' ? isTest : !isTest;
}

function matchesScopeIds(block: ScheduleBlockDetail, scopeIds: string[]): boolean {
  if (!scopeIds.length) {
    return true;
  }
  const ids = new Set(scopeIds);
  if (
    [
      block.blockId,
      block.scopeId,
      block.centerId,
      block.warehouseId,
      block.sourceId,
    ]
      .map((value) => normalizeIdentity(value))
      .some((value) => (value ? ids.has(value) : false))
  ) {
    return true;
  }
  return block.assignments.some((assignment) => ids.has(assignment.participantId));
}

function primaryLaneForBlock(block: ScheduleBlockDetail): { participantId: string | null; participantRole: string | null; laneId: string } {
  const preferred =
    block.assignments.find((assignment) => assignment.isPrimary) ??
    block.assignments.find((assignment) => assignment.assignmentType === 'assignee') ??
    block.assignments[0] ??
    null;
  if (!preferred) {
    return { participantId: null, participantRole: null, laneId: 'unassigned' };
  }
  return {
    participantId: preferred.participantId,
    participantRole: preferred.participantRole,
    laneId: `${preferred.participantRole}:${preferred.participantId}`,
  };
}

function buildDayPlan(
  date: string,
  blocks: ScheduleBlockDetail[],
  scopeType?: ScheduleReadQuery['scopeType'],
  scopeId?: string,
  scopeIds: string[] = [],
): ScheduleDayPlanResponse {
  const buildings = new Map<string, ScheduleDayPlanBuilding>();
  let taskCount = 0;
  let assignedBlockCount = 0;
  let unassignedBlockCount = 0;

  const sortedBlocks = [...blocks].sort((left, right) => {
    if (left.startAt === right.startAt) {
      return left.blockId.localeCompare(right.blockId);
    }
    return left.startAt.localeCompare(right.startAt);
  });

  for (const block of sortedBlocks) {
    taskCount += block.tasks.length;
    const buildingName = block.buildingName || block.centerId || block.scopeId || 'Unassigned location';
    const areaName = block.areaName ?? null;
    const buildingKey = `${buildingName}::${areaName ?? ''}`;
    const building =
      buildings.get(buildingKey) ??
      {
        buildingKey,
        buildingName,
        areaName,
        lanes: [],
        unassignedBlocks: [],
      };

    const laneMeta = primaryLaneForBlock(block);
    if (!laneMeta.participantId || !laneMeta.participantRole) {
      building.unassignedBlocks.push(block);
      unassignedBlockCount += 1;
    } else {
      let lane = building.lanes.find((entry: ScheduleDayPlanLane) => entry.laneId === laneMeta.laneId);
      if (!lane) {
        lane = {
          laneId: laneMeta.laneId,
          participantId: laneMeta.participantId,
          participantRole: laneMeta.participantRole,
          blocks: [],
        } satisfies ScheduleDayPlanLane;
        building.lanes.push(lane);
      }
      lane.blocks.push(block);
      assignedBlockCount += 1;
    }

    buildings.set(buildingKey, building);
  }

  const orderedBuildings = Array.from(buildings.values())
    .map((building) => ({
      ...building,
      lanes: [...building.lanes].sort((left, right) => {
        const leftLabel = `${left.participantRole ?? ''}:${left.participantId ?? ''}`;
        const rightLabel = `${right.participantRole ?? ''}:${right.participantId ?? ''}`;
        return leftLabel.localeCompare(rightLabel);
      }),
      unassignedBlocks: [...building.unassignedBlocks],
    }))
    .sort((left, right) => left.buildingName.localeCompare(right.buildingName));

  return {
    date,
    scopeType,
    scopeId,
    scopeIds,
    summary: {
      blockCount: blocks.length,
      assignedBlockCount,
      unassignedBlockCount,
      taskCount,
    },
    buildings: orderedBuildings,
  };
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

export async function fetchScheduleBlockById(input: {
  blockId: string;
  viewerRole: HubRole;
  viewerCode: string | null;
  scopeIds?: string[];
  testMode?: ScheduleReadQuery['testMode'];
}): Promise<ScheduleBlockDetail | null> {
  try {
    const block = await getScheduleBlockById(input.blockId);
    if (!block) {
      return null;
    }
    const viewerAccessibleIds = await resolveViewerAccessibleIds(input.viewerRole, input.viewerCode);
    const scopeIds = deriveRequestedScopeIds(input.viewerRole, input.viewerCode, viewerAccessibleIds, input.scopeIds);
    if (!matchesTestMode(block, input.testMode)) {
      return null;
    }
    if (!matchesScopeIds(block, scopeIds)) {
      return null;
    }
    return block;
  } catch (error) {
    if (isScheduleInfraUnavailable(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchScheduleBlocks(input: {
  viewerRole: HubRole;
  viewerCode: string | null;
  query: ScheduleReadQuery;
}): Promise<ScheduleBlockDetail[]> {
  try {
    const viewerAccessibleIds = await resolveViewerAccessibleIds(input.viewerRole, input.viewerCode);
    const scopeIds = deriveRequestedScopeIds(
      input.viewerRole,
      input.viewerCode,
      viewerAccessibleIds,
      input.query.scopeIds,
    );
    const blocks = await listScheduleBlockDetailsInWindow({
      start: input.query.start,
      end: input.query.end,
      limit: input.query.limit ?? 500,
    });
    return blocks.filter((block) => matchesTestMode(block, input.query.testMode) && matchesScopeIds(block, scopeIds));
  } catch (error) {
    if (isScheduleInfraUnavailable(error)) {
      return [];
    }
    throw error;
  }
}

export async function fetchScheduleDayPlan(input: {
  viewerRole: HubRole;
  viewerCode: string | null;
  query: Pick<ScheduleReadQuery, 'scopeType' | 'scopeId' | 'scopeIds' | 'testMode' | 'limit'> & { date: string };
}): Promise<ScheduleDayPlanResponse> {
  const start = `${input.query.date}T00:00:00.000Z`;
  const endDate = new Date(`${input.query.date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const end = endDate.toISOString();

  const blocks = await fetchScheduleBlocks({
    viewerRole: input.viewerRole,
    viewerCode: input.viewerCode,
    query: {
      ...input.query,
      start,
      end,
      limit: input.query.limit ?? 500,
    },
  });

  const viewerAccessibleIds = await resolveViewerAccessibleIds(input.viewerRole, input.viewerCode);
  const scopeIds = deriveRequestedScopeIds(
    input.viewerRole,
    input.viewerCode,
    viewerAccessibleIds,
    input.query.scopeIds,
  );

  return buildDayPlan(input.query.date, blocks, input.query.scopeType, input.query.scopeId, scopeIds);
}

export async function cancelBlocksForSource(input: CancelScheduleBlocksBySourceInput): Promise<string[]> {
  const blockIds = await cancelScheduleBlocksBySource(input);
  for (const blockId of blockIds) {
    await syncScheduleBlockCalendarProjectionSafely(blockId);
  }
  return blockIds;
}
