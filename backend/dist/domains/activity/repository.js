"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityForDashboard = getActivityForDashboard;
exports.clearActivityLogs = clearActivityLogs;
exports.getActivityStats = getActivityStats;
/**
 * File: repository.ts
 *
 * Description: Activity log data access - role-scoped activity queries
 * Function: Fetch activity logs with proper scoping and filtering
 * Importance: Secure activity data access respecting role boundaries
 * Connects to: system_activity table, RLS policies, role-based filtering
 */
const connection_1 = __importDefault(require("../../db/connection"));
/**
 * Get activity logs for dashboard based on user scope
 */
async function getActivityForDashboard(userId, scope, roleCode, filters = {}) {
    try {
        let query = '';
        let params = [];
        let paramCount = 0;
        // Base query structure
        const baseSelect = `
      SELECT id, user_id, user_role, action_type, action_category, description,
             entity_type, entity_id, created_at, metadata
      FROM system_activity
    `;
        // Build WHERE conditions based on scope
        const conditions = [];
        switch (scope) {
            case 'global':
                // Admin/Manager can see all activity (with potential filtering)
                break;
            case 'ecosystem':
                // Contractor sees their ecosystem activity
                conditions.push(`(
          user_id = $${++paramCount} OR
          user_id IN (
            SELECT customer_id FROM customers WHERE contractor_id = $${paramCount}
            UNION
            SELECT center_id FROM centers c
            JOIN customers cus ON c.customer_id = cus.customer_id
            WHERE cus.contractor_id = $${paramCount}
            UNION
            SELECT crew_id FROM crew WHERE contractor_id = $${paramCount}
          )
        )`);
                params.push(userId, userId, userId, userId);
                paramCount += 3; // We used the same param 4 times, but only added 3 more
                break;
            case 'entity':
                // User sees only their own activity
                conditions.push(`user_id = $${++paramCount}`);
                params.push(userId);
                break;
        }
        // Add filters
        if (filters.category) {
            conditions.push(`action_category = $${++paramCount}`);
            params.push(filters.category);
        }
        if (filters.action_type) {
            conditions.push(`action_type = $${++paramCount}`);
            params.push(filters.action_type);
        }
        if (filters.date_from) {
            conditions.push(`created_at >= $${++paramCount}::date`);
            params.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push(`created_at <= $${++paramCount}::date + interval '1 day'`);
            params.push(filters.date_to);
        }
        // Build final query
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = filters.limit || 10;
        query = `
      ${baseSelect}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount}
    `;
        params.push(limit);
        const result = await connection_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('Error getting activity for dashboard:', error);
        throw error;
    }
}
/**
 * Clear activity logs (admin/manager only)
 */
async function clearActivityLogs(userId, category) {
    try {
        let query = 'DELETE FROM system_activity';
        let params = [];
        if (category) {
            query += ' WHERE action_category = $1';
            params.push(category);
        }
        const result = await connection_1.default.query(query, params);
        return result.rowCount || 0;
    }
    catch (error) {
        console.error('Error clearing activity logs:', error);
        throw error;
    }
}
/**
 * Get activity statistics
 */
async function getActivityStats(userId, scope, roleCode, dateRange) {
    try {
        // This would be customized based on scope and role
        // For now, return basic stats
        return {
            total: 0,
            byCategory: {},
            byType: {},
            trends: []
        };
    }
    catch (error) {
        console.error('Error getting activity stats:', error);
        throw error;
    }
}
//# sourceMappingURL=repository.js.map