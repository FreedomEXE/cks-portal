/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import { query } from '../../db/connection';
import { generateSupportTicketId, normalizeIdentity } from '../identity/customIdGenerator';
import type { HubRole } from '../profile/types';
import type {
  AddTicketCommentInput,
  AssignTicketInput,
  CreateSupportTicketInput,
  HubSupportTicketItem,
  HubSupportTicketsPayload,
  ReopenTicketInput,
  SupportTicketComment,
  SupportTicketDetails,
  TicketPriority,
  TicketStatus,
  UpdateTicketStatusInput,
} from './types';

export class SupportTicketRepositoryError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = 'SUPPORT_TICKET_ERROR') {
    super(message);
    this.name = 'SupportTicketRepositoryError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type SupportTicketRow = {
  ticket_id: string;
  issue_type: string;
  priority: string;
  subject: string;
  description: string;
  steps_to_reproduce: string | null;
  screenshot_url: string | null;
  status: string;
  created_by_role: string | null;
  created_by_id: string | null;
  cks_manager: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  action_taken: string | null;
  resolved_by_id: string | null;
  resolved_at: string | null;
  reopened_count: number | string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count?: number | string | null;
};

type SupportTicketCommentRow = {
  comment_id: number | string;
  ticket_id: string;
  author_id: string;
  author_role: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

const TICKET_SELECT_COLUMNS = `
  ticket_id,
  issue_type,
  priority,
  subject,
  description,
  steps_to_reproduce,
  screenshot_url,
  status,
  created_by_role,
  created_by_id,
  cks_manager,
  assigned_to,
  resolution_notes,
  action_taken,
  resolved_by_id,
  resolved_at,
  reopened_count,
  archived_at,
  created_at,
  updated_at
`;

const VALID_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'escalated', 'resolved', 'cancelled'],
  in_progress: ['waiting_on_user', 'escalated', 'resolved', 'cancelled'],
  waiting_on_user: ['in_progress', 'resolved', 'cancelled'],
  escalated: ['in_progress', 'resolved', 'cancelled'],
  resolved: ['closed', 'open'],
  closed: [],
  cancelled: [],
};

type SupportSchemaCapabilities = {
  hasStepsToReproduce: boolean;
  hasScreenshotUrl: boolean;
  hasCreatedByRole: boolean;
  hasCreatedById: boolean;
  hasCksManager: boolean;
  hasAssignedTo: boolean;
  hasResolutionNotes: boolean;
  hasActionTaken: boolean;
  hasResolvedById: boolean;
  hasResolvedAt: boolean;
  hasReopenedCount: boolean;
  hasArchivedAt: boolean;
};

let supportSchemaCapabilitiesPromise: Promise<SupportSchemaCapabilities> | null = null;

