import { query } from '../../db/connection';
import { generateReportFeedbackId } from '../identity/customIdGenerator';
import { normalizeIdentity } from '../identity';

/**
 * Determines the cks_manager (ecosystem) for a report/feedback based on available IDs.
 * Priority: center_id > customer_id > created_by_id
 */
async function determineEcosystemManager(
  centerId: string | null,
  customerId: string | null,
  createdById: string | null,
  createdByRole: string
): Promise<string | null> {
  // Priority 1: If center_id is provided, get its manager
  if (centerId) {
    const result = await query<{ cks_manager: string | null }>(
      'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
      [centerId]
    );
    if (result.rows[0]?.cks_manager) {
      return normalizeIdentity(result.rows[0].cks_manager);
    }
  }

  // Priority 2: If customer_id is provided, get its manager
  if (customerId) {
    const result = await query<{ cks_manager: string | null }>(
      'SELECT cks_manager FROM customers WHERE UPPER(customer_id) = UPPER($1)',
      [customerId]
    );
    if (result.rows[0]?.cks_manager) {
      return normalizeIdentity(result.rows[0].cks_manager);
    }
  }

  // Priority 3: Look up the creator's manager based on their role
  if (createdById) {
    const normalized = normalizeIdentity(createdById);
    if (!normalized) return null;

    switch (createdByRole.toLowerCase()) {
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
      case 'manager': {
        // If creator is a manager, they are the ecosystem
        return normalized;
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
      default:
        return null;
    }
  }

  return null;
}

export type CreateReportInput = {
  title: string;
  description: string;
  type: string | null; // normalized category/type
  severity?: string | null;
  centerId?: string | null;
  customerId?: string | null;
  createdByRole: string;
  createdById: string;
};

export type CreateFeedbackInput = {
  title: string;
  message: string;
  kind: string; // normalized feedback kind
  centerId?: string | null;
  customerId?: string | null;
  createdByRole: string;
  createdById: string;
};

export async function createReport(input: CreateReportInput) {
  // Generate ID with creator prefix (e.g., CEN-001-RPT-001)
  const reportId = await generateReportFeedbackId('report', input.createdById);
  const now = new Date().toISOString();

  // Determine the ecosystem manager for this report
  const cksManager = await determineEcosystemManager(
    input.centerId ?? null,
    input.customerId ?? null,
    input.createdById,
    input.createdByRole
  );

  const sql = `
    INSERT INTO reports (
      report_id, type, severity, title, description, center_id, customer_id, status,
      created_by_role, created_by_id, cks_manager, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING report_id, type, severity, title, description, center_id, customer_id, status, created_by_role, created_by_id, cks_manager, created_at, updated_at
  `;
  const params = [
    reportId,
    input.type ?? 'other',
    input.severity ?? 'medium',
    input.title,
    input.description,
    input.centerId ?? null,
    input.customerId ?? null,
    'open',
    input.createdByRole,
    input.createdById,
    cksManager,
    now,
    now,
  ];
  const result = await query(sql, params);
  return { id: reportId, row: result.rows[0] };
}

export async function createFeedback(input: CreateFeedbackInput) {
  // Generate ID with creator prefix (e.g., CUS-001-FBK-001)
  const feedbackId = await generateReportFeedbackId('feedback', input.createdById);
  const now = new Date().toISOString();

  // Determine the ecosystem manager for this feedback
  const cksManager = await determineEcosystemManager(
    input.centerId ?? null,
    input.customerId ?? null,
    input.createdById,
    input.createdByRole
  );

  const sql = `
    INSERT INTO feedback (
      feedback_id, kind, title, message, center_id, customer_id, status,
      created_by_role, created_by_id, cks_manager, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING feedback_id, kind, title, message, center_id, customer_id, status, created_by_role, created_by_id, cks_manager, created_at
  `;
  const params = [
    feedbackId,
    input.kind,
    input.title,
    input.message,
    input.centerId ?? null,
    input.customerId ?? null,
    'open',
    input.createdByRole,
    input.createdById,
    cksManager,
    now,
  ];
  const result = await query(sql, params);
  return { id: feedbackId, row: result.rows[0] };
}

export async function updateReportStatus(reportId: string, status: string, resolvedById?: string, resolutionNotes?: string) {
  const now = new Date().toISOString();

  // Update status to resolved and capture who resolved it
  const sql = `
    UPDATE reports SET status = $2, updated_at = $3, resolved_by_id = $4, resolved_at = $5, resolution_notes = $6 WHERE report_id = $1
    RETURNING report_id, status, updated_at, resolved_by_id, resolved_at, resolution_notes, cks_manager, created_by_id
  `;
  const result = await query(sql, [reportId, status, now, resolvedById ?? null, status === 'resolved' ? now : null, resolutionNotes ?? null]);

  // If status is being set to 'resolved', check if everyone has already acknowledged
  // If so, auto-close the report
  if (status === 'resolved' && result.rows[0]) {
    const cksManager = result.rows[0].cks_manager;
    const createdById = result.rows[0].created_by_id;

    if (cksManager) {
      // Count total users (excluding creator)
      const totalUsersResult = await query<{ total: number }>(`
        SELECT (
          (SELECT COUNT(*) FROM centers WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(center_id) != UPPER($2)) +
          (SELECT COUNT(*) FROM customers WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(customer_id) != UPPER($2)) +
          (SELECT COUNT(*) FROM contractors WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(contractor_id) != UPPER($2)) +
          (SELECT COUNT(*) FROM crew WHERE assigned_center IN (SELECT center_id FROM centers WHERE UPPER(cks_manager) = UPPER($1)) AND UPPER(crew_id) != UPPER($2)) +
          CASE WHEN UPPER($1) != UPPER($2) THEN 1 ELSE 0 END
        ) as total
      `, [cksManager, createdById ?? '']);

      // Count acknowledgments
      const ackCountResult = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM report_acknowledgments WHERE report_id = $1',
        [reportId]
      );

      const totalUsers = totalUsersResult.rows[0]?.total ?? 0;
      const ackCount = parseInt(String(ackCountResult.rows[0]?.count ?? 0));

      // If everyone has already acknowledged, mark as closed
      if (totalUsers > 0 && ackCount >= totalUsers) {
        await query(
          'UPDATE reports SET status = $2 WHERE report_id = $1',
          [reportId, 'closed']
        );
        // Update the returned result
        result.rows[0].status = 'closed';
      }
    }
  }

  return result.rows[0] ?? null;
}

