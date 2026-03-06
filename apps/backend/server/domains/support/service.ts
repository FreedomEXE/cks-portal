/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import { normalizeIdentity } from '../identity/customIdGenerator';
import { recordActivity } from '../activity/writer';
import type { HubRole } from '../profile/types';
import {
  addSupportTicketComment,
  assertTicketAccess,
  assignSupportTicket,
  createSupportTicket,
  getHubSupportTickets,
  getSupportTicketDetailsForModal,
  listSupportTicketComments,
  reopenSupportTicket,
  resolveSupportTicket,
  SupportTicketRepositoryError,
  unassignSupportTicket,
  updateSupportTicketStatus,
} from './repository';
import type {
  AddTicketCommentInput,
  AssignTicketInput,
  CreateSupportTicketInput,
  HubSupportTicketItem,
  HubSupportTicketsPayload,
  ReopenTicketInput,
  SupportTicketComment,
  SupportTicketDetails,
  TicketStatus,
  UpdateTicketStatusInput,
} from './types';

export class SupportServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = 'SUPPORT_SERVICE_ERROR') {
    super(message);
    this.name = 'SupportServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface SupportActor {
  role: HubRole;
  cksCode: string;
  isAdmin?: boolean;
}

function normalizeActorId(actor: SupportActor): string {
  const normalized = normalizeIdentity(actor.cksCode);
  if (normalized) {
    return normalized;
  }
  if (actor.isAdmin || actor.role === 'admin') {
    return 'ADMIN';
  }
  throw new SupportServiceError('Invalid actor identity', 400, 'INVALID_ACTOR');
}

function ensureAdmin(actor: SupportActor): void {
  if (actor.role !== 'admin') {
    throw new SupportServiceError('Admin access required', 403, 'FORBIDDEN');
  }
}

function toServiceError(error: unknown): SupportServiceError {
  if (error instanceof SupportServiceError) {
    return error;
  }
  if (error instanceof SupportTicketRepositoryError) {
    return new SupportServiceError(error.message, error.statusCode, error.code);
  }
  if (error instanceof Error) {
    return new SupportServiceError(error.message, 500, 'UNEXPECTED_ERROR');
  }
  return new SupportServiceError('Unexpected support ticket error', 500, 'UNEXPECTED_ERROR');
}

function buildStatusChangeDescription(ticketId: string, oldStatus: TicketStatus, newStatus: TicketStatus): string {
  return `Updated support ticket ${ticketId}: ${oldStatus} -> ${newStatus}`;
}

