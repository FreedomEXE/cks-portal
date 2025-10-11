import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubReports } from './store';
import { createReport, createFeedback, updateReportStatus, updateFeedbackStatus, acknowledgeReport, acknowledgeFeedback, getServicesForReports, getOrdersForReports, getProceduresForReports } from './repository';
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
      // Legacy fields (for old text-based reports)
      title: z.string().trim().min(1).max(255).optional(),
      description: z.string().trim().min(1).max(2000).optional(),
      type: z.string().trim().min(1).max(50).optional(),
      severity: z.string().trim().min(1).max(20).optional(),
      centerId: z.string().trim().min(1).optional(),
      customerId: z.string().trim().min(1).optional(),
      // New structured fields (for dropdown-based reports)
      reportCategory: z.enum(['service', 'order', 'procedure']).optional(),
      relatedEntityId: z.string().trim().min(1).max(64).optional(),
      reportReason: z.string().trim().min(1).max(100).optional(),
      priority: z.enum(['LOW','MEDIUM','HIGH']).optional(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid report payload', details: body.error.flatten() });
      return;
    }

    const payload = body.data;

    // Auto-generate title and description from structured fields if provided
    let title = payload.title || '';
    let description = payload.description || '';

    if (payload.reportCategory && payload.relatedEntityId && payload.reportReason) {
      // Structured report: auto-generate simple title, detailed description
      title = payload.reportReason;
      description = `Structured report for ${payload.reportCategory}: ${payload.relatedEntityId}. Reason: ${payload.reportReason}`;
    }

    const created = await createReport({
      title: title || 'Untitled Report',
      description: description || 'No description provided',
      type: payload.type ?? 'other',
      severity: payload.severity ?? 'medium',
      centerId: payload.centerId ?? null,
      customerId: payload.customerId ?? null,
      createdByRole: account.role,
      createdById: account.cksCode ?? '',
      reportCategory: payload.reportCategory ?? null,
      relatedEntityId: payload.relatedEntityId ?? null,
      reportReason: payload.reportReason ?? null,
      priority: payload.priority ?? null,
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
      // Structured + rating fields
      reportCategory: z.enum(['service', 'order', 'procedure']).optional(),
      relatedEntityId: z.string().trim().min(1).max(64).optional(),
      reportReason: z.string().trim().min(1).max(100).optional(),
      rating: z.number().int().min(1).max(5).optional(),
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
      reportCategory: payload.reportCategory ?? null,
      relatedEntityId: payload.relatedEntityId ?? null,
      reportReason: payload.reportReason ?? null,
      rating: payload.rating ?? null,
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

    // Check if resolver has acknowledged first
    const ackCheck = await query('SELECT 1 FROM report_acknowledgments WHERE report_id = $1 AND UPPER(acknowledged_by_id) = UPPER($2)', [params.data.id, account.cksCode ?? '']);
    if (ackCheck.rows.length === 0) {
      reply.code(400).send({ error: 'You must acknowledge the report before resolving it' });
      return;
    }

    // Check category-based resolution permissions (defense-in-depth)
    const reportCheck = await query('SELECT report_category, related_entity_id FROM reports WHERE report_id = $1', [params.data.id]);
    const reportCategory = reportCheck.rows[0]?.report_category as string | null;
    const relatedEntityId = reportCheck.rows[0]?.related_entity_id as string | null;

    if (reportCategory === 'order') {
      if (account.role.toLowerCase() !== 'warehouse') {
        reply.code(403).send({ error: 'Only warehouse can resolve order reports' });
        return;
      }
    } else if (reportCategory === 'service') {
      // Determine if the service is warehouse-managed by checking services.managed_by
      let managedBy: string | null = null;
      if (relatedEntityId) {
        const svc = await query<{ managed_by: string | null }>('SELECT managed_by FROM services WHERE UPPER(service_id) = UPPER($1)', [relatedEntityId]);
        managedBy = svc.rows[0]?.managed_by ?? null;
      }
      const isWarehouseManaged = !!managedBy && (managedBy.toLowerCase() === 'warehouse' || managedBy.toUpperCase().startsWith('WHS-'));
      if (isWarehouseManaged) {
        if (account.role.toLowerCase() !== 'warehouse') {
          reply.code(403).send({ error: 'Only warehouse can resolve warehouse-managed service reports' });
          return;
        }
      } else {
        if (account.role.toLowerCase() !== 'manager') {
          reply.code(403).send({ error: 'Only manager can resolve manager-managed service reports' });
          return;
        }
      }
    } else if (reportCategory === 'procedure') {
      if (account.role.toLowerCase() !== 'manager') {
        reply.code(403).send({ error: 'Only manager can resolve procedure reports' });
        return;
      }
    }

    const bodySchema = z.object({
      resolution_notes: z.string().trim().max(2000).optional(),
      action_taken: z.string().trim().max(2000).optional()
    });
    const body = bodySchema.safeParse(request.body);
    const resolutionNotes = body.success ? body.data.resolution_notes : undefined;
    const actionTaken = body.success ? body.data.action_taken : undefined;

    await updateReportStatus(params.data.id, 'resolved', account.cksCode ?? '', resolutionNotes, actionTaken);
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

  // Endpoints for fetching entities to populate dropdowns when creating structured reports/feedback
  // Endpoints for fetching entities to populate dropdowns when creating structured reports/feedback
  fastify.get('/reports/entities/services', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;

    const services = await getServicesForReports(account.cksCode ?? '', account.role as HubRole);
    reply.send({ data: services });
  });

  fastify.get('/reports/entities/orders', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;

    const orders = await getOrdersForReports(account.cksCode ?? '', account.role as HubRole);
    reply.send({ data: orders });
  });

  fastify.get('/reports/entities/procedures', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) return;

    const procedures = await getProceduresForReports(account.cksCode ?? '');
    reply.send({ data: procedures });
  });

}