async function getSupportSchemaCapabilities(): Promise<SupportSchemaCapabilities> {
  if (!supportSchemaCapabilitiesPromise) {
    supportSchemaCapabilitiesPromise = (async () => {
      const result = await query<{ column_name: string }>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'support_tickets'
           AND column_name = ANY($1::text[])`,
        [[
          'steps_to_reproduce',
          'screenshot_url',
          'created_by_role',
          'created_by_id',
          'cks_manager',
          'assigned_to',
          'resolution_notes',
          'action_taken',
          'resolved_by_id',
          'resolved_at',
          'reopened_count',
          'archived_at',
        ]],
      );
      const columns = new Set(result.rows.map((row) => String(row.column_name || '').trim().toLowerCase()));
      return {
        hasStepsToReproduce: columns.has('steps_to_reproduce'),
        hasScreenshotUrl: columns.has('screenshot_url'),
        hasCreatedByRole: columns.has('created_by_role'),
        hasCreatedById: columns.has('created_by_id'),
        hasCksManager: columns.has('cks_manager'),
        hasAssignedTo: columns.has('assigned_to'),
        hasResolutionNotes: columns.has('resolution_notes'),
        hasActionTaken: columns.has('action_taken'),
        hasResolvedById: columns.has('resolved_by_id'),
        hasResolvedAt: columns.has('resolved_at'),
        hasReopenedCount: columns.has('reopened_count'),
        hasArchivedAt: columns.has('archived_at'),
      };
    })().catch((error) => {
      supportSchemaCapabilitiesPromise = null;
      throw error;
    });
  }

  return supportSchemaCapabilitiesPromise;
}

async function selectTicketColumns(): Promise<string> {
  const capabilities = await getSupportSchemaCapabilities();
  return `
    ticket_id,
    issue_type,
    priority,
    subject,
    description,
    ${capabilities.hasStepsToReproduce ? 'steps_to_reproduce' : 'NULL::text AS steps_to_reproduce'},
    ${capabilities.hasScreenshotUrl ? 'screenshot_url' : 'NULL::text AS screenshot_url'},
    status,
    ${capabilities.hasCreatedByRole ? 'created_by_role' : "'user'::text AS created_by_role"},
    ${capabilities.hasCreatedById ? 'created_by_id' : 'NULL::text AS created_by_id'},
    ${capabilities.hasCksManager ? 'cks_manager' : 'NULL::text AS cks_manager'},
    ${capabilities.hasAssignedTo ? 'assigned_to' : 'NULL::text AS assigned_to'},
    ${capabilities.hasResolutionNotes ? 'resolution_notes' : 'NULL::text AS resolution_notes'},
    ${capabilities.hasActionTaken ? 'action_taken' : 'NULL::text AS action_taken'},
    ${capabilities.hasResolvedById ? 'resolved_by_id' : 'NULL::text AS resolved_by_id'},
    ${capabilities.hasResolvedAt ? 'resolved_at' : 'NULL::timestamptz AS resolved_at'},
    ${capabilities.hasReopenedCount ? 'reopened_count' : '0::int AS reopened_count'},
    ${capabilities.hasArchivedAt ? 'archived_at' : 'NULL::timestamptz AS archived_at'},
    created_at,
    updated_at
  `;
}

function isAdminRole(role: string | null | undefined): boolean {
  return String(role || '').trim().toLowerCase() === 'admin';
}

function normalizePriority(raw: string | null | undefined): TicketPriority {
  const normalized = String(raw || '').trim().toUpperCase();
  if (normalized === 'LOW' || normalized === 'HIGH' || normalized === 'CRITICAL') {
    return normalized;
  }
  return 'MEDIUM';
}

function normalizeStatus(raw: string | null | undefined): TicketStatus {
  const normalized = String(raw || '').trim().toLowerCase();
  if (
    normalized === 'open' ||
    normalized === 'in_progress' ||
    normalized === 'waiting_on_user' ||
    normalized === 'escalated' ||
    normalized === 'resolved' ||
    normalized === 'closed' ||
    normalized === 'cancelled'
  ) {
    return normalized;
  }
  return 'open';
}

function toCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapRowToHubTicket(row: SupportTicketRow): HubSupportTicketItem {
  return {
    id: row.ticket_id,
    issueType: row.issue_type,
    priority: normalizePriority(row.priority),
    subject: row.subject,
    description: row.description,
    stepsToReproduce: row.steps_to_reproduce,
    screenshotUrl: row.screenshot_url,
    status: normalizeStatus(row.status),
    submittedBy: row.created_by_id ?? '',
    submittedRole: row.created_by_role ?? 'user',
    assignedTo: row.assigned_to,
    submittedDate: row.created_at,
    updatedDate: row.updated_at,
    resolvedBy: row.resolved_by_id,
    resolvedAt: row.resolved_at,
    resolutionNotes: row.resolution_notes,
    actionTaken: row.action_taken,
    reopenedCount: toCount(row.reopened_count),
    commentCount: toCount(row.comment_count),
  };
}

function mapCommentRow(row: SupportTicketCommentRow): SupportTicketComment {
  return {
    commentId: Number(row.comment_id),
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorRole: row.author_role,
    body: row.body,
    isInternal: !!row.is_internal,
    createdAt: row.created_at,
  };
}

function normalizeIssueType(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) {
    return 'general_question';
  }
  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100) || 'general_question';
}

function ensureViewerCode(viewerCode: string): string {
  const normalized = normalizeIdentity(viewerCode);
  if (!normalized) {
    throw new SupportTicketRepositoryError('Invalid viewer code', 400, 'INVALID_VIEWER');
  }
  return normalized;
}

async function resolveManagerForUser(cksCode: string, role: HubRole): Promise<string | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) return null;

  switch (role.toLowerCase()) {
    case 'manager':
      return normalized;
    case 'center': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
        [normalized],
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'customer': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM customers WHERE UPPER(customer_id) = UPPER($1)',
        [normalized],
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'contractor': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM contractors WHERE UPPER(contractor_id) = UPPER($1)',
        [normalized],
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'crew': {
      const crewResult = await query<{ assigned_center: string | null }>(
        'SELECT assigned_center FROM crew WHERE UPPER(crew_id) = UPPER($1)',
        [normalized],
      );
      const centerId = crewResult.rows[0]?.assigned_center;
      if (!centerId) return null;
      const centerResult = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
        [centerId],
      );
      return centerResult.rows[0]?.cks_manager ? normalizeIdentity(centerResult.rows[0].cks_manager) : null;
    }
    case 'warehouse': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM warehouses WHERE UPPER(warehouse_id) = UPPER($1)',
        [normalized],
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    default:
      return null;
  }
}

async function getTicketRow(ticketId: string): Promise<SupportTicketRow | null> {
  const normalized = normalizeIdentity(ticketId);
  if (!normalized) return null;

  const columns = await selectTicketColumns();

  const result = await query<SupportTicketRow>(
    `SELECT ${columns}
     FROM support_tickets
     WHERE UPPER(ticket_id) = UPPER($1)
     LIMIT 1`,
    [normalized],
  );

  return result.rows[0] ?? null;
}

async function canAccessTicket(role: HubRole, viewerCode: string, row: SupportTicketRow): Promise<boolean> {
  if (isAdminRole(role)) {
    return true;
  }
  const normalizedViewer = normalizeIdentity(viewerCode);
  if (!normalizedViewer) {
    return false;
  }
  return normalizeIdentity(row.created_by_id || null) === normalizedViewer;
}

export function isValidStatusTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) {
    return true;
  }
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<HubSupportTicketItem> {
  const normalizedCreator = normalizeIdentity(input.createdById);
  if (!normalizedCreator) {
    throw new SupportTicketRepositoryError('Invalid creator ID', 400, 'INVALID_CREATOR');
  }

  const creatorRole = String(input.createdByRole || '').trim().toLowerCase() as HubRole;
  const ticketId = await generateSupportTicketId(normalizedCreator);
  const now = new Date().toISOString();
  const cksManager = await resolveManagerForUser(normalizedCreator, creatorRole);
  const capabilities = await getSupportSchemaCapabilities();
  const returningColumns = await selectTicketColumns();

  const result = await query<SupportTicketRow>(
    capabilities.hasScreenshotUrl
      ? `INSERT INTO support_tickets (
           ticket_id,
           issue_type,
           priority,
           subject,
           description,
           steps_to_reproduce,
           screenshot_url,
           status,
           created_by_role,
           created_by_id,
           cks_manager,
           assigned_to,
           reopened_count,
           created_at,
           updated_at
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           'open',
           $8,
           $9,
           $10,
           NULL,
           0,
           $11,
           $11
         )
         RETURNING ${returningColumns}, 0::int AS comment_count`
      : `INSERT INTO support_tickets (
           ticket_id,
           issue_type,
           priority,
           subject,
           description,
           steps_to_reproduce,
           status,
           created_by_role,
           created_by_id,
           cks_manager,
           assigned_to,
           reopened_count,
           created_at,
           updated_at
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           'open',
           $7,
           $8,
           $9,
           NULL,
           0,
           $10,
           $10
         )
         RETURNING ${returningColumns}, 0::int AS comment_count`,
    capabilities.hasScreenshotUrl
      ? [
          ticketId,
          normalizeIssueType(input.issueType),
          normalizePriority(input.priority),
          input.subject.trim(),
          input.description.trim(),
          input.stepsToReproduce?.trim() || null,
          input.screenshotUrl?.trim() || null,
          creatorRole,
          normalizedCreator,
          cksManager,
          now,
        ]
      : [
          ticketId,
          normalizeIssueType(input.issueType),
          normalizePriority(input.priority),
          input.subject.trim(),
          input.description.trim(),
          input.stepsToReproduce?.trim() || null,
          creatorRole,
          normalizedCreator,
          cksManager,
          now,
        ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new SupportTicketRepositoryError('Failed to create support ticket', 500, 'CREATE_FAILED');
  }

  return mapRowToHubTicket(row);
}

export async function getHubSupportTickets(role: HubRole, cksCode: string): Promise<HubSupportTicketsPayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const columns = await selectTicketColumns();

  let result;
  if (isAdminRole(role)) {
    result = await query<SupportTicketRow>(
      `SELECT ${columns},
              COALESCE((
                SELECT COUNT(*)::int
                FROM support_ticket_comments c
                WHERE UPPER(c.ticket_id) = UPPER(t.ticket_id)
              ), 0) AS comment_count
       FROM support_tickets t
       WHERE t.archived_at IS NULL
       ORDER BY t.created_at DESC NULLS LAST`,
    );
  } else {
    result = await query<SupportTicketRow>(
      `SELECT ${columns},
              COALESCE((
                SELECT COUNT(*)::int
                FROM support_ticket_comments c
                WHERE UPPER(c.ticket_id) = UPPER(t.ticket_id)
              ), 0) AS comment_count
       FROM support_tickets t
       WHERE t.archived_at IS NULL
         AND UPPER(t.created_by_id) = UPPER($1)
       ORDER BY t.created_at DESC NULLS LAST`,
      [normalizedCode],
    );
  }

  return {
    role,
    cksCode: normalizedCode,
    tickets: result.rows.map(mapRowToHubTicket),
  };
}

export async function getSupportTicketDetails(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  options?: { commentsLimit?: number },
): Promise<SupportTicketDetails | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  const comments = await listSupportTicketComments(role, viewerCode, ticketId, {
    limit: options?.commentsLimit ?? 50,
  });

  const base = mapRowToHubTicket({
    ...row,
    comment_count: comments?.length ?? 0,
  });

  return {
    ...base,
    cksManager: row.cks_manager,
    comments: comments ?? [],
  };
}

export async function getSupportTicketDetailsForModal(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
): Promise<SupportTicketDetails | null> {
  return getSupportTicketDetails(role, viewerCode, ticketId, { commentsLimit: 50 });
}

export async function updateSupportTicketStatus(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  input: UpdateTicketStatusInput,
): Promise<HubSupportTicketItem | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  const previousStatus = normalizeStatus(row.status);
  const nextStatus = normalizeStatus(input.status);

  if (!isValidStatusTransition(previousStatus, nextStatus)) {
    throw new SupportTicketRepositoryError(
      `Invalid status transition: ${previousStatus} -> ${nextStatus}`,
      400,
      'INVALID_TRANSITION',
    );
  }

  const normalizedActorId = normalizeIdentity(input.actorId) ?? (isAdminRole(role) ? 'ADMIN' : null);
  if (!normalizedActorId) {
    throw new SupportTicketRepositoryError('Invalid actor identity', 400, 'INVALID_ACTOR');
  }

  const now = new Date().toISOString();
  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  if (!normalizedTicketId) {
    throw new SupportTicketRepositoryError('Invalid ticket identifier', 400, 'INVALID_TICKET');
  }
  const returningColumns = await selectTicketColumns();

  // Reopen path (resolved -> open)
  if (previousStatus === 'resolved' && nextStatus === 'open') {
    const reopened = await query<SupportTicketRow>(
      `UPDATE support_tickets
       SET status = 'open',
           reopened_count = COALESCE(reopened_count, 0) + 1,
           resolution_notes = NULL,
           action_taken = NULL,
           resolved_by_id = NULL,
           resolved_at = NULL,
           updated_at = $2
       WHERE UPPER(ticket_id) = UPPER($1)
       RETURNING ${returningColumns},
                 COALESCE((
                   SELECT COUNT(*)::int
                   FROM support_ticket_comments c
                   WHERE UPPER(c.ticket_id) = UPPER(support_tickets.ticket_id)
                 ), 0) AS comment_count`,
      [normalizedTicketId, now],
    );
    return reopened.rows[0] ? mapRowToHubTicket(reopened.rows[0]) : null;
  }

  if (nextStatus === 'resolved') {
    const notes = (input.notes || '').trim();
    if (!notes) {
      throw new SupportTicketRepositoryError('resolution_notes is required to resolve a ticket', 400, 'MISSING_RESOLUTION_NOTES');
    }

    const result = await query<SupportTicketRow>(
      `UPDATE support_tickets
       SET status = 'resolved',
           resolution_notes = $2,
           action_taken = $3,
           resolved_by_id = $4,
           resolved_at = $5,
           updated_at = $5
       WHERE UPPER(ticket_id) = UPPER($1)
       RETURNING ${returningColumns},
                 COALESCE((
                   SELECT COUNT(*)::int
                   FROM support_ticket_comments c
                   WHERE UPPER(c.ticket_id) = UPPER(support_tickets.ticket_id)
                 ), 0) AS comment_count`,
      [
        normalizedTicketId,
        notes,
        (input.actionTaken || '').trim() || null,
        normalizedActorId,
        now,
      ],
    );

    return result.rows[0] ? mapRowToHubTicket(result.rows[0]) : null;
  }

  const result = await query<SupportTicketRow>(
    `UPDATE support_tickets
     SET status = $2,
         updated_at = $3
     WHERE UPPER(ticket_id) = UPPER($1)
     RETURNING ${returningColumns},
               COALESCE((
                 SELECT COUNT(*)::int
                 FROM support_ticket_comments c
                 WHERE UPPER(c.ticket_id) = UPPER(support_tickets.ticket_id)
               ), 0) AS comment_count`,
    [normalizedTicketId, nextStatus, now],
  );

  return result.rows[0] ? mapRowToHubTicket(result.rows[0]) : null;
}

export async function resolveSupportTicket(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  details?: { resolutionNotes?: string; actionTaken?: string },
): Promise<HubSupportTicketItem | null> {
  return updateSupportTicketStatus(role, viewerCode, ticketId, {
    status: 'resolved',
    notes: details?.resolutionNotes,
    actionTaken: details?.actionTaken,
    actorId: viewerCode,
  });
}

export async function assignSupportTicket(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  input: AssignTicketInput,
): Promise<HubSupportTicketItem | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  if (!isAdminRole(role)) {
    return null;
  }

  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  const normalizedAssignee = normalizeIdentity(input.assigneeId);
  if (!normalizedTicketId || !normalizedAssignee) {
    throw new SupportTicketRepositoryError('Invalid assignment payload', 400, 'INVALID_ASSIGNMENT');
  }

  const nextStatus = normalizeStatus(row.status) === 'open' ? 'in_progress' : normalizeStatus(row.status);
  const now = new Date().toISOString();
  const returningColumns = await selectTicketColumns();

  const result = await query<SupportTicketRow>(
    `UPDATE support_tickets
     SET assigned_to = $2,
         status = $3,
         updated_at = $4
     WHERE UPPER(ticket_id) = UPPER($1)
     RETURNING ${returningColumns},
               COALESCE((
                 SELECT COUNT(*)::int
                 FROM support_ticket_comments c
                 WHERE UPPER(c.ticket_id) = UPPER(support_tickets.ticket_id)
               ), 0) AS comment_count`,
    [normalizedTicketId, normalizedAssignee, nextStatus, now],
  );

  return result.rows[0] ? mapRowToHubTicket(result.rows[0]) : null;
}

export async function unassignSupportTicket(
  role: HubRole,
  _viewerCode: string,
  ticketId: string,
): Promise<HubSupportTicketItem | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  if (!isAdminRole(role)) {
    return null;
  }

  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  if (!normalizedTicketId) {
    throw new SupportTicketRepositoryError('Invalid ticket identifier', 400, 'INVALID_TICKET');
  }

  const now = new Date().toISOString();
  const returningColumns = await selectTicketColumns();

  const result = await query<SupportTicketRow>(
    `UPDATE support_tickets
     SET assigned_to = NULL,
         updated_at = $2
     WHERE UPPER(ticket_id) = UPPER($1)
     RETURNING ${returningColumns},
               COALESCE((
                 SELECT COUNT(*)::int
                 FROM support_ticket_comments c
                 WHERE UPPER(c.ticket_id) = UPPER(support_tickets.ticket_id)
               ), 0) AS comment_count`,
    [normalizedTicketId, now],
  );

  return result.rows[0] ? mapRowToHubTicket(result.rows[0]) : null;
}

export async function reopenSupportTicket(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  _input?: ReopenTicketInput,
): Promise<HubSupportTicketItem | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  const currentStatus = normalizeStatus(row.status);
  if (currentStatus !== 'resolved') {
    throw new SupportTicketRepositoryError('Only resolved tickets can be reopened', 400, 'INVALID_REOPEN_STATE');
  }

  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  if (!normalizedTicketId) {
    throw new SupportTicketRepositoryError('Invalid ticket identifier', 400, 'INVALID_TICKET');
  }

  const now = new Date().toISOString();
  const returningColumns = await selectTicketColumns();

  const result = await query<SupportTicketRow>(
    `UPDATE support_tickets
     SET status = 'open',
         reopened_count = COALESCE(reopened_count, 0) + 1,
         resolution_notes = NULL,
         action_taken = NULL,
         resolved_by_id = NULL,
         resolved_at = NULL,
         updated_at = $2
     WHERE UPPER(ticket_id) = UPPER($1)
     RETURNING ${returningColumns},
               COALESCE((
                 SELECT COUNT(*)::int
                 FROM support_ticket_comments c
                 WHERE UPPER(c.ticket_id) = UPPER(support_tickets.ticket_id)
               ), 0) AS comment_count`,
    [normalizedTicketId, now],
  );

  return result.rows[0] ? mapRowToHubTicket(result.rows[0]) : null;
}

export async function listSupportTicketComments(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  options?: { limit?: number; before?: string },
): Promise<SupportTicketComment[] | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  if (!normalizedTicketId) {
    throw new SupportTicketRepositoryError('Invalid ticket identifier', 400, 'INVALID_TICKET');
  }

  const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
  const before = options?.before ? new Date(options.before) : null;

  const whereParts = ['UPPER(ticket_id) = UPPER($1)'];
  const params: Array<string | number | boolean> = [normalizedTicketId];

  if (!isAdminRole(role)) {
    whereParts.push('is_internal = FALSE');
  }

  if (before && !Number.isNaN(before.getTime())) {
    params.push(before.toISOString());
    whereParts.push(`created_at < $${params.length}`);
  }

  params.push(limit);

  const result = await query<SupportTicketCommentRow>(
    `SELECT comment_id, ticket_id, author_id, author_role, body, is_internal, created_at
     FROM support_ticket_comments
     WHERE ${whereParts.join(' AND ')}
     ORDER BY created_at ASC
     LIMIT $${params.length}`,
    params,
  );

  return result.rows.map(mapCommentRow);
}

export async function addSupportTicketComment(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  input: AddTicketCommentInput,
): Promise<SupportTicketComment | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  const normalizedAuthor = normalizeIdentity(input.authorId);
  if (!normalizedTicketId || !normalizedAuthor) {
    throw new SupportTicketRepositoryError('Invalid comment payload', 400, 'INVALID_COMMENT');
  }

  const isInternal = !!input.isInternal;
  if (isInternal && !isAdminRole(role)) {
    throw new SupportTicketRepositoryError('Only admins can add internal comments', 403, 'INTERNAL_FORBIDDEN');
  }

  const now = new Date().toISOString();

  const inserted = await query<SupportTicketCommentRow>(
    `INSERT INTO support_ticket_comments (
      ticket_id,
      author_id,
      author_role,
      body,
      is_internal,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING comment_id, ticket_id, author_id, author_role, body, is_internal, created_at`,
    [
      normalizedTicketId,
      normalizedAuthor,
      String(input.authorRole || '').trim().toLowerCase() || 'unknown',
      input.body.trim(),
      isInternal,
      now,
    ],
  );

  await query(
    `UPDATE support_tickets
     SET updated_at = $2
     WHERE UPPER(ticket_id) = UPPER($1)`,
    [normalizedTicketId, now],
  );

  const comment = inserted.rows[0];
  return comment ? mapCommentRow(comment) : null;
}

export async function assertTicketAccess(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
): Promise<{ ticket: HubSupportTicketItem; createdById: string } | null> {
  const normalizedViewer = ensureViewerCode(viewerCode);
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, normalizedViewer, row);
  if (!canAccess) {
    return null;
  }

  return {
    ticket: mapRowToHubTicket(row),
    createdById: row.created_by_id ?? '',
  };
}