export async function updateFeedbackStatus(feedbackId: string, status: string, resolutionNotes?: string) {
  const now = new Date().toISOString();

  // Just update status - archiving happens automatically when everyone acknowledges
  const sql = `
    UPDATE feedback SET status = $2, resolution_notes = $3 WHERE feedback_id = $1
    RETURNING feedback_id, status, created_at, resolution_notes
  `;
  const result = await query(sql, [feedbackId, status, resolutionNotes ?? null]);
  return result.rows[0] ?? null;
}

/**
 * Add an acknowledgment for a report by a specific user.
 * Uses ON CONFLICT to prevent duplicate acknowledgments.
 */
export async function acknowledgeReport(reportId: string, acknowledgedById: string, acknowledgedByRole: string) {
  const normalized = normalizeIdentity(acknowledgedById);
  if (!normalized) {
    throw new Error('Invalid user ID');
  }

  const sql = `
    INSERT INTO report_acknowledgments (report_id, acknowledged_by_id, acknowledged_by_role, acknowledged_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (report_id, acknowledged_by_id) DO NOTHING
    RETURNING id, report_id, acknowledged_by_id, acknowledged_by_role, acknowledged_at
  `;
  const result = await query(sql, [reportId, normalized, acknowledgedByRole]);

  // After acknowledgment, check if all users in the ecosystem have acknowledged
  // If everyone acknowledged AND report is resolved, mark as closed
  const reportResult = await query<{ cks_manager: string | null; status: string | null; created_by_id: string | null }>(
    'SELECT cks_manager, status, created_by_id FROM reports WHERE report_id = $1',
    [reportId]
  );

  const cksManager = reportResult.rows[0]?.cks_manager;
  const status = reportResult.rows[0]?.status;
  const createdById = reportResult.rows[0]?.created_by_id;

  // Check if we should auto-close (both acknowledged by all AND resolved)
  if (cksManager) {
    // Count total active users in this ecosystem EXCLUDING the creator
    // Include: centers, customers, contractors, crew members, and the manager themselves
    const totalUsersResult = await query<{ total: number }>(`
      SELECT (
        (SELECT COUNT(*) FROM centers WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(center_id) != UPPER($2)) +
        (SELECT COUNT(*) FROM customers WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(customer_id) != UPPER($2)) +
        (SELECT COUNT(*) FROM contractors WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(contractor_id) != UPPER($2)) +
        (SELECT COUNT(*) FROM crew WHERE assigned_center IN (SELECT center_id FROM centers WHERE UPPER(cks_manager) = UPPER($1)) AND UPPER(crew_id) != UPPER($2)) +
        CASE WHEN UPPER($1) != UPPER($2) THEN 1 ELSE 0 END
      ) as total
    `, [cksManager, createdById ?? '']);

    // Count acknowledgments for this report
    const ackCountResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM report_acknowledgments WHERE report_id = $1',
      [reportId]
    );

    const totalUsers = totalUsersResult.rows[0]?.total ?? 0;
    const ackCount = parseInt(String(ackCountResult.rows[0]?.count ?? 0));

    // Edge case: If no users need to acknowledge (single-user ecosystem), don't auto-close
    if (totalUsers === 0) {
      return result.rows[0] ?? null;
    }

    // Only mark as closed if BOTH conditions are met:
    // 1. Everyone (except creator) has acknowledged
    // 2. Report status is 'resolved' (manager/warehouse has resolved it)
    if (ackCount >= totalUsers && status === 'resolved') {
      await query(
        'UPDATE reports SET status = $2 WHERE report_id = $1',
        [reportId, 'closed']
      );
    }
  }

  return result.rows[0] ?? null;
}

