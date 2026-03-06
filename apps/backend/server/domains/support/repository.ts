import { query } from '../../db/connection';
import { generateSupportTicketId, normalizeIdentity } from '../identity/customIdGenerator';
import type { HubRole } from '../profile/types';

type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

type SupportTicketRow = {
  ticket_id: string;
  issue_type: string;
  priority: string;
  subject: string;
  description: string;
  steps_to_reproduce: string | null;
  screenshot_url: string | null;
  status: SupportStatus;
  created_by_role: string;
  created_by_id: string;
  cks_manager: string | null;
  resolution_notes: string | null;
  action_taken: string | null;
  resolved_by_id: string | null;
  resolved_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface CreateSupportTicketInput {
  issueType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subject: string;
  description: string;
  stepsToReproduce?: string | null;
  screenshotUrl?: string | null;
  createdByRole: HubRole;
  createdById: string;
}

export interface HubSupportTicketItem {
  id: string;
  issueType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subject: string;
  description: string;
  stepsToReproduce: string | null;
  screenshotUrl: string | null;
  status: SupportStatus;
  submittedBy: string;
  submittedDate: string;
  updatedDate: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  actionTaken: string | null;
}

export interface HubSupportTicketsPayload {
  role: HubRole;
  cksCode: string;
  tickets: HubSupportTicketItem[];
}

export interface SupportTicketAsReportDetails {
  id: string;
  type: 'report';
  category: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'open' | 'resolved' | 'closed';
  creatorId: string;
  acknowledgments: Array<{ userId: string; date: string }>;
  reportCategory: 'support';
  reportReason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  resolution_notes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown>;
}

function mapPriority(raw: string | null | undefined): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const normalized = String(raw || '').trim().toUpperCase();
  if (normalized === 'LOW' || normalized === 'HIGH' || normalized === 'CRITICAL') {
    return normalized;
  }
  return 'MEDIUM';
}

function mapStatus(raw: string | null | undefined): SupportStatus {
  const normalized = String(raw || '').trim().toLowerCase();
  if (normalized === 'resolved' || normalized === 'closed' || normalized === 'in_progress') {
    return normalized as SupportStatus;
  }
  return 'open';
}

function mapRowToHubTicket(row: SupportTicketRow): HubSupportTicketItem {
  return {
    id: row.ticket_id,
    issueType: row.issue_type,
    priority: mapPriority(row.priority),
    subject: row.subject,
    description: row.description,
    stepsToReproduce: row.steps_to_reproduce,
    screenshotUrl: row.screenshot_url,
    status: mapStatus(row.status),
    submittedBy: row.created_by_id,
    submittedDate: row.created_at,
    updatedDate: row.updated_at,
    resolvedBy: row.resolved_by_id,
    resolvedAt: row.resolved_at,
    resolutionNotes: row.resolution_notes,
    actionTaken: row.action_taken,
  };
}

function mapPriorityForReport(priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (priority === 'LOW' || priority === 'HIGH') {
    return priority;
  }
  return 'MEDIUM';
}

function mapRowToReportDetails(row: SupportTicketRow): SupportTicketAsReportDetails {
  const status = mapStatus(row.status);
  const descriptionParts = [row.description];
  if (row.steps_to_reproduce) {
    descriptionParts.push(`Steps to reproduce:\n${row.steps_to_reproduce}`);
  }
  if (row.screenshot_url) {
    descriptionParts.push(`Screenshot: ${row.screenshot_url}`);
  }
  return {
    id: row.ticket_id,
    type: 'report',
    category: 'Support Ticket',
    title: row.subject,
    description: descriptionParts.join('\n\n'),
    submittedBy: row.created_by_id,
    submittedDate: row.created_at,
    status: status === 'in_progress' ? 'open' : status,
    creatorId: row.created_by_id,
    acknowledgments: [],
    reportCategory: 'support',
    reportReason: row.issue_type,
    priority: mapPriorityForReport(mapPriority(row.priority)),
    resolution_notes: row.resolution_notes,
    resolvedBy: row.resolved_by_id,
    resolvedAt: row.resolved_at,
    metadata: {
      supportTicket: true,
      issueType: row.issue_type,
      ticketStatus: status,
      acknowledgment_complete: true,
      requiredAcknowledgers: [],
    },
  };
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
        [normalized]
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'customer': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM customers WHERE UPPER(customer_id) = UPPER($1)',
        [normalized]
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'contractor': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM contractors WHERE UPPER(contractor_id) = UPPER($1)',
        [normalized]
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'crew': {
      const result = await query<{ assigned_center: string | null }>(
        'SELECT assigned_center FROM crew WHERE UPPER(crew_id) = UPPER($1)',
        [normalized]
      );
      const centerId = result.rows[0]?.assigned_center;
      if (!centerId) return null;
      const centerResult = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
        [centerId]
      );
      return centerResult.rows[0]?.cks_manager ? normalizeIdentity(centerResult.rows[0].cks_manager) : null;
    }
    case 'warehouse': {
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM warehouses WHERE UPPER(warehouse_id) = UPPER($1)',
        [normalized]
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
    }
    case 'admin':
    default:
      return null;
  }
}

async function getTicketRow(ticketId: string): Promise<SupportTicketRow | null> {
  const normalized = normalizeIdentity(ticketId);
  if (!normalized) {
    return null;
  }
  const result = await query<SupportTicketRow>(
    `SELECT ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
            status, created_by_role, created_by_id, cks_manager, resolution_notes, action_taken,
            resolved_by_id, resolved_at, archived_at, created_at, updated_at
     FROM support_tickets
     WHERE UPPER(ticket_id) = UPPER($1)`,
    [normalized]
  );
  return result.rows[0] ?? null;
}

