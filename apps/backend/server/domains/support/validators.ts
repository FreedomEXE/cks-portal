/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import { z } from 'zod';

export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const ticketStatusSchema = z.enum([
  'open',
  'in_progress',
  'waiting_on_user',
  'escalated',
  'resolved',
  'closed',
  'cancelled',
]);

export const createTicketSchema = z.object({
  issueType: z.string().trim().min(1).max(100),
  priority: ticketPrioritySchema.default('MEDIUM'),
  subject: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  stepsToReproduce: z.string().trim().max(300).optional(),
  screenshotUrl: z.string().trim().max(2000).optional(),
});

export const ticketIdParamsSchema = z.object({
  ticketId: z.string().trim().min(1),
});

export const ticketIdOrIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const cksCodeParamsSchema = z.object({
  cksCode: z.string().trim().min(1),
});

export const resolveTicketSchema = z.object({
  resolution_notes: z.string().trim().max(2000).optional(),
  action_taken: z.string().trim().max(2000).optional(),
});

export const updateTicketStatusSchema = z.object({
  status: ticketStatusSchema,
  notes: z.string().trim().max(2000).optional(),
  actionTaken: z.string().trim().max(2000).optional(),
});

export const assignTicketSchema = z.object({
  assigneeId: z.string().trim().min(1).max(64),
});

export const reopenTicketSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

export const addCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  isInternal: z.boolean().optional().default(false),
});

export const commentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().trim().optional(),
});
