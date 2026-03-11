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
