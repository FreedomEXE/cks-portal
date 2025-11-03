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
  creatorId: string | null;
  relatedService?: string | null;
  acknowledgments?: Array<{ userId: string; date: string }>;
  tags?: string[];
  resolution_notes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  // New structured fields
  reportCategory?: string | null;
  relatedEntityId?: string | null;
  reportReason?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  rating?: number | null;
  serviceManagedBy?: string | null;
  metadata?: Record<string, unknown>;
  // Archive metadata (for single-entity fetches)
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  deletionScheduled?: string;
}

export interface HubReportsPayload {
  role: HubRole;
  cksCode: string;
  reports: ReportItem[];
  feedback: ReportItem[];
}

function mapReportRow(row: any, acknowledgments: Array<{ userId: string; date: string }> = []): ReportItem {
  const creatorCode = normalizeIdentity(row.created_by_id || null);

  // Build metadata with role IDs for frontend ownership checks
  const metadata: Record<string, unknown> = {};
  if (creatorCode) {
    const roleFromCode = creatorCode.startsWith('CTR') ? 'contractorId' :
                         creatorCode.startsWith('CUS') ? 'customerId' :
                         creatorCode.startsWith('CEN') ? 'centerId' :
                         creatorCode.startsWith('CRW') ? 'crewId' :
                         creatorCode.startsWith('WHR') ? 'warehouseId' :
                         creatorCode.startsWith('MGR') ? 'managerId' : null;
    if (roleFromCode) {
      metadata[roleFromCode] = creatorCode;
    }
  }

  return {
    id: row.report_id,
    type: 'report',
    category: row.type ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.customer_id ?? row.center_id ?? row.created_by_id ?? 'Unknown',
    submittedDate: row.created_at ?? new Date().toISOString(),
    status: row.status ?? 'open',
    creatorId: creatorCode,
    relatedService: row.service_id ?? null,
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? String(row.tags).split(',') : []),
    acknowledgments,
    resolution_notes: row.resolution_notes ?? null,
    resolvedBy: row.resolved_by_id ?? null,
    resolvedAt: row.resolved_at ?? null,
    // New structured fields
    reportCategory: row.report_category ?? null,
    relatedEntityId: row.related_entity_id ?? null,
    reportReason: row.report_reason ?? null,
    priority: row.priority ?? null,
    serviceManagedBy: row.service_managed_by ?? null,
    metadata,
  };
}