/**
 * Add an acknowledgment for feedback by a specific user.
 * Uses ON CONFLICT to prevent duplicate acknowledgments.
 */
export async function acknowledgeFeedback(feedbackId: string, acknowledgedById: string, acknowledgedByRole: string) {
  const normalized = normalizeIdentity(acknowledgedById);
  if (!normalized) {
    throw new Error('Invalid user ID');
  }

  const sql = `
    INSERT INTO feedback_acknowledgments (feedback_id, acknowledged_by_id, acknowledged_by_role, acknowledged_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (feedback_id, acknowledged_by_id) DO NOTHING
    RETURNING id, feedback_id, acknowledged_by_id, acknowledged_by_role, acknowledged_at
  `;
  const result = await query(sql, [feedbackId, normalized, acknowledgedByRole]);

  // After acknowledgment, check if all users in the ecosystem have acknowledged
  // If so, auto-mark as closed and auto-archive
  const feedbackResult = await query<{ cks_manager: string | null; created_by_id: string | null }>(
    'SELECT cks_manager, created_by_id FROM feedback WHERE feedback_id = $1',
    [feedbackId]
  );

  const cksManager = feedbackResult.rows[0]?.cks_manager;
  const createdById = feedbackResult.rows[0]?.created_by_id;

  if (cksManager) {
    // Count total active users in this ecosystem EXCLUDING the creator
    // Include: centers, customers, contractors, crew members, and the manager themselves
    const totalUsersResult = await query<{ total: number }>(`
      SELECT (
        (SELECT COUNT(*) FROM centers WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(center_id) != UPPER($2)) +
        (SELECT COUNT(*) FROM customers WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(customer_id) != UPPER($2)) +
        (SELECT COUNT(*) FROM contractors WHERE UPPER(cks_manager) = UPPER($1) AND UPPER(contractor_id) != UPPER($2)) +
        (SELECT COUNT(*) FROM crew WHERE assigned_center IN (SELECT center_id FROM centers WHERE UPPER(cks_manager) = UPPER($1)) AND UPPER(crew_id) != UPPER($2)) +
        CASE WHEN UPPER($1) != UPPER($2) THEN 1 ELSE 0 END
      ) as total
    `, [cksManager, createdById ?? '']);

    // Count acknowledgments for this feedback
    const ackCountResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM feedback_acknowledgments WHERE feedback_id = $1',
      [feedbackId]
    );

    const totalUsers = totalUsersResult.rows[0]?.total ?? 0;
    const ackCount = parseInt(String(ackCountResult.rows[0]?.count ?? 0));

    // Edge case: If no users need to acknowledge (single-user ecosystem), don't auto-archive
    if (totalUsers === 0) {
      return result.rows[0] ?? null;
    }

    // If everyone (except creator) has acknowledged, mark as closed (but don't archive)
    if (ackCount >= totalUsers) {
      await query(
        'UPDATE feedback SET status = $2 WHERE feedback_id = $1',
        [feedbackId, 'closed']
      );
    }
  }

  return result.rows[0] ?? null;
}

/**
 * Get all acknowledgments for a report
 */
export async function getReportAcknowledgments(reportId: string) {
  const sql = `
    SELECT acknowledged_by_id, acknowledged_by_role, acknowledged_at
    FROM report_acknowledgments
    WHERE report_id = $1
    ORDER BY acknowledged_at ASC
  `;
  const result = await query(sql, [reportId]);
  return result.rows;
}

/**
 * Get all acknowledgments for feedback
 */
export async function getFeedbackAcknowledgments(feedbackId: string) {
  const sql = `
    SELECT acknowledged_by_id, acknowledged_by_role, acknowledged_at
    FROM feedback_acknowledgments
    WHERE feedback_id = $1
    ORDER BY acknowledged_at ASC
  `;
  const result = await query(sql, [feedbackId]);
  return result.rows;
}

export async function archiveReport(reportId: string) {
  const now = new Date().toISOString();
  await query('UPDATE reports SET archived_at = $2 WHERE report_id = $1', [reportId, now]);
}

export async function archiveFeedback(feedbackId: string) {
  const now = new Date().toISOString();
  await query('UPDATE feedback SET archived_at = $2 WHERE feedback_id = $1', [feedbackId, now]);
}

