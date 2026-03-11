/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: validators.ts
 *
 * Description:
 * Request validators for the Schedule API.
 *
 * Responsibilities:
 * - Validate read and write payloads for Schedule routes
 *
 * Role in system:
 * - Used by schedule route handlers
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { z } from 'zod';

function parseScopeIds(value: unknown): string[] | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(',')).map((entry) => entry.trim()).filter(Boolean);
  }
  return String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
}

export const scheduleScopeTypeSchema = z.enum([
  'user',
  'manager',
  'contractor',
  'customer',
  'center',
  'service',
  'crew',
  'order',
  'warehouse',
]);

export const scheduleTestModeSchema = z.enum(['include', 'exclude', 'only']);

export const scheduleReadQuerySchema = z.object({
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
  scopeType: scheduleScopeTypeSchema.optional(),
  scopeId: z.string().trim().min(1).optional(),
  scopeIds: z.preprocess(parseScopeIds, z.array(z.string().trim().min(1)).max(500).optional()),
  testMode: scheduleTestModeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const scheduleDayPlanQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scopeType: scheduleScopeTypeSchema.optional(),
  scopeId: z.string().trim().min(1).optional(),
  scopeIds: z.preprocess(parseScopeIds, z.array(z.string().trim().min(1)).max(500).optional()),
  testMode: scheduleTestModeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const scheduleCrewDailyExportQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  crewId: z.string().trim().min(1),
  testMode: scheduleTestModeSchema.optional(),
});

export const scheduleBuildingWeeklyExportQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  buildingName: z.string().trim().min(1),
  areaName: z.string().trim().min(1).optional(),
  scopeType: scheduleScopeTypeSchema.optional(),
  scopeId: z.string().trim().min(1).optional(),
  scopeIds: z.preprocess(parseScopeIds, z.array(z.string().trim().min(1)).max(500).optional()),
  testMode: scheduleTestModeSchema.optional(),
});

export const scheduleBlockParamsSchema = z.object({
  blockId: z.string().trim().min(1),
});

const scheduleAssignmentInputSchema = z.object({
  participantId: z.string().trim().min(1),
  participantRole: z.string().trim().min(1),
  assignmentType: z.string().trim().min(1).optional(),
  isPrimary: z.boolean().optional(),
  status: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const scheduleTaskInputSchema = z.object({
  taskId: z.string().trim().min(1).optional(),
  sequence: z.coerce.number().int().min(1).optional(),
  version: z.coerce.number().int().min(1).optional(),
  taskType: z.string().trim().min(1).optional(),
  catalogItemCode: z.string().trim().min(1).nullable().optional(),
  catalogItemType: z.string().trim().min(1).nullable().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  areaName: z.string().trim().nullable().optional(),
  estimatedMinutes: z.coerce.number().int().min(0).nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'skipped']).optional(),
  requiredTools: z.array(z.string().trim().min(1)).optional(),
  requiredProducts: z.array(z.string().trim().min(1)).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const scheduleBlockBodySchema = z.object({
  blockId: z.string().trim().min(1).optional(),
  expectedVersion: z.coerce.number().int().min(1).nullable().optional(),
  isTest: z.boolean().optional(),
  scopeType: scheduleScopeTypeSchema,
  scopeId: z.string().trim().min(1),
  centerId: z.string().trim().min(1).nullable().optional(),
  warehouseId: z.string().trim().min(1).nullable().optional(),
  buildingName: z.string().trim().min(1).nullable().optional(),
  areaName: z.string().trim().min(1).nullable().optional(),
  startAt: z.string().trim().min(1),
  endAt: z.string().trim().min(1).nullable().optional(),
  timezone: z.string().trim().min(1).optional(),
  blockType: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  sourceType: z.string().trim().min(1).nullable().optional(),
  sourceId: z.string().trim().min(1).nullable().optional(),
  sourceAction: z.string().trim().min(1).nullable().optional(),
  templateId: z.string().trim().min(1).nullable().optional(),
  recurrenceRule: z.string().trim().min(1).nullable().optional(),
  seriesParentId: z.string().trim().min(1).nullable().optional(),
  occurrenceIndex: z.coerce.number().int().min(0).nullable().optional(),
  generatorKey: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  assignments: z.array(scheduleAssignmentInputSchema).optional(),
  tasks: z.array(scheduleTaskInputSchema).optional(),
});
