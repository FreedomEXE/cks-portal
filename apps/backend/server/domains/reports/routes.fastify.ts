import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubReports } from './store';
import { createReport, createFeedback, updateReportStatus, updateFeedbackStatus, acknowledgeReport, acknowledgeFeedback } from './repository';
import type { HubRole } from '../profile/types';
import { query } from '../../db/connection';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get('/hub/reports/:cksCode', async (request, reply) => {
    const user = await requireActiveRole(request, reply);
    if (!user) {
      return;
    }

    const { cksCode } = request.params as { cksCode: string };

    const reports = await getHubReports(user.role as HubRole, cksCode);
    if (!reports) {
      return reply.code(404).send({ error: 'Reports not found' });
    }

    return reply.send({ data: reports });
  });

  // Create a new report (issue/problem)
  fastify.post('/reports', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const schema = z.object({
      title: z.string().trim().min(1).max(255),
      description: z.string().trim().min(1).max(2000),
      // UI category maps to a normalized type string (snake_case)
      type: z.string().trim().min(1).max(50).optional(),
      severity: z.string().trim().min(1).max(20).optional(),
      centerId: z.string().trim().min(1).optional(),
      customerId: z.string().trim().min(1).optional(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid report payload', details: body.error.flatten() });
      return;
    }

    const payload = body.data;
    const created = await createReport({
      title: payload.title,
      description: payload.description,
      type: payload.type ?? 'other',
      severity: payload.severity ?? 'medium',
      centerId: payload.centerId ?? null,
      customerId: payload.customerId ?? null,
      createdByRole: account.role,
      createdById: account.cksCode ?? '',
    });
    reply.code(201).send({ data: { id: created.id } });
  });

  // Create a new feedback entry
  fastify.post('/feedback', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const schema = z.object({
      title: z.string().trim().min(1).max(255),
      message: z.string().trim().min(1).max(2000),
      kind: z.string().trim().min(1).max(50),
      centerId: z.string().trim().min(1).optional(),
      customerId: z.string().trim().min(1).optional(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid feedback payload', details: body.error.flatten() });
      return;
    }

    const payload = body.data;
    const created = await createFeedback({
      title: payload.title,
      message: payload.message,
      kind: payload.kind,
      centerId: payload.centerId ?? null,
      customerId: payload.customerId ?? null,
      createdByRole: account.role,
      createdById: account.cksCode ?? '',
    });
    reply.code(201).send({ data: { id: created.id } });
  });

  // Acknowledge/Resolve actions for reports
  const reportIdParams = z.object({ id: z.string().trim().min(1) });

  fastify.post('/reports/:id/acknowledge', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;
    const params = reportIdParams.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid report identifier' });
      return;
    }

    // Check if user is the creator - creators don't need to acknowledge their own reports
    const reportCheck = await query('SELECT created_by_id FROM reports WHERE report_id = $1', [params.data.id]);
    if (reportCheck.rows[0]?.created_by_id?.toUpperCase() === account.cksCode?.toUpperCase()) {
      reply.code(400).send({ error: 'Creators cannot acknowledge their own reports' });
      return;
    }

    // Add acknowledgment for this user instead of changing global status
    await acknowledgeReport(params.data.id, account.cksCode ?? '', account.role);
    reply.send({ data: { id: params.data.id, acknowledged: true } });
  });

  fastify.post('/reports/:id/resolve', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;

    // Only managers and warehouses can resolve reports
    if (account.role.toLowerCase() !== 'manager' && account.role.toLowerCase() !== 'warehouse') {
      reply.code(403).send({ error: 'Only managers and warehouses can resolve reports' });
      return;
    }

    const params = reportIdParams.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid report identifier' });
      return;
    }

    const bodySchema = z.object({
      resolution_notes: z.string().trim().max(2000).optional()
    });
    const body = bodySchema.safeParse(request.body);
    const resolutionNotes = body.success ? body.data.resolution_notes : undefined;

    await updateReportStatus(params.data.id, 'resolved', account.cksCode ?? '', resolutionNotes);
    reply.send({ data: { id: params.data.id, status: 'resolved' } });
  });

  // Acknowledge/Resolve actions for feedback
  fastify.post('/feedback/:id/acknowledge', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;
    const params = reportIdParams.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid feedback identifier' });
      return;
    }

    // Check if user is the creator - creators don't need to acknowledge their own feedback
    const feedbackCheck = await query('SELECT created_by_id FROM feedback WHERE feedback_id = $1', [params.data.id]);
    if (feedbackCheck.rows[0]?.created_by_id?.toUpperCase() === account.cksCode?.toUpperCase()) {
      reply.code(400).send({ error: 'Creators cannot acknowledge their own feedback' });
      return;
    }

    // Add acknowledgment for this user instead of changing global status
    await acknowledgeFeedback(params.data.id, account.cksCode ?? '', account.role);
    reply.send({ data: { id: params.data.id, acknowledged: true } });
  });

}
