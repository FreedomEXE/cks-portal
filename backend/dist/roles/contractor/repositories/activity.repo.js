"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
exports.getActivities = getActivities;
exports.getActivitySummary = getActivitySummary;
/**
 * File: activity.repo.ts
 *
 * Description: Read/write activity logs for contractor actions
 * Function: Handle activity logging and retrieval for audit trail
 * Importance: Provides audit trail and activity tracking for contractor operations
 * Connects to: Services that log actions; Activity UI.
 *
 * Notes: Contractor-specific activity logging patterns
 */
const connection_1 = require("../../../db/connection");
// Log activity for contractor
async function logActivity(entry) {
    const sql = `
    INSERT INTO activity_logs (
      user_id, action, entity_type, entity_id, description, 
      metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `;
    await (0, connection_1.query)(sql, [
        entry.userId,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.description,
        entry.metadata ? JSON.stringify(entry.metadata) : null
    ]);
}
// Get activity logs for contractor
async function getActivities(contractorId, limit = 50) {
    const sql = `
    SELECT 
      al.activity_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.description,
      al.metadata,
      al.created_at,
      u.display_name as user_name
    FROM activity_logs al
    JOIN users u ON al.user_id = u.user_id
    WHERE al.user_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2
  `;
    return await (0, connection_1.query)(sql, [contractorId, limit]);
}
// Get activity summary for contractor
async function getActivitySummary(contractorId, days = 30) {
    const sql = `
    WITH activity_counts AS (
      SELECT 
        action,
        COUNT(*) as count,
        DATE_TRUNC('day', created_at) as activity_date
      FROM activity_logs
      WHERE user_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY action, DATE_TRUNC('day', created_at)
    )
    SELECT 
      action,
      SUM(count) as total_count,
      COUNT(DISTINCT activity_date) as active_days
    FROM activity_counts
    GROUP BY action
    ORDER BY total_count DESC
  `;
    const result = await (0, connection_1.query)(sql, [contractorId]);
    return {
        summary: result,
        totalActivities: result.reduce((sum, row) => sum + row.total_count, 0),
        activeDays: Math.max(...result.map(row => row.active_days), 0)
    };
}
//# sourceMappingURL=activity.repo.js.map