function mapFeedbackRow(row: any, acknowledgments: Array<{ userId: string; date: string }> = []): ReportItem {
  const creatorCode = normalizeIdentity(row.created_by_id || null);

  // Build metadata with role IDs for frontend ownership checks
  const metadata: Record<string, unknown> = {};
  if (creatorCode) {
    const roleFromCode = creatorCode.startsWith('CTR') ? 'contractorId' :
                         creatorCode.startsWith('CUS') ? 'customerId' :
                         creatorCode.startsWith('CEN') ? 'centerId' :
                         creatorCode.startsWith('CRW') ? 'crewId' :
                         creatorCode.startsWith('WHR') ? 'warehouseId' :
                         creatorCode.startsWith('MGR') ? 'managerId' : null;
    if (roleFromCode) {
      metadata[roleFromCode] = creatorCode;
    }
  }

  return {
    id: row.feedback_id,
    type: 'feedback',
    category: row.kind ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.message ?? '',
    submittedBy: row.customer_id ?? row.center_id ?? row.created_by_id ?? 'Unknown',
    submittedDate: row.created_at ?? new Date().toISOString(),
    status: (row.status ?? 'open') === 'resolved' ? 'closed' : (row.status ?? 'open'),
    creatorId: creatorCode,
    relatedService: null,
    tags: [],
    acknowledgments,
    resolution_notes: row.resolution_notes ?? null,
    // Structured + rating
    reportCategory: row.report_category ?? null,
    relatedEntityId: row.related_entity_id ?? null,
    reportReason: row.report_reason ?? null,
    rating: typeof row.rating === 'number' ? row.rating : (row.rating ? Number(row.rating) : null),
    metadata,
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
      // Query the warehouses table to get the manager for this warehouse
      const result = await query<{ cks_manager: string | null }>(
        'SELECT cks_manager FROM warehouses WHERE UPPER(warehouse_id) = UPPER($1)',
        [normalized]
      );
      return result.rows[0]?.cks_manager ? normalizeIdentity(result.rows[0].cks_manager) : null;
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
  // LEFT JOIN with services to get managed_by for service reports
  const reportsResult = await query<any>(
    `SELECT r.report_id, r.type, r.severity, r.title, r.description, r.service_id, r.center_id, r.customer_id,
            r.status, r.created_by_id, r.created_by_role, r.created_at, r.tags,
            r.report_category, r.related_entity_id, r.report_reason, r.priority,
            s.managed_by as service_managed_by
     FROM reports r
     LEFT JOIN services s ON r.report_category = 'service' AND UPPER(s.service_id) = UPPER(r.related_entity_id)
     WHERE r.archived_at IS NULL
     ORDER BY r.created_at DESC NULLS LAST`
  );

  // Query ALL feedback in the system (not ecosystem-scoped)
  const feedbackResult = await query<any>(
    `SELECT feedback_id, kind, title, message, center_id, customer_id,
            status, created_by_id, created_by_role, created_at, rating
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
  // LEFT JOIN with services to get managed_by for service reports
  const reportsResult = await query<any>(
    `SELECT r.report_id, r.type, r.severity, r.title, r.description, r.service_id, r.center_id, r.customer_id,
            r.status, r.created_by_id, r.created_by_role, r.created_at, r.tags, r.resolution_notes, r.resolved_by_id, r.resolved_at,
            r.report_category, r.related_entity_id, r.report_reason, r.priority,
            s.managed_by as service_managed_by
     FROM reports r
     LEFT JOIN services s ON r.report_category = 'service' AND UPPER(s.service_id) = UPPER(r.related_entity_id)
     WHERE UPPER(r.cks_manager) = UPPER($1) AND r.archived_at IS NULL
     ORDER BY r.created_at DESC NULLS LAST`,
    [managerCode]
  );

  // Query all feedback in this ecosystem (WHERE cks_manager = manager AND not archived)
  const feedbackResult = await query<any>(
    `SELECT feedback_id, kind, title, message, center_id, customer_id,
            status, created_by_id, created_by_role, created_at, resolution_notes,
            report_category, related_entity_id, report_reason, rating
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

/**
 * Warehouse function to get ONLY reports/feedback related to warehouse-specific orders.
 * Warehouses are NOT part of ecosystems - they only see reports about orders assigned to them.
 */
async function getWarehouseReports(cksCode: string): Promise<HubReportsPayload> {
  const normalized = normalizeIdentity(cksCode);
  if (!normalized) {
    return {
      role: 'warehouse',
      cksCode,
      reports: [],
      feedback: [],
    };
  }

  // Get all order IDs assigned to this warehouse
  const ordersResult = await query<{ order_id: string }>(
    'SELECT order_id FROM orders WHERE UPPER(assigned_warehouse) = UPPER($1)',
    [normalized]
  );
  const orderIds = ordersResult.rows.map(r => r.order_id);

  if (orderIds.length === 0) {
    // No orders assigned to this warehouse, return empty
    return {
      role: 'warehouse',
      cksCode,
      reports: [],
      feedback: [],
    };
  }

  // Get all service IDs that were created from warehouse-managed orders
  // (service orders transform into services via orders.transformed_id)
  const servicesResult = await query<{ service_id: string }>(
    `SELECT DISTINCT transformed_id as service_id
     FROM orders
     WHERE UPPER(assigned_warehouse) = UPPER($1)
       AND transformed_id IS NOT NULL`,
    [normalized]
  );
  const serviceIds = servicesResult.rows.map(r => r.service_id).filter(Boolean);

  // Combine order IDs and service IDs into one array for matching
  const entityIds = [...orderIds, ...serviceIds];

  // Query reports where related_entity_id matches warehouse's orders OR services
  // This includes both warehouse-managed service orders AND product orders
  // LEFT JOIN with services to get managed_by for service reports
  const reportsResult = await query<any>(
    `SELECT r.report_id, r.type, r.severity, r.title, r.description, r.service_id, r.center_id, r.customer_id,
            r.status, r.created_by_id, r.created_by_role, r.created_at, r.tags, r.resolution_notes, r.resolved_by_id, r.resolved_at,
            r.report_category, r.related_entity_id, r.report_reason, r.priority,
            s.managed_by as service_managed_by
     FROM reports r
     LEFT JOIN services s ON r.report_category = 'service' AND UPPER(s.service_id) = UPPER(r.related_entity_id)
     WHERE r.archived_at IS NULL
       AND (
         (r.report_category IN ('order', 'service') AND r.related_entity_id = ANY($1))
         OR r.created_by_id = $2
       )
     ORDER BY created_at DESC NULLS LAST`,
    [entityIds, normalized]
  );

  // Query feedback where related_entity_id matches warehouse's orders OR services
  // This now includes feedback ABOUT warehouse-managed entities, not just feedback created BY the warehouse
  const feedbackResult = await query<any>(
    `SELECT feedback_id, kind, title, message, center_id, customer_id,
            status, created_by_id, created_by_role, created_at, resolution_notes,
            report_category, related_entity_id, report_reason, rating
     FROM feedback
     WHERE archived_at IS NULL
       AND (
         (report_category IN ('order', 'service') AND related_entity_id = ANY($1))
         OR created_by_id = $2
       )
     ORDER BY created_at DESC NULLS LAST`,
    [entityIds, normalized]
  );

  // Load acknowledgments for warehouse reports
  const reportIds = reportsResult.rows.map(r => r.report_id);
  const reportAcksResult = reportIds.length > 0 ? await query<any>(
    `SELECT report_id, acknowledged_by_id, acknowledged_at
     FROM report_acknowledgments
     WHERE report_id = ANY($1)
     ORDER BY acknowledged_at ASC`,
    [reportIds]
  ) : { rows: [] };

  // Load acknowledgments for warehouse feedback
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
    role: 'warehouse',
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

  // Warehouse has special logic - only sees reports about their assigned orders
  if (role.toLowerCase() === 'warehouse') {
    return getWarehouseReports(normalizedCode);
  }

  // All other roles use the ecosystem-based query
  return getEcosystemReports(normalizedCode, role);
}

/**
 * Get a single report or feedback by ID with proper permission scoping.
 * Checks both reports and feedback tables.
 */
export async function getReportById(role: HubRole, cksCode: string, reportId: string): Promise<ReportItem | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  const normalizedReportId = normalizeIdentity(reportId);

  if (!normalizedCode || !normalizedReportId) {
    return null;
  }

  // Check if it's a report or feedback by looking at the ID prefix
  const isReport = normalizedReportId.includes('-RPT-');
  const isFeedback = normalizedReportId.includes('-FBK-');

  if (!isReport && !isFeedback) {
    return null; // Invalid ID format
  }

  if (isReport) {
    // Query report with service join
    const result = await query<any>(
      `SELECT r.report_id, r.type, r.severity, r.title, r.description, r.service_id, r.center_id, r.customer_id,
              r.status, r.created_by_id, r.created_by_role, r.created_at, r.tags, r.resolution_notes, r.resolved_by_id, r.resolved_at,
              r.report_category, r.related_entity_id, r.report_reason, r.priority, r.cks_manager,
              r.archived_at, r.archived_by, r.archive_reason, r.deletion_scheduled,
              s.managed_by as service_managed_by
       FROM reports r
       LEFT JOIN services s ON r.report_category = 'service' AND UPPER(s.service_id) = UPPER(r.related_entity_id)
       WHERE UPPER(r.report_id) = UPPER($1)`,
      [normalizedReportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const report = result.rows[0];

    // Permission check
    if (role.toLowerCase() === 'admin') {
      // Admin can see all reports
    } else if (role.toLowerCase() === 'warehouse') {
      // Warehouse can only see reports about their assigned orders/services
      const ordersResult = await query<{ order_id: string }>(
        'SELECT order_id FROM orders WHERE UPPER(assigned_warehouse) = UPPER($1)',
        [normalizedCode]
      );
      const orderIds = ordersResult.rows.map(r => r.order_id);

      const servicesResult = await query<{ service_id: string }>(
        `SELECT DISTINCT transformed_id as service_id
         FROM orders
         WHERE UPPER(assigned_warehouse) = UPPER($1) AND transformed_id IS NOT NULL`,
        [normalizedCode]
      );
      const serviceIds = servicesResult.rows.map(r => r.service_id).filter(Boolean);
      const entityIds = [...orderIds, ...serviceIds];

      const canAccess = report.created_by_id?.toUpperCase() === normalizedCode.toUpperCase() ||
                        (report.related_entity_id && entityIds.includes(report.related_entity_id));

      if (!canAccess) {
        return null; // Permission denied
      }
    } else {
      // Other roles: must be in same ecosystem
      const managerCode = await getManagerForUser(normalizedCode, role);
      if (!managerCode || report.cks_manager?.toUpperCase() !== managerCode.toUpperCase()) {
        return null; // Permission denied
      }
    }

    // Load acknowledgments
    const acksResult = await query<any>(
      `SELECT acknowledged_by_id, acknowledged_at
       FROM report_acknowledgments
       WHERE UPPER(report_id) = UPPER($1)
       ORDER BY acknowledged_at ASC`,
      [normalizedReportId]
    );

    const acknowledgments = acksResult.rows.map(ack => ({
      userId: ack.acknowledged_by_id,
      date: ack.acknowledged_at,
    }));

    return {
      ...mapReportRow(report, acknowledgments),
      archivedAt: report.archived_at || undefined,
      archivedBy: report.archived_by || undefined,
      archiveReason: report.archive_reason || undefined,
      deletionScheduled: report.deletion_scheduled || undefined,
    };
  } else {
    // Query feedback (has archived_at but not other archive metadata columns)
    const result = await query<any>(
      `SELECT feedback_id, kind, title, message, center_id, customer_id,
              status, created_by_id, created_by_role, created_at, resolution_notes,
              report_category, related_entity_id, report_reason, rating, cks_manager,
              archived_at
       FROM feedback
       WHERE UPPER(feedback_id) = UPPER($1)`,
      [normalizedReportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const feedback = result.rows[0];

    // Permission check (same logic as reports)
    if (role.toLowerCase() === 'admin') {
      // Admin can see all feedback
    } else if (role.toLowerCase() === 'warehouse') {
      // Warehouse can only see feedback about their assigned orders/services
      const ordersResult = await query<{ order_id: string }>(
        'SELECT order_id FROM orders WHERE UPPER(assigned_warehouse) = UPPER($1)',
        [normalizedCode]
      );
      const orderIds = ordersResult.rows.map(r => r.order_id);

      const servicesResult = await query<{ service_id: string }>(
        `SELECT DISTINCT transformed_id as service_id
         FROM orders
         WHERE UPPER(assigned_warehouse) = UPPER($1) AND transformed_id IS NOT NULL`,
        [normalizedCode]
      );
      const serviceIds = servicesResult.rows.map(r => r.service_id).filter(Boolean);
      const entityIds = [...orderIds, ...serviceIds];

      const canAccess = feedback.created_by_id?.toUpperCase() === normalizedCode.toUpperCase() ||
                        (feedback.related_entity_id && entityIds.includes(feedback.related_entity_id));

      if (!canAccess) {
        return null; // Permission denied
      }
    } else {
      // Other roles: must be in same ecosystem
      const managerCode = await getManagerForUser(normalizedCode, role);
      if (!managerCode || feedback.cks_manager?.toUpperCase() !== managerCode.toUpperCase()) {
        return null; // Permission denied
      }
    }

    // Load acknowledgments
    const acksResult = await query<any>(
      `SELECT acknowledged_by_id, acknowledged_at
       FROM feedback_acknowledgments
       WHERE UPPER(feedback_id) = UPPER($1)
       ORDER BY acknowledged_at ASC`,
      [normalizedReportId]
    );

    const acknowledgments = acksResult.rows.map(ack => ({
      userId: ack.acknowledged_by_id,
      date: ack.acknowledged_at,
    }));

    // Feedback table only has archived_at (not full archive metadata)
    return {
      ...mapFeedbackRow(feedback, acknowledgments),
      archivedAt: feedback.archived_at || undefined,
    };
  }
}
