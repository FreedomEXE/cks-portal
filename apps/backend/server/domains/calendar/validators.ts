/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: validators.ts
 *
 * Description:
 * Request validators for the calendar API.
 *
 * Responsibilities:
 * - Validate query and param payloads for read-only calendar routes
 *
 * Role in system:
 * - Used by calendar route handlers
 *
 * Notes:
 * - Calendar mutations are intentionally out of scope
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { z } from 'zod';

export const calendarScopeTypeSchema = z.enum(['user', 'center', 'service', 'crew', 'order', 'warehouse']);

export const calendarEventsQuerySchema = z.object({
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
  scopeType: calendarScopeTypeSchema.optional(),
  scopeId: z.string().trim().min(1).optional(),
  eventTypes: z.union([z.string().trim().min(1), z.array(z.string().trim().min(1))]).optional(),
  statuses: z.union([z.string().trim().min(1), z.array(z.string().trim().min(1))]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const calendarAgendaQuerySchema = z.object({
  start: z.string().trim().min(1).optional(),
  end: z.string().trim().min(1).optional(),
  days: z.coerce.number().int().min(1).max(90).optional(),
  scopeType: calendarScopeTypeSchema.optional(),
  scopeId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const calendarEventParamsSchema = z.object({
  eventId: z.string().trim().min(1),
});
