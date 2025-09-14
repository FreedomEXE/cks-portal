"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
/**
 * activity.ts
 *
 * Description: System activity/audit log API for admin monitoring
 * Function: Track and retrieve system-wide activities and events
 * Importance: Critical - Provides admin visibility into system operations
 */
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
// Fallback logger implementation
const logger = {
    error: (...args) => console.error(...args),
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    debug: (...args) => console.debug(...args),
};
const router = express_1.default.Router();
// GET /api/activity - Get recent system activity for admin dashboard
router.get('/', async (req, res) => {
    try {
        const { limit = 25, offset = 0, type } = req.query;
        // Check if table exists first
        const tableCheck = await pool_1.default.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_activity'
      )
    `);
        if (!tableCheck.rows[0].exists) {
            // Return empty data if table doesn't exist yet
            return res.json({
                success: true,
                data: [],
                total: 0,
                page: 1,
                pageSize: Number(limit)
            });
        }
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (type) {
            whereClause += ` AND activity_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        const query = `
      SELECT 
        activity_id,
        activity_type,
        actor_id,
        actor_role,
        target_id,
        target_type,
        description,
        metadata,
        created_at
      FROM system_activity
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        const countQuery = `SELECT COUNT(*) FROM system_activity ${whereClause}`;
        const [activities, total] = await Promise.all([
            pool_1.default.query(query, [...params, Number(limit), Number(offset)]),
            pool_1.default.query(countQuery, params)
        ]);
        res.json({
            success: true,
            data: activities.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(Number(offset) / Number(limit)) + 1,
            pageSize: Number(limit)
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to fetch system activity');
        res.status(500).json({ success: false, error: 'Failed to fetch system activity' });
    }
});
// POST /api/activity - Log new system activity (internal use)
router.post('/', async (req, res) => {
    try {
        const { activity_type, actor_id, actor_role, target_id, target_type, description, metadata } = req.body;
        if (!activity_type || !description) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: activity_type, description'
            });
        }
        await pool_1.default.query(`
      INSERT INTO system_activity (
        activity_type, actor_id, actor_role, target_id, target_type, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [activity_type, actor_id, actor_role, target_id, target_type, description, metadata]);
        res.status(201).json({
            success: true,
            message: 'Activity logged successfully'
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to log system activity');
        res.status(500).json({ success: false, error: 'Failed to log system activity' });
    }
});
// GET /api/activity/stats - Get activity statistics for admin dashboard
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN activity_type LIKE '%_created' THEN 1 END) as creations,
        COUNT(CASE WHEN activity_type LIKE 'user_%' THEN 1 END) as user_activities,
        COUNT(CASE WHEN activity_type LIKE 'support_%' THEN 1 END) as support_activities
      FROM system_activity
    `;
        const typeStatsQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY activity_type
      ORDER BY count DESC
      LIMIT 10
    `;
        const [stats, typeStats] = await Promise.all([
            pool_1.default.query(statsQuery),
            pool_1.default.query(typeStatsQuery)
        ]);
        res.json({
            success: true,
            data: {
                overview: stats.rows[0],
                by_type: typeStats.rows
            }
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to fetch activity stats');
        res.status(500).json({ success: false, error: 'Failed to fetch activity stats' });
    }
});
// Utility function to log activity (can be imported by other modules)
async function logActivity(activity_type, description, actor_id, actor_role, target_id, target_type, metadata) {
    try {
        await pool_1.default.query(`
      INSERT INTO system_activity (
        activity_type, actor_id, actor_role, target_id, target_type, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [activity_type, actor_id, actor_role, target_id, target_type, description, metadata]);
    }
    catch (error) {
        logger.error({ error, activity_type, description }, 'Failed to log activity');
    }
}
exports.default = router;
//# sourceMappingURL=activity.js.map