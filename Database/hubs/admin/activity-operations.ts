/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Admin Activity Operations
 * 
 * Description: Centralized admin database operations for activity logging and management
 * Function: Handle system activity tracking, filtering, and admin oversight
 * Importance: Critical - Provides audit trail and system monitoring capabilities
 */

import pool from '../../db/pool';

// ============================================
// ACTIVITY LOGGING
// ============================================

export async function logAdminActivity(
  activity_type: string,
  description: string,
  actor_id: string,
  actor_role: string,
  target_id?: string,
  target_type?: string,
  metadata?: Record<string, any>
) {
  try {
    const result = await pool.query(
      `INSERT INTO system_activity (activity_type, description, actor_id, actor_role, target_id, target_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING activity_id, created_at`,
      [
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id || null,
        target_type || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    throw error;
  }
}

// ============================================
// ACTIVITY RETRIEVAL
// ============================================

interface ActivityFilters {
  activity_type?: string;
  actor_role?: string;
  target_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getActivityLog(filters: ActivityFilters = {}) {
  const {
    activity_type,
    actor_role,
    target_type,
    date_from,
    date_to,
    search,
    limit = 50,
    offset = 0
  } = filters;

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

  const queryParams: any[] = [];
  let paramIndex = 1;

  // Add filters
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

  // Add ordering and pagination
  baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset for count
    ]);

    // Parse metadata JSON
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
  } catch (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }
}

// ============================================
// ACTIVITY ANALYTICS
// ============================================

export async function getActivityStatistics(days = 30) {
  try {
    const queries = [
      // Activity by type in last N days
      `SELECT activity_type, COUNT(*) as count
       FROM system_activity 
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY activity_type
       ORDER BY count DESC`,

      // Activity by role in last N days  
      `SELECT actor_role, COUNT(*) as count
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY actor_role
       ORDER BY count DESC`,

      // Daily activity counts for last N days
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,

      // Most active actors
      `SELECT actor_id, actor_role, COUNT(*) as count
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY actor_id, actor_role
       ORDER BY count DESC
       LIMIT 10`
    ];

    const [byTypeResult, byRoleResult, dailyResult, activeActorsResult] = await Promise.all(
      queries.map(query => pool.query(query))
    );

    return {
      period_days: days,
      by_type: byTypeResult.rows,
      by_role: byRoleResult.rows,
      daily_counts: dailyResult.rows,
      most_active_actors: activeActorsResult.rows,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting activity statistics:', error);
    throw error;
  }
}

// ============================================
// ACTIVITY CLEANUP
// ============================================

export async function cleanupOldActivity(days = 90) {
  try {
    const result = await pool.query(
      `DELETE FROM system_activity 
       WHERE created_at < NOW() - INTERVAL '${days} days'
       RETURNING activity_id`,
    );

    await logAdminActivity(
      'system_maintenance',
      `Cleaned up ${result.rowCount} activity records older than ${days} days`,
      'system',
      'admin'
    );

    return {
      deleted_count: result.rowCount,
      days_threshold: days
    };
  } catch (error) {
    console.error('Error cleaning up old activity records:', error);
    throw error;
  }
}

// ============================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================

export async function detectSuspiciousActivity() {
  try {
    const queries = [
      // Multiple failed login attempts from same actor
      `SELECT actor_id, COUNT(*) as failed_attempts
       FROM system_activity
       WHERE activity_type = 'login_failed' 
         AND created_at >= NOW() - INTERVAL '1 hour'
       GROUP BY actor_id
       HAVING COUNT(*) >= 5`,

      // Bulk delete operations
      `SELECT actor_id, actor_role, COUNT(*) as delete_count, 
              MAX(created_at) as latest_delete
       FROM system_activity
       WHERE activity_type = 'user_deleted'
         AND created_at >= NOW() - INTERVAL '1 hour'
       GROUP BY actor_id, actor_role
       HAVING COUNT(*) >= 10`,

      // Activity outside normal business hours
      `SELECT actor_id, actor_role, activity_type, created_at
       FROM system_activity
       WHERE created_at >= NOW() - INTERVAL '24 hours'
         AND (EXTRACT(hour FROM created_at) < 6 OR EXTRACT(hour FROM created_at) > 22)
         AND activity_type IN ('user_created', 'user_deleted', 'role_changed')
       ORDER BY created_at DESC`
    ];

    const [multipleFailedResult, bulkDeleteResult, offHoursResult] = await Promise.all(
      queries.map(query => pool.query(query))
    );

    const suspiciousActivity = {
      multiple_failed_logins: multipleFailedResult.rows,
      bulk_deletes: bulkDeleteResult.rows,
      off_hours_activity: offHoursResult.rows,
      detected_at: new Date().toISOString()
    };

    // Log if any suspicious activity found
    const totalSuspicious = multipleFailedResult.rowCount + bulkDeleteResult.rowCount + offHoursResult.rowCount;
    if (totalSuspicious > 0) {
      await logAdminActivity(
        'security_alert',
        `Detected ${totalSuspicious} suspicious activities`,
        'system',
        'admin',
        null,
        null,
        { suspicious_count: totalSuspicious }
      );
    }

    return suspiciousActivity;
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    throw error;
  }
}