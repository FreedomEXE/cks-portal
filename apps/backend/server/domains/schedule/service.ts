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
  ScheduleBuildingWeeklyExportBlock,
  ScheduleBuildingWeeklyExportDay,
  ScheduleBuildingWeeklyExportLane,
  ScheduleBuildingWeeklyExportResponse,
  ScheduleBuildingWeeklyExportTask,
  ScheduleEcosystemSummaryBuilding,
  ScheduleEcosystemSummaryBuildingCrew,
  ScheduleEcosystemSummaryCrew,
  ScheduleEcosystemSummaryResponse,
  ScheduleCrewDailyExportBlock,
  ScheduleCrewDailyExportResponse,
  ScheduleCrewDailyExportTask,
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

function formatCategoryLabel(value?: string | null): string {
  return (value || 'General')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function normalizeTextKey(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
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

async function resolveStrictScopeId(
  viewerRole: HubRole,
  viewerCode: string | null,
  requestedId: string,
): Promise<string | null> {
  const normalizedRequested = normalizeIdentity(requestedId);
  if (!normalizedRequested) {
    return null;
  }
  if (viewerRole === 'admin') {
    return normalizedRequested;
  }
  const viewerAccessibleIds = await resolveViewerAccessibleIds(viewerRole, viewerCode);
  const accessible = new Set((viewerAccessibleIds ?? []).map((value) => value.toUpperCase()));
  const normalizedViewerCode = normalizeIdentity(viewerCode ?? null);
  if (normalizedViewerCode) {
    accessible.add(normalizedViewerCode);
  }
  return accessible.has(normalizedRequested) ? normalizedRequested : null;
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

function mapBuildingWeeklyTasks(block: ScheduleBlockDetail): ScheduleBuildingWeeklyExportTask[] {
  return block.tasks
    .slice()
    .sort((left, right) => left.sequence - right.sequence || left.taskId.localeCompare(right.taskId))
    .map((task) => ({
      taskId: task.taskId,
      sequence: task.sequence,
      title: task.title,
      description: task.description,
      areaName: task.areaName,
      estimatedMinutes: task.estimatedMinutes,
      status: task.status,
      taskType: task.taskType,
      categoryLabel: formatCategoryLabel(task.catalogItemType || task.taskType || 'General'),
    }));
}

function mapBuildingWeeklyBlock(block: ScheduleBlockDetail): ScheduleBuildingWeeklyExportBlock {
  return {
    blockId: block.blockId,
    blockType: block.blockType,
    title: block.title,
    description: block.description,
    status: block.status,
    priority: block.priority,
    startAt: block.startAt,
    endAt: block.endAt,
    timezone: block.timezone,
    centerId: block.centerId,
    sourceType: block.sourceType,
    sourceId: block.sourceId,
    tasks: mapBuildingWeeklyTasks(block),
  };
}

async function resolveCrewDisplayName(crewId: string, centerId?: string | null): Promise<string | null> {
  const normalizedCrewId = normalizeIdentity(crewId);
  const normalizedCenterId = normalizeIdentity(centerId ?? null);
  if (!normalizedCrewId || !normalizedCenterId) {
    return null;
  }
  const centerScope = await getRoleScope('center', normalizedCenterId);
  const crew = centerScope?.relationships.crew.find((entry) => normalizeIdentity(entry.id) === normalizedCrewId) ?? null;
  return crew?.name ?? null;
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

export async function fetchCrewDailyExport(input: {
  viewerRole: HubRole;
  viewerCode: string | null;
  query: { date: string; crewId: string; testMode?: ScheduleReadQuery['testMode'] };
}): Promise<ScheduleCrewDailyExportResponse | null> {
  try {
    const crewId = await resolveStrictScopeId(input.viewerRole, input.viewerCode, input.query.crewId);
    if (!crewId) {
      return null;
    }

    const crewScope = await getRoleScope('crew', crewId);
    if (!crewScope) {
      return null;
    }

    const start = `${input.query.date}T00:00:00.000Z`;
    const endDate = new Date(`${input.query.date}T00:00:00.000Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    const end = endDate.toISOString();

    const blocks = await fetchScheduleBlocks({
      viewerRole: input.viewerRole,
      viewerCode: input.viewerCode,
      query: {
        start,
        end,
        scopeType: 'crew',
        scopeId: crewId,
        scopeIds: [crewId],
        testMode: input.query.testMode,
        limit: 500,
      },
    });

    const exportBlocks: ScheduleCrewDailyExportBlock[] = blocks
      .map((block) => {
        const tasks: ScheduleCrewDailyExportTask[] = block.tasks
          .slice()
          .sort((left, right) => left.sequence - right.sequence || left.taskId.localeCompare(right.taskId))
          .map((task) => ({
            taskId: task.taskId,
            sequence: task.sequence,
            title: task.title,
            description: task.description,
            areaName: task.areaName,
            estimatedMinutes: task.estimatedMinutes,
            status: task.status,
            taskType: task.taskType,
            categoryLabel: formatCategoryLabel(task.catalogItemType || task.taskType || 'General'),
            requiredTools: task.requiredTools,
            requiredProducts: task.requiredProducts,
          }));

        return {
          blockId: block.blockId,
          blockType: block.blockType,
          title: block.title,
          description: block.description,
          status: block.status,
          priority: block.priority,
          startAt: block.startAt,
          endAt: block.endAt,
          timezone: block.timezone,
          buildingName: block.buildingName,
          areaName: block.areaName,
          centerId: block.centerId,
          centerName:
            block.centerId === crewScope.relationships.center?.id
              ? crewScope.relationships.center?.name ?? null
              : null,
          sourceType: block.sourceType,
          sourceId: block.sourceId,
          tasks,
        };
      })
      .sort((left, right) => left.startAt.localeCompare(right.startAt) || left.blockId.localeCompare(right.blockId));

    const taskCount = exportBlocks.reduce((total, block) => total + block.tasks.length, 0);
    const completedTaskCount = exportBlocks.reduce(
      (total, block) => total + block.tasks.filter((task) => task.status === 'completed').length,
      0,
    );
    const scheduledMinutes = exportBlocks.reduce(
      (total, block) => total + block.tasks.reduce((blockMinutes, task) => blockMinutes + (task.estimatedMinutes ?? 0), 0),
      0,
    );

    return {
      date: input.query.date,
      crewId: crewScope.cksCode,
      crewName: (await resolveCrewDisplayName(crewScope.cksCode, crewScope.relationships.center?.id)) ?? crewScope.cksCode,
      centerId: crewScope.relationships.center?.id ?? null,
      centerName: crewScope.relationships.center?.name ?? null,
      generatedAt: new Date().toISOString(),
      summary: {
        blockCount: exportBlocks.length,
        taskCount,
        completedTaskCount,
        scheduledMinutes,
      },
      blocks: exportBlocks,
    };
  } catch (error) {
    if (isScheduleInfraUnavailable(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchEcosystemSummaryExport(input: {
  viewerRole: HubRole;
  viewerCode: string | null;
  query: {
    weekStart: string;
    scopeType?: ScheduleReadQuery['scopeType'];
    scopeId?: string;
    scopeIds?: string[];
    testMode?: ScheduleReadQuery['testMode'];
  };
}): Promise<ScheduleEcosystemSummaryResponse | null> {
  try {
    const weekStartDate = new Date(`${input.query.weekStart}T00:00:00.000Z`);
    if (Number.isNaN(weekStartDate.getTime())) {
      return null;
    }
    const weekEndDate = new Date(weekStartDate.getTime());
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    const blocks = await fetchScheduleBlocks({
      viewerRole: input.viewerRole,
      viewerCode: input.viewerCode,
      query: {
        start: weekStartDate.toISOString(),
        end: weekEndDate.toISOString(),
        scopeType: input.query.scopeType,
        scopeId: input.query.scopeId,
        scopeIds: input.query.scopeIds,
        testMode: input.query.testMode,
        limit: 500,
      },
    });

    const buildingMap = new Map<string, ScheduleEcosystemSummaryBuilding>();
    const crewMap = new Map<string, { row: ScheduleEcosystemSummaryCrew; buildingSet: Set<string> }>();
    const statusBreakdown: Record<'scheduled' | 'in_progress' | 'completed' | 'cancelled', number> = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    let totalTaskCount = 0;
    let totalScheduledMinutes = 0;
    let assignedBlockCount = 0;
    let unassignedBlockCount = 0;

    const crewLabelCache = new Map<string, string | null>();

    for (const block of blocks) {
      statusBreakdown[block.status] += 1;
      const blockTaskCount = block.tasks.length;
      const blockScheduledMinutes = block.tasks.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0);
      totalTaskCount += blockTaskCount;
      totalScheduledMinutes += blockScheduledMinutes;

      const buildingName = block.buildingName || block.centerId || block.scopeId || 'Unassigned location';
      const areaName = block.areaName ?? null;
      const buildingKey = `${buildingName}::${areaName ?? ''}`;
      let building = buildingMap.get(buildingKey);
      if (!building) {
        building = {
          buildingName,
          areaName,
          blockCount: 0,
          taskCount: 0,
          assignedBlockCount: 0,
          unassignedBlockCount: 0,
          scheduledMinutes: 0,
          crews: [],
        };
        buildingMap.set(buildingKey, building);
      }

      building.blockCount += 1;
      building.taskCount += blockTaskCount;
      building.scheduledMinutes += blockScheduledMinutes;

      const crewAssignments = block.assignments.filter(
        (assignment) => assignment.participantRole === 'crew' && assignment.assignmentType === 'assignee',
      );

      if (!crewAssignments.length) {
        building.unassignedBlockCount += 1;
        unassignedBlockCount += 1;
        continue;
      }

      building.assignedBlockCount += 1;
      assignedBlockCount += 1;

      for (const assignment of crewAssignments) {
        const crewId = assignment.participantId;
        const cachedLabel = crewLabelCache.has(crewId)
          ? crewLabelCache.get(crewId) ?? null
          : await resolveCrewDisplayName(crewId, block.centerId);
        crewLabelCache.set(crewId, cachedLabel ?? null);

        let buildingCrew = building.crews.find((entry) => entry.crewId === crewId);
        if (!buildingCrew) {
          buildingCrew = {
            crewId,
            crewLabel: cachedLabel ?? null,
            blockCount: 0,
            taskCount: 0,
            scheduledMinutes: 0,
          } satisfies ScheduleEcosystemSummaryBuildingCrew;
          building.crews.push(buildingCrew);
        }
        buildingCrew.blockCount += 1;
        buildingCrew.taskCount += blockTaskCount;
        buildingCrew.scheduledMinutes += blockScheduledMinutes;

        const crewEntry = crewMap.get(crewId);
        if (!crewEntry) {
          crewMap.set(crewId, {
            row: {
              crewId,
              crewLabel: cachedLabel ?? null,
              blockCount: 1,
              taskCount: blockTaskCount,
              scheduledMinutes: blockScheduledMinutes,
              buildings: [buildingName],
            },
            buildingSet: new Set([buildingName]),
          });
        } else {
          crewEntry.row.blockCount += 1;
          crewEntry.row.taskCount += blockTaskCount;
          crewEntry.row.scheduledMinutes += blockScheduledMinutes;
          crewEntry.buildingSet.add(buildingName);
        }
      }
    }

    const buildings = Array.from(buildingMap.values())
      .map((building) => ({
        ...building,
        crews: [...building.crews].sort((left, right) => {
          const leftLabel = left.crewLabel ?? left.crewId;
          const rightLabel = right.crewLabel ?? right.crewId;
          return leftLabel.localeCompare(rightLabel);
        }),
      }))
      .sort((left, right) => left.buildingName.localeCompare(right.buildingName));

    const crews = Array.from(crewMap.values())
      .map(({ row, buildingSet }) => ({
        ...row,
        buildings: Array.from(buildingSet).sort((left, right) => left.localeCompare(right)),
      }))
      .sort((left, right) => {
        const leftLabel = left.crewLabel ?? left.crewId;
        const rightLabel = right.crewLabel ?? right.crewId;
        return leftLabel.localeCompare(rightLabel);
      });

    return {
      weekStart: input.query.weekStart,
      weekEnd,
      scopeType: input.query.scopeType,
      scopeId: input.query.scopeId,
      generatedAt: new Date().toISOString(),
      summary: {
        buildingCount: buildings.length,
        crewCount: crews.length,
        blockCount: blocks.length,
        taskCount: totalTaskCount,
        assignedBlockCount,
        unassignedBlockCount,
        scheduledMinutes: totalScheduledMinutes,
        statusBreakdown,
      },
      buildings,
      crews,
    };
  } catch (error) {
    if (isScheduleInfraUnavailable(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchBuildingWeeklyExport(input: {
  viewerRole: HubRole;
  viewerCode: string | null;
  query: {
    weekStart: string;
    buildingName: string;
    areaName?: string;
    scopeType?: ScheduleReadQuery['scopeType'];
    scopeId?: string;
    scopeIds?: string[];
    testMode?: ScheduleReadQuery['testMode'];
  };
}): Promise<ScheduleBuildingWeeklyExportResponse | null> {
  try {
    const weekStartDate = new Date(`${input.query.weekStart}T00:00:00.000Z`);
    if (Number.isNaN(weekStartDate.getTime())) {
      return null;
    }
    const weekEndDate = new Date(weekStartDate.getTime());
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    const blocks = await fetchScheduleBlocks({
      viewerRole: input.viewerRole,
      viewerCode: input.viewerCode,
      query: {
        start: weekStartDate.toISOString(),
        end: weekEndDate.toISOString(),
        scopeType: input.query.scopeType,
        scopeId: input.query.scopeId,
        scopeIds: input.query.scopeIds,
        testMode: input.query.testMode,
        limit: 500,
      },
    });

    const buildingNameKey = normalizeTextKey(input.query.buildingName);
    const areaNameKey = normalizeTextKey(input.query.areaName ?? null);
    const filteredBlocks = blocks.filter((block) => {
      if (normalizeTextKey(block.buildingName) !== buildingNameKey) {
        return false;
      }
      if (areaNameKey && normalizeTextKey(block.areaName) !== areaNameKey) {
        return false;
      }
      return true;
    });

    const dayBuckets = new Map<string, ScheduleBuildingWeeklyExportDay>();
    let assignedBlockCount = 0;
    let unassignedBlockCount = 0;
    let totalTaskCount = 0;

    for (let index = 0; index < 7; index += 1) {
      const currentDate = new Date(weekStartDate.getTime());
      currentDate.setUTCDate(currentDate.getUTCDate() + index);
      const date = currentDate.toISOString().slice(0, 10);
      dayBuckets.set(date, {
        date,
        weekdayLabel: currentDate.toLocaleDateString('en-CA', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        }),
        blockCount: 0,
        taskCount: 0,
        lanes: [],
        unassignedBlocks: [],
      });
    }

    for (const block of filteredBlocks.sort((left, right) => left.startAt.localeCompare(right.startAt) || left.blockId.localeCompare(right.blockId))) {
      const dateKey = block.startAt.slice(0, 10);
      const day = dayBuckets.get(dateKey);
      if (!day) {
        continue;
      }
      const exportBlock = mapBuildingWeeklyBlock(block);
      const laneMeta = primaryLaneForBlock(block);
      day.blockCount += 1;
      day.taskCount += exportBlock.tasks.length;
      totalTaskCount += exportBlock.tasks.length;

      if (!laneMeta.participantId || !laneMeta.participantRole) {
        day.unassignedBlocks.push(exportBlock);
        unassignedBlockCount += 1;
        continue;
      }

      let lane = day.lanes.find((entry) => entry.laneId === laneMeta.laneId);
      if (!lane) {
        lane = {
          laneId: laneMeta.laneId,
          participantId: laneMeta.participantId,
          participantRole: laneMeta.participantRole,
          blocks: [],
        } satisfies ScheduleBuildingWeeklyExportLane;
        day.lanes.push(lane);
      }
      lane.blocks.push(exportBlock);
      assignedBlockCount += 1;
    }

    const days = Array.from(dayBuckets.values()).map((day) => ({
      ...day,
      lanes: [...day.lanes].sort((left, right) => {
        const leftLabel = `${left.participantRole ?? ''}:${left.participantId ?? ''}`;
        const rightLabel = `${right.participantRole ?? ''}:${right.participantId ?? ''}`;
        return leftLabel.localeCompare(rightLabel);
      }),
      unassignedBlocks: [...day.unassignedBlocks],
    }));

    return {
      weekStart: input.query.weekStart,
      weekEnd,
      buildingName: input.query.buildingName.trim(),
      areaName: input.query.areaName?.trim() || null,
      scopeType: input.query.scopeType,
      scopeId: input.query.scopeId,
      generatedAt: new Date().toISOString(),
      summary: {
        dayCount: days.length,
        blockCount: filteredBlocks.length,
        taskCount: totalTaskCount,
        assignedBlockCount,
        unassignedBlockCount,
      },
      days,
    };
  } catch (error) {
    if (isScheduleInfraUnavailable(error)) {
      return null;
    }
    throw error;
  }
}

export async function cancelBlocksForSource(input: CancelScheduleBlocksBySourceInput): Promise<string[]> {
  const blockIds = await cancelScheduleBlocksBySource(input);
  for (const blockId of blockIds) {
    await syncScheduleBlockCalendarProjectionSafely(blockId);
  }
  return blockIds;
}
