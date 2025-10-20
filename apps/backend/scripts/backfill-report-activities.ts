/**
 * Backfill Script: Create activity records for existing reports/feedback
 *
 * This creates activity records in system_activity table for all existing
 * reports and feedback that were created before we added activity tracking.
 */

import 'dotenv/config';
import { query } from '../server/db/connection';

async function backfillReportActivities() {
  console.log('[Backfill] Starting backfill of report/feedback activities...');

  try {
    // 1. Backfill report_created activities
    const reportsResult = await query(`
      SELECT
        report_id,
        title,
        created_by_id,
        created_by_role,
        created_at,
        report_category,
        related_entity_id,
        report_reason,
        priority
      FROM reports
      WHERE NOT EXISTS (
        SELECT 1 FROM system_activity
        WHERE activity_type = 'report_created'
        AND target_id = report_id
      )
      ORDER BY created_at ASC
    `);

    console.log(`[Backfill] Found ${reportsResult.rows.length} reports without activity records`);

    for (const report of reportsResult.rows) {
      await query(
        `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `${report.created_by_role || 'User'} filed a report: ${report.title || 'Untitled Report'}`,
          'report_created',
          report.created_by_id || '',
          report.created_by_role || 'user',
          report.report_id,
          'report',
          JSON.stringify({
            reportCategory: report.report_category,
            relatedEntityId: report.related_entity_id,
            reportReason: report.report_reason,
            priority: report.priority,
          }),
          report.created_at, // Use original timestamp
        ]
      );
    }

    console.log(`[Backfill] ✅ Created ${reportsResult.rows.length} report_created activities`);

    // 2. Backfill feedback_created activities
    const feedbackResult = await query(`
      SELECT
        feedback_id,
        title,
        kind,
        created_by_id,
        created_by_role,
        created_at,
        report_category,
        related_entity_id,
        rating
      FROM feedback
      WHERE NOT EXISTS (
        SELECT 1 FROM system_activity
        WHERE activity_type = 'feedback_created'
        AND target_id = feedback_id
      )
      ORDER BY created_at ASC
    `);

    console.log(`[Backfill] Found ${feedbackResult.rows.length} feedback entries without activity records`);

    for (const feedback of feedbackResult.rows) {
      await query(
        `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `${feedback.created_by_role || 'User'} submitted feedback: ${feedback.title || 'Untitled Feedback'}`,
          'feedback_created',
          feedback.created_by_id || '',
          feedback.created_by_role || 'user',
          feedback.feedback_id,
          'feedback',
          JSON.stringify({
            kind: feedback.kind,
            reportCategory: feedback.report_category,
            relatedEntityId: feedback.related_entity_id,
            rating: feedback.rating,
          }),
          feedback.created_at, // Use original timestamp
        ]
      );
    }

    console.log(`[Backfill] ✅ Created ${feedbackResult.rows.length} feedback_created activities`);

    // 3. Backfill report_acknowledged activities
    const acknowledgementsResult = await query(`
      SELECT
        report_id,
        acknowledged_by_id,
        acknowledged_by_role,
        acknowledged_at
      FROM report_acknowledgments
      WHERE NOT EXISTS (
        SELECT 1 FROM system_activity
        WHERE activity_type = 'report_acknowledged'
        AND target_id = report_id
        AND actor_id = acknowledged_by_id
      )
      ORDER BY acknowledged_at ASC
    `);

    console.log(`[Backfill] Found ${acknowledgementsResult.rows.length} report acknowledgments without activity records`);

    for (const ack of acknowledgementsResult.rows) {
      await query(
        `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `${ack.acknowledged_by_role || 'User'} acknowledged report ${ack.report_id}`,
          'report_acknowledged',
          ack.acknowledged_by_id || '',
          ack.acknowledged_by_role || 'user',
          ack.report_id,
          'report',
          JSON.stringify({}),
          ack.acknowledged_at, // Use original timestamp
        ]
      );
    }

    console.log(`[Backfill] ✅ Created ${acknowledgementsResult.rows.length} report_acknowledged activities`);

    // 4. Backfill feedback_acknowledged activities
    const feedbackAcksResult = await query(`
      SELECT
        feedback_id,
        acknowledged_by_id,
        acknowledged_by_role,
        acknowledged_at
      FROM feedback_acknowledgments
      WHERE NOT EXISTS (
        SELECT 1 FROM system_activity
        WHERE activity_type = 'feedback_acknowledged'
        AND target_id = feedback_id
        AND actor_id = acknowledged_by_id
      )
      ORDER BY acknowledged_at ASC
    `);

    console.log(`[Backfill] Found ${feedbackAcksResult.rows.length} feedback acknowledgments without activity records`);

    for (const ack of feedbackAcksResult.rows) {
      await query(
        `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `${ack.acknowledged_by_role || 'User'} acknowledged feedback ${ack.feedback_id}`,
          'feedback_acknowledged',
          ack.acknowledged_by_id || '',
          ack.acknowledged_by_role || 'user',
          ack.feedback_id,
          'feedback',
          JSON.stringify({}),
          ack.acknowledged_at, // Use original timestamp
        ]
      );
    }

    console.log(`[Backfill] ✅ Created ${feedbackAcksResult.rows.length} feedback_acknowledged activities`);

    // 5. Backfill report_resolved activities
    const resolvedReportsResult = await query(`
      SELECT
        report_id,
        resolved_by_id,
        resolved_at,
        resolution_notes,
        action_taken
      FROM reports
      WHERE status = 'resolved'
      AND resolved_by_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM system_activity
        WHERE activity_type = 'report_resolved'
        AND target_id = report_id
      )
      ORDER BY resolved_at ASC
    `);

    console.log(`[Backfill] Found ${resolvedReportsResult.rows.length} resolved reports without activity records`);

    for (const report of resolvedReportsResult.rows) {
      await query(
        `INSERT INTO system_activity (description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `User resolved report ${report.report_id}`,
          'report_resolved',
          report.resolved_by_id || '',
          'user', // We don't have role stored for resolver, using 'user'
          report.report_id,
          'report',
          JSON.stringify({
            resolution_notes: report.resolution_notes,
            action_taken: report.action_taken,
          }),
          report.resolved_at, // Use original timestamp
        ]
      );
    }

    console.log(`[Backfill] ✅ Created ${resolvedReportsResult.rows.length} report_resolved activities`);

    console.log('[Backfill] ✅ Backfill completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Backfill] ❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillReportActivities();
