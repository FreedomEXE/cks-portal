import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubRole } from '../profile/types';

export interface ReportItem {
  id: string;
  type: 'report' | 'feedback';
  category: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'open' | 'resolved' | 'closed';
  relatedService?: string | null;
  acknowledgments?: Array<{ userId: string; date: string }>;
  tags?: string[];
  resolution_notes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
}

export interface HubReportsPayload {
  role: HubRole;
  cksCode: string;
  reports: ReportItem[];
  feedback: ReportItem[];
}

function mapReportRow(row: any, acknowledgments: Array<{ userId: string; date: string }> = []): ReportItem {
  return {
    id: row.report_id,
    type: 'report',
    category: row.type ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.customer_id ?? row.center_id ?? row.created_by_id ?? 'Unknown',
    submittedDate: row.created_at ?? new Date().toISOString(),
    status: row.status ?? 'open',
    relatedService: row.service_id ?? null,
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? String(row.tags).split(',') : []),
    acknowledgments,
    resolution_notes: row.resolution_notes ?? null,
    resolvedBy: row.resolved_by_id ?? null,
    resolvedAt: row.resolved_at ?? null,
  };
}

function mapFeedbackRow(row: any, acknowledgments: Array<{ userId: string; date: string }> = []): ReportItem {
  return {
    id: row.feedback_id,
    type: 'feedback',
    category: row.kind ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.message ?? '',
    submittedBy: row.customer_id ?? row.center_id ?? row.created_by_id ?? 'Unknown',
    submittedDate: row.created_at ?? new Date().toISOString(),
    status: (row.status ?? 'open') === 'resolved' ? 'closed' : (row.status ?? 'open'),
    relatedService: null,
    tags: [],
    acknowledgments,
    resolution_notes: row.resolution_notes ?? null,
  };
}

/**
 * Helper function to get the manager ID for a given user code and role.
 * This determines which ecosystem the user belongs to.
 */
async function getManagerForUser(cksCode: string, role: HubRole): Promise<string | null> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) return null;

  switch (role.toLowerCase()) {
    case 'manager': {
      // Manager is the ecosystem themselves
      return normalized;
    }
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
      // Crew members belong to centers, need to find their assigned center
      const result = await query<{ assigned_center: string | null }>(
        'SELECT assigned_center FROM crew WHERE UPPER(crew_id) = UPPER($1)',
        [normalized]
      );
      if (result.rows[0]?.assigned_center) {
        const centerResult = await query<{ cks_manager: string | null }>(
          'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
          [result.rows[0].assigned_center]
        );
        return centerResult.rows[0]?.cks_manager ? normalizeIdentity(centerResult.rows[0].cks_manager) : null;
      }
      return null;
    }
    case 'warehouse': {
      // Warehouses don't have direct manager relationship in current schema
      // For now, return null - may need to add warehouse-to-manager mapping
      return null;
    }
    default:
      return null;
  }
}

/**
 * Admin function to get ALL reports and feedback across all ecosystems.
 * Admins have system-wide visibility with no ecosystem boundaries.
 */
async function getAllReportsForAdmin(cksCode: string): Promise<HubReportsPayload> {
  // Query ALL reports in the system (not ecosystem-scoped)
  const reportsResult = await query<any>(
    `SELECT report_id, type, severity, title, description, service_id, center_id, customer_id,
            status, created_by_id, created_by_role, created_at, tags
     FROM reports
     WHERE archived_at IS NULL
     ORDER BY created_at DESC NULLS LAST`
  );

  // Query ALL feedback in the system (not ecosystem-scoped)
  const feedbackResult = await query<any>(
    `SELECT feedback_id, kind, title, message, center_id, customer_id,
            status, created_by_id, created_by_role, created_at
     FROM feedback
     WHERE archived_at IS NULL
     ORDER BY created_at DESC NULLS LAST`
  );

  // Load acknowledgments for all reports
  const reportAcksResult = await query<any>(
    `SELECT report_id, acknowledged_by_id, acknowledged_at
     FROM report_acknowledgments
     ORDER BY acknowledged_at ASC`
  );

  // Load acknowledgments for all feedback
  const feedbackAcksResult = await query<any>(
    `SELECT feedback_id, acknowledged_by_id, acknowledged_at
     FROM feedback_acknowledgments
     ORDER BY acknowledged_at ASC`
  );

  // Group acknowledgments by report_id
  const reportAcksMap = new Map<string, Array<{ userId: string; date: string }>>();
  for (const ack of reportAcksResult.rows) {
    if (!reportAcksMap.has(ack.report_id)) {
      reportAcksMap.set(ack.report_id, []);
    }
    reportAcksMap.get(ack.report_id)!.push({
      userId: ack.acknowledged_by_id,
      date: ack.acknowledged_at,
    });
  }

  // Group acknowledgments by feedback_id
  const feedbackAcksMap = new Map<string, Array<{ userId: string; date: string }>>();
  for (const ack of feedbackAcksResult.rows) {
    if (!feedbackAcksMap.has(ack.feedback_id)) {
      feedbackAcksMap.set(ack.feedback_id, []);
    }
    feedbackAcksMap.get(ack.feedback_id)!.push({
      userId: ack.acknowledged_by_id,
      date: ack.acknowledged_at,
    });
  }

  return {
    role: 'admin',
    cksCode,
    reports: reportsResult.rows.map(row => mapReportRow(row, reportAcksMap.get(row.report_id) || [])),
    feedback: feedbackResult.rows.map(row => mapFeedbackRow(row, feedbackAcksMap.get(row.feedback_id) || [])),
  };
}

