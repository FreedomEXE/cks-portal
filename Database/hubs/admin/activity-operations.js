"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminActivity = logAdminActivity;
exports.getActivityLog = getActivityLog;
exports.getActivityStatistics = getActivityStatistics;
exports.cleanupOldActivity = cleanupOldActivity;
exports.detectSuspiciousActivity = detectSuspiciousActivity;
const pool_1 = __importDefault(require("../../db/pool"));
async function logAdminActivity(activity_type, description, actor_id, actor_role, target_id, target_type, metadata) {
    try {
        const result = await pool_1.default.query(`INSERT INTO system_activity (activity_type, description, actor_id, actor_role, target_id, target_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING activity_id, created_at`, [
            activity_type,
            description,
            actor_id,
            actor_role,
            target_id || null,
            target_type || null,
            metadata ? JSON.stringify(metadata) : null
        ]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Failed to log admin activity:', error);
        throw error;
    }
}
async function getActivityLog(filters = {}) {
    const { activity_type, actor_role, target_type, date_from, date_to, search, limit = 50, offset = 0 } = filters;
    let baseQuery = `
    SELECT activity_id, activity_type, description, actor_id, actor_role, 
           target_id, target_type, metadata, created_at
    FROM system_activity
    WHERE 1=1
  `;
    let countQuery = `
    SELECT COUNT(*) as total
    FROM system_activity  
    WHERE 1=1
  `;
    const queryParams = [];
    let paramIndex = 1;
    if (activity_type) {
        const condition = ` AND activity_type = $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(activity_type);
        paramIndex++;
    }
    if (actor_role) {
        const condition = ` AND actor_role = $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(actor_role);
        paramIndex++;
    }
    if (target_type) {
        const condition = ` AND target_type = $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(target_type);
        paramIndex++;
    }
    if (date_from) {
        const condition = ` AND created_at >= $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(date_from);
        paramIndex++;
    }
    if (date_to) {
        const condition = ` AND created_at <= $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(date_to);
        paramIndex++;
    }
    if (search && search.trim()) {
        const condition = ` AND (description ILIKE $${paramIndex} OR target_id ILIKE $${paramIndex} OR actor_id ILIKE $${paramIndex})`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
    }
    baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    try {
        const [dataResult, countResult] = await Promise.all([
            pool_1.default.query(baseQuery, queryParams),
            pool_1.default.query(countQuery, queryParams.slice(0, -2))
        ]);
        const items = dataResult.rows.map(row => ({
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : null
        }));
        return {
            items,
            total: parseInt(countResult.rows[0].total),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit,
            filters: {
                activity_type,
                actor_role,
                target_type,
                date_from,
                date_to,
                search
            }
        };
    }
    catch (error) {
        console.error('Error fetching activity log:', error);
        throw error;
    }
}
async function getActivityStatistics(days = 30) {
    try {
        const queries = [
            `SELECT activity_type, COUNT(*) as count
       FROM system_activity 
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY activity_type
       ORDER BY count DESC`,
            `SELECT actor_role, COUNT(*) as count
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY actor_role
       ORDER BY count DESC`,
            `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
            `SELECT actor_id, actor_role, COUNT(*) as count
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY actor_id, actor_role
       ORDER BY count DESC
       LIMIT 10`
        ];
        const [byTypeResult, byRoleResult, dailyResult, activeActorsResult] = await Promise.all(queries.map(query => pool_1.default.query(query)));
        return {
            period_days: days,
            by_type: byTypeResult.rows,
            by_role: byRoleResult.rows,
            daily_counts: dailyResult.rows,
            most_active_actors: activeActorsResult.rows,
            generated_at: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error getting activity statistics:', error);
        throw error;
    }
}
async function cleanupOldActivity(days = 90) {
    try {
        const result = await pool_1.default.query(`DELETE FROM system_activity 
       WHERE created_at < NOW() - INTERVAL '${days} days'
       RETURNING activity_id`);
        await logAdminActivity('system_maintenance', `Cleaned up ${result.rowCount} activity records older than ${days} days`, 'system', 'admin');
        return {
            deleted_count: result.rowCount,
            days_threshold: days
        };
    }
    catch (error) {
        console.error('Error cleaning up old activity records:', error);
        throw error;
    }
}
async function detectSuspiciousActivity() {
    try {
        const queries = [
            `SELECT actor_id, COUNT(*) as failed_attempts
       FROM system_activity
       WHERE activity_type = 'login_failed' 
         AND created_at >= NOW() - INTERVAL '1 hour'
       GROUP BY actor_id
       HAVING COUNT(*) >= 5`,
            `SELECT actor_id, actor_role, COUNT(*) as delete_count, 
              MAX(created_at) as latest_delete
       FROM system_activity
       WHERE activity_type = 'user_deleted'
         AND created_at >= NOW() - INTERVAL '1 hour'
       GROUP BY actor_id, actor_role
       HAVING COUNT(*) >= 10`,
            `SELECT actor_id, actor_role, activity_type, created_at
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '24 hours'
         AND (EXTRACT(hour FROM created_at) < 6 OR EXTRACT(hour FROM created_at) > 22)
         AND activity_type IN ('user_created', 'user_deleted', 'role_changed')
       ORDER BY created_at DESC`
        ];
        const [multipleFailedResult, bulkDeleteResult, offHoursResult] = await Promise.all(queries.map(query => pool_1.default.query(query)));
        const suspiciousActivity = {
            multiple_failed_logins: multipleFailedResult.rows,
            bulk_deletes: bulkDeleteResult.rows,
            off_hours_activity: offHoursResult.rows,
            detected_at: new Date().toISOString()
        };
        const totalSuspicious = multipleFailedResult.rowCount + bulkDeleteResult.rowCount + offHoursResult.rowCount;
        if (totalSuspicious > 0) {
            await logAdminActivity('security_alert', `Detected ${totalSuspicious} suspicious activities`, 'system', 'admin', null, null, { suspicious_count: totalSuspicious });
        }
        return suspiciousActivity;
    }
    catch (error) {
        console.error('Error detecting suspicious activity:', error);
        throw error;
    }
}
//# sourceMappingURL=activity-operations.js.map