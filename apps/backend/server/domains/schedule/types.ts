/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: types.ts
 *
 * Description:
 * Schedule domain types shared across store, service, and projection helpers.
 *
 * Responsibilities:
 * - Define schedule block, assignment, task, and template shapes
 * - Define internal write contracts for block upserts and source cancellation
 *
 * Role in system:
 * - Shared by the internal Schedule planning foundation
 *
 * Notes:
 * - Schedule blocks are authoritative planning records
 * - Calendar remains a read model projected from schedule blocks
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export type ScheduleScopeType =
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'warehouse'
  | 'service'
  | 'order'
  | 'user';

export type ScheduleBlockStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ScheduleTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';
export type SchedulePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ScheduleBlockAssignmentRecord {
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

export interface ScheduleBlockTaskRecord {
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
  status: ScheduleTaskStatus;
  version: number;
  requiredTools: string[];
  requiredProducts: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ScheduleBlockRecord {
  blockId: string;
  scopeType: ScheduleScopeType;
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
  status: ScheduleBlockStatus;
  priority: SchedulePriority;
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
}

export interface ScheduleTemplateRecord {
  templateId: string;
  scopeType: string;
  scopeId: string;
  name: string;
  rrule: string | null;
  defaultStartTime: string | null;
  defaultDurationMinutes: number | null;
  defaultAssignees: unknown[];
  templatePayload: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ScheduleBlockDetail extends ScheduleBlockRecord {
  assignments: ScheduleBlockAssignmentRecord[];
  tasks: ScheduleBlockTaskRecord[];
}

export interface UpsertScheduleBlockAssignmentInput {
  participantId: string;
  participantRole: string;
  assignmentType?: string;
  isPrimary?: boolean;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface UpsertScheduleBlockTaskInput {
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
  status?: ScheduleTaskStatus;
  requiredTools?: string[];
  requiredProducts?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpsertScheduleBlockInput {
  blockId?: string;
  expectedVersion?: number | null;
  isTest?: boolean;
  scopeType: ScheduleScopeType;
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
  status?: ScheduleBlockStatus;
  priority?: SchedulePriority;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceAction?: string | null;
  templateId?: string | null;
  recurrenceRule?: string | null;
  seriesParentId?: string | null;
  occurrenceIndex?: number | null;
  generatorKey?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string | null;
  assignments?: UpsertScheduleBlockAssignmentInput[];
  tasks?: UpsertScheduleBlockTaskInput[];
}

export interface ListScheduleBlocksQuery {
  start: string;
  end: string;
  scopeType?: ScheduleScopeType;
  scopeId?: string;
  centerId?: string;
  warehouseId?: string;
  statuses?: string[];
  limit?: number;
}

export interface CancelScheduleBlocksBySourceInput {
  sourceType: string;
  sourceId: string;
  updatedBy?: string | null;
}

export interface ScheduleReadQuery {
  start: string;
  end: string;
  scopeType?: ScheduleScopeType;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
  limit?: number;
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

export interface ScheduleDayPlanSummary {
  blockCount: number;
  assignedBlockCount: number;
  unassignedBlockCount: number;
  taskCount: number;
}

export interface ScheduleDayPlanResponse {
  date: string;
  scopeType?: ScheduleScopeType;
  scopeId?: string;
  scopeIds: string[];
  summary: ScheduleDayPlanSummary;
  buildings: ScheduleDayPlanBuilding[];
}

export interface ScheduleCrewDailyExportTask {
  taskId: string;
  sequence: number;
  title: string;
  description: string | null;
  areaName: string | null;
  estimatedMinutes: number | null;
  status: ScheduleTaskStatus;
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
  status: ScheduleBlockStatus;
  priority: SchedulePriority;
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
  status: ScheduleTaskStatus;
  taskType: string;
  categoryLabel: string;
}

export interface ScheduleBuildingWeeklyExportBlock {
  blockId: string;
  blockType: string;
  title: string;
  description: string | null;
  status: ScheduleBlockStatus;
  priority: SchedulePriority;
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
  scopeType?: ScheduleScopeType;
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
  scopeType?: ScheduleScopeType;
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
    statusBreakdown: Record<ScheduleBlockStatus, number>;
  };
  buildings: ScheduleEcosystemSummaryBuilding[];
  crews: ScheduleEcosystemSummaryCrew[];
}
