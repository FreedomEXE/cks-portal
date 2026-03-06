/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireActiveRole } from '../../core/auth/guards';
import { hasActionAccess } from '../access/service';
import type { HubRole } from '../profile/types';
import {
  addCommentSchema,
  assignTicketSchema,
  cksCodeParamsSchema,
  commentQuerySchema,
  createTicketSchema,
  reopenTicketSchema,
  resolveTicketSchema,
  ticketIdOrIdParamsSchema,
  ticketIdParamsSchema,
  updateTicketStatusSchema,
} from './validators';
import {
  addTicketCommentForActor,
  assignSupportTicketForActor,
  createSupportTicketForActor,
  getSupportTicketDetailsForActor,
  listSupportTicketsForHub,
  listTicketCommentsForActor,
  reopenSupportTicketForActor,
  resolveSupportTicketForActor,
  type SupportActor,
  SupportServiceError,
  unassignSupportTicketForActor,
  updateSupportTicketStatusForActor,
} from './service';

function toActor(account: { role: string; cksCode: string | null; isAdmin: boolean }): SupportActor {
  return {
    role: account.role as HubRole,
    cksCode: account.cksCode || (account.isAdmin ? 'ADMIN' : ''),
    isAdmin: account.isAdmin,
  };
}

function resolveScopeCode(account: { role: string; cksCode: string | null; isAdmin: boolean }, requested: string): string {
  if (account.isAdmin || account.role === 'admin') {
    return requested;
  }
  return account.cksCode || '';
}

function sendSupportError(reply: FastifyReply, error: unknown) {
  if (error instanceof SupportServiceError) {
    reply.code(error.statusCode).send({ error: error.message, code: error.code });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected support ticket error';
  reply.code(500).send({ error: message, code: 'UNEXPECTED_ERROR' });
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

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const ticket = await createSupportTicketForActor(
        {
          issueType: parsed.data.issueType,
          priority: parsed.data.priority,
          subject: parsed.data.subject,
          description: parsed.data.description,
          stepsToReproduce: parsed.data.stepsToReproduce ?? null,
          screenshotUrl: parsed.data.screenshotUrl ?? null,
          createdByRole: actor.role,
          createdById: actor.cksCode,
        },
        actor,
      );

      reply.code(201).send({
        data: {
          id: ticket.id,
          status: ticket.status,
          ticket,
        },
      });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.get('/api/hub/support/:cksCode', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = cksCodeParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid cksCode' });
      return;
    }

    const scopeCode = resolveScopeCode(account, params.data.cksCode);
    if (!scopeCode) {
      reply.code(400).send({ error: 'Invalid scope code' });
      return;
    }

    try {
      const payload = await listSupportTicketsForHub(account.role as HubRole, scopeCode);
      if (!payload) {
        reply.code(404).send({ error: 'Support tickets not found' });
        return;
      }
      reply.send({ data: payload });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.get('/api/support/tickets/:ticketId/details', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const ticket = await getSupportTicketDetailsForActor(actor.role, actor.cksCode, params.data.ticketId);
      if (!ticket) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }
      reply.send({ data: ticket });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.post('/api/support/tickets/:id/resolve', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const body = resolveTicketSchema.safeParse(request.body ?? {});
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid resolve payload', details: body.error.flatten() });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const updated = await resolveSupportTicketForActor(
        params.data.id,
        {
          resolutionNotes: body.data.resolution_notes,
          actionTaken: body.data.action_taken,
        },
        actor,
      );

      if (!updated) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }

      reply.send({ data: { id: updated.id, status: updated.status, ticket: updated } });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.post('/api/support/tickets/:id/status', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const body = updateTicketStatusSchema.safeParse(request.body ?? {});
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid status payload', details: body.error.flatten() });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const updated = await updateSupportTicketStatusForActor(
        params.data.id,
        {
          status: body.data.status,
          notes: body.data.notes,
          actionTaken: body.data.actionTaken,
        },
        actor,
      );

      if (!updated) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }

      reply.send({ data: { id: updated.id, status: updated.status, ticket: updated } });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.post('/api/support/tickets/:id/assign', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const body = assignTicketSchema.safeParse(request.body ?? {});
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid assignment payload', details: body.error.flatten() });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const updated = await assignSupportTicketForActor(
        params.data.id,
        {
          assigneeId: body.data.assigneeId,
          actorId: actor.cksCode,
        },
        actor,
      );

      if (!updated) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }

      reply.send({ data: { id: updated.id, status: updated.status, ticket: updated } });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.delete('/api/support/tickets/:id/assign', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const updated = await unassignSupportTicketForActor(params.data.id, actor);
      if (!updated) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }
      reply.send({ data: { id: updated.id, status: updated.status, ticket: updated } });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.post('/api/support/tickets/:id/reopen', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const body = reopenTicketSchema.safeParse(request.body ?? {});
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid reopen payload', details: body.error.flatten() });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const updated = await reopenSupportTicketForActor(
        params.data.id,
        { actorId: actor.cksCode, reason: body.data.reason },
        actor,
      );
      if (!updated) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }
      reply.send({ data: { id: updated.id, status: updated.status, ticket: updated } });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.get('/api/support/tickets/:id/comments', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const queryParams = commentQuerySchema.safeParse(request.query ?? {});
    if (!queryParams.success) {
      reply.code(400).send({ error: 'Invalid comments query', details: queryParams.error.flatten() });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const comments = await listTicketCommentsForActor(params.data.id, actor, {
        limit: queryParams.data.limit,
        before: queryParams.data.before,
      });
      if (!comments) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }
      reply.send({ data: comments });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });

  server.post('/api/support/tickets/:id/comments', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const params = ticketIdOrIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid support ticket identifier' });
      return;
    }

    const body = addCommentSchema.safeParse(request.body ?? {});
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid comment payload', details: body.error.flatten() });
      return;
    }

    const actor = toActor(account);
    if (!actor.cksCode) {
      reply.code(400).send({ error: 'Invalid account identity' });
      return;
    }

    try {
      const created = await addTicketCommentForActor(
        params.data.id,
        {
          body: body.data.body,
          isInternal: body.data.isInternal,
        },
        actor,
      );

      if (!created) {
        reply.code(404).send({ error: 'Support ticket not found or access denied' });
        return;
      }

      reply.code(201).send({ data: created });
    } catch (error) {
      sendSupportError(reply, error);
    }
  });
}