export async function createSupportTicketForActor(
  input: CreateSupportTicketInput,
  actor: SupportActor,
): Promise<HubSupportTicketItem> {
  try {
    const ticket = await createSupportTicket(input);
    const actorId = normalizeActorId(actor);

    await recordActivity({
      activityType: 'support_ticket_submitted',
      description: `Submitted support ticket ${ticket.id}`,
      actorId,
      actorRole: actor.role,
      targetId: ticket.id,
      targetType: 'support_ticket',
      metadata: {
        createdById: ticket.submittedBy,
        issueType: ticket.issueType,
        priority: ticket.priority,
        subject: ticket.subject,
      },
    });

    return ticket;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function listSupportTicketsForHub(
  role: HubRole,
  cksCode: string,
): Promise<HubSupportTicketsPayload | null> {
  try {
    return await getHubSupportTickets(role, cksCode);
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function getSupportTicketDetailsForActor(
  role: HubRole,
  cksCode: string,
  ticketId: string,
): Promise<SupportTicketDetails | null> {
  try {
    return await getSupportTicketDetailsForModal(role, cksCode, ticketId);
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function resolveSupportTicketForActor(
  ticketId: string,
  details: { resolutionNotes?: string; actionTaken?: string } | undefined,
  actor: SupportActor,
): Promise<HubSupportTicketItem | null> {
  try {
    ensureAdmin(actor);
    const actorId = normalizeActorId(actor);

    const access = await assertTicketAccess(actor.role, actorId, ticketId);
    if (!access) {
      return null;
    }

    const updated = await resolveSupportTicket(actor.role, actorId, ticketId, details);
    if (!updated) {
      return null;
    }

    await recordActivity({
      activityType: 'support_ticket_resolved',
      description: `Resolved support ticket ${updated.id}`,
      actorId,
      actorRole: actor.role,
      targetId: updated.id,
      targetType: 'support_ticket',
      metadata: {
        createdById: access.createdById,
        resolvedBy: actorId,
        resolutionNotes: updated.resolutionNotes,
        actionTaken: updated.actionTaken,
      },
    });

    return updated;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function updateSupportTicketStatusForActor(
  ticketId: string,
  input: Omit<UpdateTicketStatusInput, 'actorId'>,
  actor: SupportActor,
): Promise<HubSupportTicketItem | null> {
  try {
    const actorId = normalizeActorId(actor);
    const access = await assertTicketAccess(actor.role, actorId, ticketId);
    if (!access) {
      return null;
    }

    // Non-admin users can only cancel their own open tickets.
    if (actor.role !== 'admin' && input.status !== 'cancelled') {
      throw new SupportServiceError('Only admins can apply this status transition', 403, 'FORBIDDEN_STATUS_CHANGE');
    }

    const previousStatus = access.ticket.status;
    const updated = await updateSupportTicketStatus(actor.role, actorId, ticketId, {
      ...input,
      actorId,
    });

    if (!updated) {
      return null;
    }

    const newStatus = updated.status;

    await recordActivity({
      activityType: 'support_ticket_status_changed',
      description: buildStatusChangeDescription(updated.id, previousStatus, newStatus),
      actorId,
      actorRole: actor.role,
      targetId: updated.id,
      targetType: 'support_ticket',
      metadata: {
        createdById: access.createdById,
        oldStatus: previousStatus,
        newStatus,
        changedBy: actorId,
      },
    });

    if (newStatus === 'resolved') {
      await recordActivity({
        activityType: 'support_ticket_resolved',
        description: `Resolved support ticket ${updated.id}`,
        actorId,
        actorRole: actor.role,
        targetId: updated.id,
        targetType: 'support_ticket',
        metadata: {
          createdById: access.createdById,
          resolvedBy: actorId,
          resolutionNotes: updated.resolutionNotes,
          actionTaken: updated.actionTaken,
        },
      });
    }

    if (previousStatus === 'resolved' && newStatus === 'open') {
      await recordActivity({
        activityType: 'support_ticket_reopened',
        description: `Reopened support ticket ${updated.id}`,
        actorId,
        actorRole: actor.role,
        targetId: updated.id,
        targetType: 'support_ticket',
        metadata: {
          createdById: access.createdById,
          reopenedBy: actorId,
          reason: input.notes ?? null,
          reopenedCount: updated.reopenedCount,
        },
      });
    }

    return updated;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function assignSupportTicketForActor(
  ticketId: string,
  input: AssignTicketInput,
  actor: SupportActor,
): Promise<HubSupportTicketItem | null> {
  try {
    ensureAdmin(actor);
    const actorId = normalizeActorId(actor);

    const access = await assertTicketAccess(actor.role, actorId, ticketId);
    if (!access) {
      return null;
    }

    const previousStatus = access.ticket.status;
    const updated = await assignSupportTicket(actor.role, actorId, ticketId, input);
    if (!updated) {
      return null;
    }

    await recordActivity({
      activityType: 'support_ticket_assigned',
      description: `Assigned support ticket ${updated.id} to ${updated.assignedTo ?? input.assigneeId}`,
      actorId,
      actorRole: actor.role,
      targetId: updated.id,
      targetType: 'support_ticket',
      metadata: {
        createdById: access.createdById,
        assignedTo: updated.assignedTo,
        assignedBy: actorId,
      },
    });

    if (previousStatus !== updated.status) {
      await recordActivity({
        activityType: 'support_ticket_status_changed',
        description: buildStatusChangeDescription(updated.id, previousStatus, updated.status),
        actorId,
        actorRole: actor.role,
        targetId: updated.id,
        targetType: 'support_ticket',
        metadata: {
          createdById: access.createdById,
          oldStatus: previousStatus,
          newStatus: updated.status,
          changedBy: actorId,
        },
      });
    }

    return updated;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function unassignSupportTicketForActor(
  ticketId: string,
  actor: SupportActor,
): Promise<HubSupportTicketItem | null> {
  try {
    ensureAdmin(actor);
    const actorId = normalizeActorId(actor);

    const access = await assertTicketAccess(actor.role, actorId, ticketId);
    if (!access) {
      return null;
    }

    const updated = await unassignSupportTicket(actor.role, actorId, ticketId);
    if (!updated) {
      return null;
    }

    await recordActivity({
      activityType: 'support_ticket_assigned',
      description: `Unassigned support ticket ${updated.id}`,
      actorId,
      actorRole: actor.role,
      targetId: updated.id,
      targetType: 'support_ticket',
      metadata: {
        createdById: access.createdById,
        assignedTo: null,
        assignedBy: actorId,
      },
    });

    return updated;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function reopenSupportTicketForActor(
  ticketId: string,
  input: ReopenTicketInput | undefined,
  actor: SupportActor,
): Promise<HubSupportTicketItem | null> {
  try {
    ensureAdmin(actor);
    const actorId = normalizeActorId(actor);

    const access = await assertTicketAccess(actor.role, actorId, ticketId);
    if (!access) {
      return null;
    }

    const updated = await reopenSupportTicket(actor.role, actorId, ticketId, input);
    if (!updated) {
      return null;
    }

    await recordActivity({
      activityType: 'support_ticket_reopened',
      description: `Reopened support ticket ${updated.id}`,
      actorId,
      actorRole: actor.role,
      targetId: updated.id,
      targetType: 'support_ticket',
      metadata: {
        createdById: access.createdById,
        reopenedBy: actorId,
        reason: input?.reason ?? null,
        reopenedCount: updated.reopenedCount,
      },
    });

    return updated;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function listTicketCommentsForActor(
  ticketId: string,
  actor: SupportActor,
  options?: { limit?: number; before?: string },
): Promise<SupportTicketComment[] | null> {
  try {
    const actorId = normalizeActorId(actor);
    return await listSupportTicketComments(actor.role, actorId, ticketId, options);
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function addTicketCommentForActor(
  ticketId: string,
  input: Omit<AddTicketCommentInput, 'authorId' | 'authorRole'>,
  actor: SupportActor,
): Promise<SupportTicketComment | null> {
  try {
    const actorId = normalizeActorId(actor);
    const access = await assertTicketAccess(actor.role, actorId, ticketId);
    if (!access) {
      return null;
    }

    const created = await addSupportTicketComment(actor.role, actorId, ticketId, {
      ...input,
      authorId: actorId,
      authorRole: actor.role,
    });

    if (!created) {
      return null;
    }

    await recordActivity({
      activityType: 'support_ticket_comment_added',
      description: `Added comment to support ticket ${ticketId}`,
      actorId,
      actorRole: actor.role,
      targetId: ticketId,
      targetType: 'support_ticket',
      metadata: {
        createdById: access.createdById,
        commentBy: actorId,
        isInternal: created.isInternal,
      },
    });

    return created;
  } catch (error) {
    throw toServiceError(error);
  }
}
