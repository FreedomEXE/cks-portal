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
    apiFetch<ApiResponse<ScheduleDayPlanResponse>>(path, { getToken }).then((response) => response.data),
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
  return response.data;
}
