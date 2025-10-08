import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubReports } from './store';
import { createReport, createFeedback, updateReportStatus, updateFeedbackStatus } from './repository';
import type { HubRole } from '../profile/types';

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
    await updateReportStatus(params.data.id, 'acknowledged');
    reply.send({ data: { id: params.data.id, status: 'acknowledged' } });
  });

  fastify.post('/reports/:id/resolve', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;
    const params = reportIdParams.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid report identifier' });
      return;
    }
    await updateReportStatus(params.data.id, 'closed');
    reply.send({ data: { id: params.data.id, status: 'closed' } });
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
    await updateFeedbackStatus(params.data.id, 'acknowledged');
    reply.send({ data: { id: params.data.id, status: 'acknowledged' } });
  });

  fastify.post('/feedback/:id/resolve', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;
    const params = reportIdParams.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid feedback identifier' });
      return;
    }
    await updateFeedbackStatus(params.data.id, 'resolved');
    reply.send({ data: { id: params.data.id, status: 'resolved' } });
  });
}