async function canAccessTicket(role: HubRole, viewerCode: string, row: SupportTicketRow): Promise<boolean> {
  if (role === 'admin') {
    return true;
  }

  const normalizedViewer = normalizeIdentity(viewerCode);
  if (!normalizedViewer) {
    return false;
  }

  if (normalizeIdentity(row.created_by_id) === normalizedViewer) {
    return true;
  }

  const viewerManager = await resolveManagerForUser(normalizedViewer, role);
  const ticketManager = normalizeIdentity(row.cks_manager);
  return !!(viewerManager && ticketManager && viewerManager === ticketManager);
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<HubSupportTicketItem> {
  const normalizedCreator = normalizeIdentity(input.createdById);
  if (!normalizedCreator) {
    throw new Error('Invalid creator ID');
  }

  const ticketId = await generateSupportTicketId(normalizedCreator);
  const now = new Date().toISOString();
  const cksManager = await resolveManagerForUser(normalizedCreator, input.createdByRole);

  const result = await query<SupportTicketRow>(
    `INSERT INTO support_tickets (
      ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
      status, created_by_role, created_by_id, cks_manager, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9,$10,$11,$11)
    RETURNING ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
              status, created_by_role, created_by_id, cks_manager, resolution_notes, action_taken,
              resolved_by_id, resolved_at, archived_at, created_at, updated_at`,
    [
      ticketId,
      input.issueType.trim(),
      mapPriority(input.priority),
      input.subject.trim(),
      input.description.trim(),
      input.stepsToReproduce?.trim() || null,
      input.screenshotUrl?.trim() || null,
      input.createdByRole,
      normalizedCreator,
      cksManager,
      now,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create support ticket');
  }
  return mapRowToHubTicket(row);
}

export async function getHubSupportTickets(role: HubRole, cksCode: string): Promise<HubSupportTicketsPayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  let result;
  if (role === 'admin') {
    result = await query<SupportTicketRow>(
      `SELECT ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
              status, created_by_role, created_by_id, cks_manager, resolution_notes, action_taken,
              resolved_by_id, resolved_at, archived_at, created_at, updated_at
       FROM support_tickets
       WHERE archived_at IS NULL
       ORDER BY created_at DESC NULLS LAST`
    );
  } else {
    const managerCode = await resolveManagerForUser(normalizedCode, role);
    if (managerCode) {
      result = await query<SupportTicketRow>(
        `SELECT ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
                status, created_by_role, created_by_id, cks_manager, resolution_notes, action_taken,
                resolved_by_id, resolved_at, archived_at, created_at, updated_at
         FROM support_tickets
         WHERE archived_at IS NULL
           AND (UPPER(cks_manager) = UPPER($1) OR UPPER(created_by_id) = UPPER($2))
         ORDER BY created_at DESC NULLS LAST`,
        [managerCode, normalizedCode]
      );
    } else {
      result = await query<SupportTicketRow>(
        `SELECT ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
                status, created_by_role, created_by_id, cks_manager, resolution_notes, action_taken,
                resolved_by_id, resolved_at, archived_at, created_at, updated_at
         FROM support_tickets
         WHERE archived_at IS NULL
           AND UPPER(created_by_id) = UPPER($1)
         ORDER BY created_at DESC NULLS LAST`,
        [normalizedCode]
      );
    }
  }

  return {
    role,
    cksCode: normalizedCode,
    tickets: result.rows.map(mapRowToHubTicket),
  };
}

export async function getSupportTicketDetailsForModal(
  role: HubRole,
  viewerCode: string,
  ticketId: string
): Promise<SupportTicketAsReportDetails | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  return mapRowToReportDetails(row);
}

export async function resolveSupportTicket(
  role: HubRole,
  viewerCode: string,
  ticketId: string,
  details?: { resolutionNotes?: string; actionTaken?: string }
): Promise<HubSupportTicketItem | null> {
  const row = await getTicketRow(ticketId);
  if (!row || row.archived_at) {
    return null;
  }

  const canAccess = await canAccessTicket(role, viewerCode, row);
  if (!canAccess) {
    return null;
  }

  const normalizedViewer = normalizeIdentity(viewerCode);
  const resolverId = normalizedViewer || (role === 'admin' ? 'ADMIN' : null);
  if (!resolverId) {
    return null;
  }

  const now = new Date().toISOString();
  const normalizedTicketId = normalizeIdentity(row.ticket_id);
  if (!normalizedTicketId) {
    return null;
  }
  const result = await query<SupportTicketRow>(
    `UPDATE support_tickets
     SET status = 'resolved',
         resolution_notes = $2,
         action_taken = $3,
         resolved_by_id = $4,
         resolved_at = $5,
         updated_at = $5
     WHERE ticket_id = $1
     RETURNING ticket_id, issue_type, priority, subject, description, steps_to_reproduce, screenshot_url,
               status, created_by_role, created_by_id, cks_manager, resolution_notes, action_taken,
               resolved_by_id, resolved_at, archived_at, created_at, updated_at`,
    [
      normalizedTicketId,
      details?.resolutionNotes?.trim() || null,
      details?.actionTaken?.trim() || null,
      resolverId,
      now,
    ]
  );

  const updated = result.rows[0];
  return updated ? mapRowToHubTicket(updated) : null;
}
