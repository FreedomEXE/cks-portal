import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { hasActionAccess } from '../access/service';
import type { HubRole } from '../profile/types';
import {
  createSupportTicket,
  getHubSupportTickets,
  getSupportTicketDetailsForModal,
  resolveSupportTicket,
} from './repository';
import { query } from '../../db/connection';

const createTicketSchema = z.object({
  issueType: z.string().trim().min(1).max(100),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  subject: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  stepsToReproduce: z.string().trim().max(300).optional(),
  screenshotUrl: z.string().trim().max(2000).optional(),
});

const paramsSchema = z.object({
  cksCode: z.string().trim().min(1),
});

const ticketIdParams = z.object({
  ticketId: z.string().trim().min(1),
});

const resolveParams = z.object({
  id: z.string().trim().min(1),
});

const resolveBodySchema = z.object({
  resolution_notes: z.string().trim().max(2000).optional(),
  action_taken: z.string().trim().max(2000).optional(),
});

function isResolverRole(role: string): boolean {
  const normalized = role.toLowerCase();
  return normalized === 'admin' || normalized === 'manager' || normalized === 'warehouse';
}

export async function registerSupportRoutes(server: FastifyInstance) {
  server.post('/api/support/tickets', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    if (!account.isAdmin && account.cksCode) {
      const allowed = await hasActionAccess(account.role, account.cksCode);
      if (!allowed) {
        reply.code(403).send({ error: 'Account access is locked', reason: 'access_locked' });
        return;
      }
    }

    const parsed = createTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid support ticket payload', details: parsed.error.flatten() });
      return;
    }

    const created = await createSupportTicket({
      issueType: parsed.data.issueType,
      priority: parsed.data.priority,
      subject: parsed.data.subject,
      description: parsed.data.description,
      stepsToReproduce: parsed.data.stepsToReproduce ?? null,
      screenshotUrl: parsed.data.screenshotUrl ?? null,
      createdByRole: account.role as HubRole,
      createdById: account.cksCode || (account.isAdmin ? 'ADMIN' : ''),
    });

    const actorId = account.cksCode || (account.isAdmin ? 'ADMIN' : '');

    await query(
      `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `Submitted support ticket ${created.id}`,
        'support_ticket_created',
        actorId,
        account.role,
        created.id,
        'support_ticket',
        JSON.stringify({
          issueType: created.issueType,
          priority: created.priority,
          createdById: account.cksCode ?? null,
        }),
      ]
    );

    reply.code(201).send({ data: { id: created.id } });
  });

  server.get('/api/hub/support/:cksCode', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid cksCode' });
      return;
    }

    const payload = await getHubSupportTickets(account.role as HubRole, parsedParams.data.cksCode);
    if (!payload) {
      reply.code(404).send({ error: 'Support tickets not found' });
      return;
    }

    reply.send({ data: payload });
  });

  server.get('/api/support/tickets/:ticketId/details', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const parsedParams = ticketIdParams.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const ticket = await getSupportTicketDetailsForModal(
      account.role as HubRole,
      account.cksCode ?? '',
      parsedParams.data.ticketId
    );
    if (!ticket) {
      reply.code(404).send({ error: 'Support ticket not found or access denied' });
      return;
    }

    reply.send({ data: ticket });
  });

  server.post('/api/support/tickets/:id/resolve', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    if (!isResolverRole(account.role)) {
      reply.code(403).send({ error: 'Only admin, managers, and warehouses can resolve support tickets' });
      return;
    }

    const actorId = account.cksCode || (account.isAdmin ? 'ADMIN' : '');
    const parsedParams = resolveParams.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const parsedBody = resolveBodySchema.safeParse(request.body);
    const updated = await resolveSupportTicket(
      account.role as HubRole,
      account.cksCode ?? '',
      parsedParams.data.id,
      {
        resolutionNotes: parsedBody.success ? parsedBody.data.resolution_notes : undefined,
        actionTaken: parsedBody.success ? parsedBody.data.action_taken : undefined,
      }
    );

    if (!updated) {
      reply.code(404).send({ error: 'Support ticket not found or access denied' });
      return;
    }

    await query(
      `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `Resolved support ticket ${updated.id}`,
        'support_ticket_resolved',
        actorId,
        account.role,
        updated.id,
        'support_ticket',
        JSON.stringify({
          resolvedBy: account.cksCode ?? null,
          resolutionNotes: updated.resolutionNotes,
          actionTaken: updated.actionTaken,
        }),
      ]
    );

    reply.send({ data: { id: updated.id, status: 'resolved' } });
  });
}
