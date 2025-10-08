import { query } from '../../db/connection';
import { generatePrefixedId } from '../identity/customIdGenerator';
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
  const reportId = await generatePrefixedId('report');
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
  const feedbackId = await generatePrefixedId('feedback');
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

export async function updateReportStatus(reportId: string, status: string) {
  const now = new Date().toISOString();
  const sql = `
    UPDATE reports SET status = $2, updated_at = $3 WHERE report_id = $1
    RETURNING report_id, status, updated_at
  `;
  const result = await query(sql, [reportId, status, now]);
  return result.rows[0] ?? null;
}

export async function updateFeedbackStatus(feedbackId: string, status: string) {
  const sql = `
    UPDATE feedback SET status = $2 WHERE feedback_id = $1
    RETURNING feedback_id, status, created_at
  `;
  const result = await query(sql, [feedbackId, status]);
  return result.rows[0] ?? null;
}

export async function archiveReport(reportId: string) {
  const now = new Date().toISOString();
  await query('UPDATE reports SET archived_at = $2 WHERE report_id = $1', [reportId, now]);
}

export async function archiveFeedback(feedbackId: string) {
  const now = new Date().toISOString();
  await query('UPDATE feedback SET archived_at = $2 WHERE feedback_id = $1', [feedbackId, now]);
}