/**
 * Universal function to get reports and feedback for any role.
 * All users see all reports/feedback within their ecosystem (determined by cks_manager).
 * Ecosystem boundaries are strict - no cross-ecosystem visibility.
 */
async function getEcosystemReports(cksCode: string, role: HubRole): Promise<HubReportsPayload> {
  // Get the manager (ecosystem) for this user
  const managerCode = await getManagerForUser(cksCode, role);

  if (!managerCode) {
    // If we can't determine the manager, return empty results
    return {
      role,
      cksCode,
      reports: [],
      feedback: [],
    };
  }

  // Query all reports in this ecosystem (WHERE cks_manager = manager AND not archived)
  const reportsResult = await query<any>(
    `SELECT report_id, type, severity, title, description, service_id, center_id, customer_id,
            status, created_by_id, created_by_role, created_at, tags, resolution_notes, resolved_by_id, resolved_at
     FROM reports
     WHERE UPPER(cks_manager) = UPPER($1) AND archived_at IS NULL
     ORDER BY created_at DESC NULLS LAST`,
    [managerCode]
  );

  // Query all feedback in this ecosystem (WHERE cks_manager = manager AND not archived)
  const feedbackResult = await query<any>(
    `SELECT feedback_id, kind, title, message, center_id, customer_id,
            status, created_by_id, created_by_role, created_at, resolution_notes
     FROM feedback
     WHERE UPPER(cks_manager) = UPPER($1) AND archived_at IS NULL
     ORDER BY created_at DESC NULLS LAST`,
    [managerCode]
  );

  // Load acknowledgments for all reports in this ecosystem
  const reportIds = reportsResult.rows.map(r => r.report_id);
  const reportAcksResult = reportIds.length > 0 ? await query<any>(
    `SELECT report_id, acknowledged_by_id, acknowledged_at
     FROM report_acknowledgments
     WHERE report_id = ANY($1)
     ORDER BY acknowledged_at ASC`,
    [reportIds]
  ) : { rows: [] };

  // Load acknowledgments for all feedback in this ecosystem
  const feedbackIds = feedbackResult.rows.map(f => f.feedback_id);
  const feedbackAcksResult = feedbackIds.length > 0 ? await query<any>(
    `SELECT feedback_id, acknowledged_by_id, acknowledged_at
     FROM feedback_acknowledgments
     WHERE feedback_id = ANY($1)
     ORDER BY acknowledged_at ASC`,
    [feedbackIds]
  ) : { rows: [] };

  // Group acknowledgments by report_id
  const reportAcksMap = new Map<string, Array<{ userId: string; date: string }>>();
  for (const ack of reportAcksResult.rows) {
    if (!reportAcksMap.has(ack.report_id)) {
      reportAcksMap.set(ack.report_id, []);
    }
    reportAcksMap.get(ack.report_id)!.push({
      userId: ack.acknowledged_by_id,
      date: ack.acknowledged_at,
    });
  }

  // Group acknowledgments by feedback_id
  const feedbackAcksMap = new Map<string, Array<{ userId: string; date: string }>>();
  for (const ack of feedbackAcksResult.rows) {
    if (!feedbackAcksMap.has(ack.feedback_id)) {
      feedbackAcksMap.set(ack.feedback_id, []);
    }
    feedbackAcksMap.get(ack.feedback_id)!.push({
      userId: ack.acknowledged_by_id,
      date: ack.acknowledged_at,
    });
  }

  return {
    role,
    cksCode,
    reports: reportsResult.rows.map(row => mapReportRow(row, reportAcksMap.get(row.report_id) || [])),
    feedback: feedbackResult.rows.map(row => mapFeedbackRow(row, feedbackAcksMap.get(row.feedback_id) || [])),
  };
}

export async function getHubReports(role: HubRole, cksCode: string): Promise<HubReportsPayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  // Admin sees ALL reports across all ecosystems
  if (role.toLowerCase() === 'admin') {
    return getAllReportsForAdmin(normalizedCode);
  }

  // All other roles use the ecosystem-based query
  return getEcosystemReports(normalizedCode, role);
}
