/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: schedule.ts
 *
 * Description:
 * Frontend API hooks for the Schedule workspace.
 *
 * Responsibilities:
 * - Define schedule day-plan and block DTOs
 * - Fetch day-plan data and save schedule blocks
 *
 * Role in system:
 * - Used by the Schedule day-plan workspace
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import useSWR from 'swr';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch, type ApiResponse } from './client';

export interface ScheduleBlockAssignment {
  assignmentId: number;
  blockId: string;
  participantId: string;
  participantRole: string;
  assignmentType: string;
  isPrimary: boolean;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ScheduleBlockTask {
  taskId: string;
  blockId: string;
  sequence: number;
  taskType: string;
  catalogItemCode: string | null;
  catalogItemType: string | null;
  title: string;
  description: string | null;
  areaName: string | null;
  estimatedMinutes: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';
  version: number;
  requiredTools: string[];
  requiredProducts: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ScheduleBlockDetail {
  blockId: string;
  scopeType: string;
  scopeId: string;
  centerId: string | null;
  warehouseId: string | null;
  buildingName: string | null;
  areaName: string | null;
  startAt: string;
  endAt: string | null;
  timezone: string;
  blockType: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sourceType: string | null;
  sourceId: string | null;
  sourceAction: string | null;
  templateId: string | null;
  recurrenceRule: string | null;
  seriesParentId: string | null;
  occurrenceIndex: number | null;
  generatorKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
  version: number;
  archivedAt: string | null;
  archivedBy: string | null;
  assignments: ScheduleBlockAssignment[];
  tasks: ScheduleBlockTask[];
}

export interface ScheduleDayPlanLane {
  laneId: string;
  participantId: string | null;
  participantRole: string | null;
  blocks: ScheduleBlockDetail[];
}

export interface ScheduleDayPlanBuilding {
  buildingKey: string;
  buildingName: string;
  areaName: string | null;
  lanes: ScheduleDayPlanLane[];
  unassignedBlocks: ScheduleBlockDetail[];
}

export interface ScheduleDayPlanResponse {
  date: string;
  scopeType?: string;
  scopeId?: string;
  scopeIds: string[];
  summary: {
    blockCount: number;
    assignedBlockCount: number;
    unassignedBlockCount: number;
    taskCount: number;
  };
  buildings: ScheduleDayPlanBuilding[];
}

export interface ScheduleCrewDailyExportTask {
  taskId: string;
  sequence: number;
  title: string;
  description: string | null;
  areaName: string | null;
  estimatedMinutes: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';
  taskType: string;
  categoryLabel: string;
  requiredTools: string[];
  requiredProducts: string[];
}

export interface ScheduleCrewDailyExportBlock {
  blockId: string;
  blockType: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startAt: string;
  endAt: string | null;
  timezone: string;
  buildingName: string | null;
  areaName: string | null;
  centerId: string | null;
  centerName: string | null;
  sourceType: string | null;
  sourceId: string | null;
  tasks: ScheduleCrewDailyExportTask[];
}

export interface ScheduleCrewDailyExportResponse {
  date: string;
  crewId: string;
  crewName: string | null;
  centerId: string | null;
  centerName: string | null;
  generatedAt: string;
  summary: {
    blockCount: number;
    taskCount: number;
    completedTaskCount: number;
    scheduledMinutes: number;
  };
  blocks: ScheduleCrewDailyExportBlock[];
}

export interface ScheduleBuildingWeeklyExportTask {
  taskId: string;
  sequence: number;
  title: string;
  description: string | null;
  areaName: string | null;
  estimatedMinutes: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';
  taskType: string;
  categoryLabel: string;
}

export interface ScheduleBuildingWeeklyExportBlock {
  blockId: string;
  blockType: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startAt: string;
  endAt: string | null;
  timezone: string;
  centerId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  tasks: ScheduleBuildingWeeklyExportTask[];
}

export interface ScheduleBuildingWeeklyExportLane {
  laneId: string;
  participantId: string | null;
  participantRole: string | null;
  blocks: ScheduleBuildingWeeklyExportBlock[];
}

export interface ScheduleBuildingWeeklyExportDay {
  date: string;
  weekdayLabel: string;
  blockCount: number;
  taskCount: number;
  lanes: ScheduleBuildingWeeklyExportLane[];
  unassignedBlocks: ScheduleBuildingWeeklyExportBlock[];
}

export interface ScheduleBuildingWeeklyExportResponse {
  weekStart: string;
  weekEnd: string;
  buildingName: string;
  areaName: string | null;
  scopeType?: string;
  scopeId?: string;
  generatedAt: string;
  summary: {
    dayCount: number;
    blockCount: number;
    taskCount: number;
    assignedBlockCount: number;
    unassignedBlockCount: number;
  };
  days: ScheduleBuildingWeeklyExportDay[];
}

export interface ScheduleEcosystemSummaryBuildingCrew {
  crewId: string;
  crewLabel: string | null;
  blockCount: number;
  taskCount: number;
  scheduledMinutes: number;
}

export interface ScheduleEcosystemSummaryBuilding {
  buildingName: string;
  areaName: string | null;
  blockCount: number;
  taskCount: number;
  assignedBlockCount: number;
  unassignedBlockCount: number;
  scheduledMinutes: number;
  crews: ScheduleEcosystemSummaryBuildingCrew[];
}

export interface ScheduleEcosystemSummaryCrew {
  crewId: string;
  crewLabel: string | null;
  blockCount: number;
  taskCount: number;
  scheduledMinutes: number;
  buildings: string[];
}

export interface ScheduleEcosystemSummaryResponse {
  weekStart: string;
  weekEnd: string;
  scopeType?: string;
  scopeId?: string;
  generatedAt: string;
  summary: {
    buildingCount: number;
    crewCount: number;
    blockCount: number;
    taskCount: number;
    assignedBlockCount: number;
    unassignedBlockCount: number;
    scheduledMinutes: number;
    statusBreakdown: Record<'scheduled' | 'in_progress' | 'completed' | 'cancelled', number>;
  };
  buildings: ScheduleEcosystemSummaryBuilding[];
  crews: ScheduleEcosystemSummaryCrew[];
}

export interface SaveScheduleBlockInput {
  blockId?: string;
  expectedVersion?: number | null;
  isTest?: boolean;
  scopeType: string;
  scopeId: string;
  centerId?: string | null;
  warehouseId?: string | null;
  buildingName?: string | null;
  areaName?: string | null;
  startAt: string;
  endAt?: string | null;
  timezone?: string;
  blockType: string;
  title: string;
  description?: string | null;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sourceType?: string | null;
  sourceId?: string | null;
  sourceAction?: string | null;
  templateId?: string | null;
  recurrenceRule?: string | null;
  seriesParentId?: string | null;
  occurrenceIndex?: number | null;
  generatorKey?: string;
  metadata?: Record<string, unknown>;
  assignments?: Array<{
    participantId: string;
    participantRole: string;
    assignmentType?: string;
    isPrimary?: boolean;
    status?: string;
    metadata?: Record<string, unknown>;
  }>;
  tasks?: Array<{
    taskId?: string;
    sequence?: number;
    version?: number;
    taskType?: string;
    catalogItemCode?: string | null;
    catalogItemType?: string | null;
    title: string;
    description?: string | null;
    areaName?: string | null;
    estimatedMinutes?: number | null;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';
    requiredTools?: string[];
    requiredProducts?: string[];
    metadata?: Record<string, unknown>;
  }>;
}

function buildQuery(params: Record<string, string | number | string[] | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      if (value.length) {
        search.set(key, value.join(','));
      }
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

const BLOCK_STATUSES = new Set<ScheduleBlockDetail['status']>(['scheduled', 'in_progress', 'completed', 'cancelled']);
const TASK_STATUSES = new Set<ScheduleBlockTask['status']>(['pending', 'in_progress', 'completed', 'cancelled', 'skipped']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function toStringValue(value: unknown, fallback = ''): string {
  return toNullableString(value) ?? fallback;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => toNullableString(entry)?.trim() ?? '')
    .filter((entry): entry is string => entry.length > 0);
}

function normalizeStatus<TStatus extends string>(value: unknown, allowed: Set<TStatus>, fallback: TStatus): TStatus {
  return typeof value === 'string' && allowed.has(value as TStatus) ? (value as TStatus) : fallback;
}

function normalizeScheduleAssignment(raw: unknown, blockId: string, index: number): ScheduleBlockAssignment | null {
  if (!isRecord(raw)) {
    return null;
  }

  return {
    assignmentId: toNumberOrNull(raw.assignmentId) ?? index + 1,
    blockId: toStringValue(raw.blockId, blockId),
    participantId: toStringValue(raw.participantId),
    participantRole: toStringValue(raw.participantRole),
    assignmentType: toStringValue(raw.assignmentType),
    isPrimary: raw.isPrimary === true,
    status: toStringValue(raw.status, 'assigned'),
    metadata: isRecord(raw.metadata) ? raw.metadata : {},
    createdAt: toStringValue(raw.createdAt),
    createdBy: toStringValue(raw.createdBy),
    updatedAt: toStringValue(raw.updatedAt),
    updatedBy: toNullableString(raw.updatedBy),
  };
}

function normalizeScheduleTask(raw: unknown, blockId: string, index: number): ScheduleBlockTask | null {
  if (!isRecord(raw)) {
    return null;
  }

  return {
    taskId: toStringValue(raw.taskId, `${blockId || 'schedule-block'}-task-${index + 1}`),
    blockId: toStringValue(raw.blockId, blockId),
    sequence: toNumberOrNull(raw.sequence) ?? index + 1,
    taskType: toStringValue(raw.taskType, 'general'),
    catalogItemCode: toNullableString(raw.catalogItemCode),
    catalogItemType: toNullableString(raw.catalogItemType),
    title: toStringValue(raw.title, `Task ${index + 1}`),
    description: toNullableString(raw.description),
    areaName: toNullableString(raw.areaName),
    estimatedMinutes: toNumberOrNull(raw.estimatedMinutes),
    status: normalizeStatus(raw.status, TASK_STATUSES, 'pending'),
    version: toNumberOrNull(raw.version) ?? 0,
    requiredTools: toStringArray(raw.requiredTools),
    requiredProducts: toStringArray(raw.requiredProducts),
    metadata: isRecord(raw.metadata) ? raw.metadata : {},
    createdAt: toStringValue(raw.createdAt),
    createdBy: toStringValue(raw.createdBy),
    updatedAt: toStringValue(raw.updatedAt),
    updatedBy: toNullableString(raw.updatedBy),
  };
}

function normalizeScheduleBlockDetail(raw: unknown, index = 0): ScheduleBlockDetail {
  const block = isRecord(raw) ? raw : {};
  const blockId = toStringValue(block.blockId, `schedule-block-${index + 1}`);

  return {
    blockId,
    scopeType: toStringValue(block.scopeType),
    scopeId: toStringValue(block.scopeId),
    centerId: toNullableString(block.centerId),
    warehouseId: toNullableString(block.warehouseId),
    buildingName: toNullableString(block.buildingName),
    areaName: toNullableString(block.areaName),
    startAt: toStringValue(block.startAt),
    endAt: toNullableString(block.endAt),
    timezone: toStringValue(block.timezone, 'UTC'),
    blockType: toStringValue(block.blockType, 'manual'),
    title: toStringValue(block.title, 'Untitled block'),
    description: toNullableString(block.description),
    status: normalizeStatus(block.status, BLOCK_STATUSES, 'scheduled'),
    priority: (() => {
      const value = toStringValue(block.priority, 'normal');
      return value === 'low' || value === 'normal' || value === 'high' || value === 'urgent' ? value : 'normal';
    })(),
    sourceType: toNullableString(block.sourceType),
    sourceId: toNullableString(block.sourceId),
    sourceAction: toNullableString(block.sourceAction),
    templateId: toNullableString(block.templateId),
    recurrenceRule: toNullableString(block.recurrenceRule),
    seriesParentId: toNullableString(block.seriesParentId),
    occurrenceIndex: toNumberOrNull(block.occurrenceIndex),
    generatorKey: toStringValue(block.generatorKey),
    metadata: isRecord(block.metadata) ? block.metadata : {},
    createdAt: toStringValue(block.createdAt),
    createdBy: toStringValue(block.createdBy),
    updatedAt: toStringValue(block.updatedAt),
    updatedBy: toNullableString(block.updatedBy),
    version: toNumberOrNull(block.version) ?? 0,
    archivedAt: toNullableString(block.archivedAt),
    archivedBy: toNullableString(block.archivedBy),
    assignments: Array.isArray(block.assignments)
      ? block.assignments
          .map((assignment, assignmentIndex) => normalizeScheduleAssignment(assignment, blockId, assignmentIndex))
          .filter((assignment): assignment is ScheduleBlockAssignment => assignment !== null)
      : [],
    tasks: Array.isArray(block.tasks)
      ? block.tasks
          .map((task, taskIndex) => normalizeScheduleTask(task, blockId, taskIndex))
          .filter((task): task is ScheduleBlockTask => task !== null)
      : [],
  };
}

function normalizeScheduleDayPlanResponse(raw: unknown): ScheduleDayPlanResponse {
  const response = isRecord(raw) ? raw : {};

  return {
    date: toStringValue(response.date),
    scopeType: toNullableString(response.scopeType) ?? undefined,
    scopeId: toNullableString(response.scopeId) ?? undefined,
    scopeIds: toStringArray(response.scopeIds),
    summary: {
      blockCount: toNumberOrNull(isRecord(response.summary) ? response.summary.blockCount : null) ?? 0,
      assignedBlockCount: toNumberOrNull(isRecord(response.summary) ? response.summary.assignedBlockCount : null) ?? 0,
      unassignedBlockCount: toNumberOrNull(isRecord(response.summary) ? response.summary.unassignedBlockCount : null) ?? 0,
      taskCount: toNumberOrNull(isRecord(response.summary) ? response.summary.taskCount : null) ?? 0,
    },
    buildings: Array.isArray(response.buildings)
      ? response.buildings
          .map((building, buildingIndex) => {
            if (!isRecord(building)) {
              return null;
            }
            return {
              buildingKey: toStringValue(building.buildingKey, `building-${buildingIndex + 1}`),
              buildingName: toStringValue(building.buildingName, `Building ${buildingIndex + 1}`),
              areaName: toNullableString(building.areaName),
              lanes: Array.isArray(building.lanes)
                ? building.lanes
                    .map((lane, laneIndex) => {
                      if (!isRecord(lane)) {
                        return null;
                      }
                      return {
                        laneId: toStringValue(lane.laneId, `lane-${laneIndex + 1}`),
                        participantId: toNullableString(lane.participantId),
                        participantRole: toNullableString(lane.participantRole),
                        blocks: Array.isArray(lane.blocks)
                          ? lane.blocks.map((block, blockIndex) => normalizeScheduleBlockDetail(block, blockIndex))
                          : [],
                      };
                    })
                    .filter((lane): lane is ScheduleDayPlanLane => lane !== null)
                : [],
              unassignedBlocks: Array.isArray(building.unassignedBlocks)
                ? building.unassignedBlocks.map((block, blockIndex) => normalizeScheduleBlockDetail(block, blockIndex))
                : [],
            };
          })
          .filter((building): building is ScheduleDayPlanBuilding => building !== null)
      : [],
  };
}

export function useScheduleDayPlan({
  date,
  scopeType,
  scopeId,
  scopeIds,
  testMode,
}: {
  date: string;
  scopeType?: string;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
}) {
  const { getToken } = useClerkAuth();
  const key = `/schedule/day-plan${buildQuery({ date, scopeType, scopeId, scopeIds, testMode })}`;
  return useSWR(key, (path: string) =>
    apiFetch<ApiResponse<ScheduleDayPlanResponse>>(path, { getToken }).then((response) => normalizeScheduleDayPlanResponse(response.data)),
  );
}

export async function saveScheduleBlock(input: SaveScheduleBlockInput) {
  const response = await apiFetch<ApiResponse<ScheduleBlockDetail>>(
    input.blockId ? `/schedule/blocks/${encodeURIComponent(input.blockId)}` : '/schedule/blocks',
    {
      method: input.blockId ? 'PATCH' : 'POST',
      body: JSON.stringify(input),
    },
  );
  return normalizeScheduleBlockDetail(response.data);
}

export async function fetchScheduleCrewDailyExport(input: {
  date: string;
  crewId: string;
  testMode?: 'include' | 'exclude' | 'only';
  getToken?: () => Promise<string | null>;
}) {
  const response = await apiFetch<ApiResponse<ScheduleCrewDailyExportResponse>>(
    `/schedule/export/crew-daily${buildQuery({
      date: input.date,
      crewId: input.crewId,
      testMode: input.testMode,
    })}`,
    { getToken: input.getToken },
  );
  return response.data;
}

export async function fetchScheduleBuildingWeeklyExport(input: {
  weekStart: string;
  buildingName: string;
  areaName?: string;
  scopeType?: string;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
  getToken?: () => Promise<string | null>;
}) {
  const response = await apiFetch<ApiResponse<ScheduleBuildingWeeklyExportResponse>>(
    `/schedule/export/building-weekly${buildQuery({
      weekStart: input.weekStart,
      buildingName: input.buildingName,
      areaName: input.areaName,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      scopeIds: input.scopeIds,
      testMode: input.testMode,
    })}`,
    { getToken: input.getToken },
  );
  return response.data;
}

export async function fetchScheduleEcosystemSummaryExport(input: {
  weekStart: string;
  scopeType?: string;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
  getToken?: () => Promise<string | null>;
}) {
  const response = await apiFetch<ApiResponse<ScheduleEcosystemSummaryResponse>>(
    `/schedule/export/ecosystem-summary${buildQuery({
      weekStart: input.weekStart,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      scopeIds: input.scopeIds,
      testMode: input.testMode,
    })}`,
    { getToken: input.getToken },
  );
  return response.data;
}
