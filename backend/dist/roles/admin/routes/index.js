"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * File: index.ts
 *
 * Description: Complete Admin API routes - all endpoints for Admin system management
 * Function: Compose and mount route handlers for Admin module
 * Importance: Centralizes Admin routing surface with system-wide management capabilities
 * Connects to: users.ts, organizations.ts, system.ts, audit.ts, roles.ts
 *
 * Notes: Admin routes provide comprehensive system administration and user management
 */
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth");
const requireCaps_1 = require("../../../middleware/requireCaps");
// Import all admin route modules
const users_1 = __importDefault(require("./users"));
const organizations_1 = __importDefault(require("./organizations"));
const system_1 = __importDefault(require("./system"));
const audit_1 = __importDefault(require("./audit"));
const roles_1 = __importDefault(require("./roles"));
const router = (0, express_1.Router)();
// Apply authentication to all admin routes (no bypass for admin)
router.use(auth_1.authenticate);
// Admin-specific middleware for enhanced security logging
router.use(async (req, res, next) => {
    try {
        const adminId = req.user?.userId;
        const adminRole = req.user?.role_code;
        if (adminRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        // Log all admin API access for security audit
        if (adminId) {
            const pool = require('../../../Database/db/pool');
            await pool.query(`INSERT INTO admin_activity_log (log_id, admin_id, action, target_type, details, ip_address, user_agent, result)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                adminId,
                `API_ACCESS_${req.method}`,
                'api_endpoint',
                JSON.stringify({
                    path: req.path,
                    method: req.method,
                    query: req.query,
                    body: req.method !== 'GET' ? req.body : undefined
                }),
                req.ip,
                req.get('User-Agent'),
                'in_progress'
            ]);
        }
        next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        next(); // Continue even if logging fails
    }
});
// Mount all admin route modules
router.use('/users', users_1.default);
router.use('/organizations', organizations_1.default);
router.use('/system', system_1.default);
router.use('/audit', audit_1.default);
router.use('/roles', roles_1.default);
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        module: 'admin',
        timestamp: new Date().toISOString(),
        version: 'v1',
        capabilities: 'system-administration'
    });
});
// Admin dashboard overview
router.get('/dashboard', (0, requireCaps_1.requireCaps)('system:monitor'), async (req, res) => {
    try {
        const pool = require('../../../Database/db/pool');
        // Get system overview statistics
        const [userStats, orgStats, systemHealth, recentActivity] = await Promise.all([
            // User statistics
            pool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE status = 'active') as active_users,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week
          FROM system_users
          WHERE archived = false
        `),
            // Organization statistics
            pool.query(`
          SELECT 
            COUNT(*) as total_orgs,
            COUNT(*) FILTER (WHERE status = 'active') as active_orgs
          FROM organizations
          WHERE archived = false
        `),
            // System health check
            pool.query(`
          SELECT service_name, status, last_check, response_time
          FROM system_health
          ORDER BY last_check DESC
          LIMIT 10
        `),
            // Recent admin activity
            pool.query(`
          SELECT log_id, admin_id, action, target_type, created_at, result
          FROM admin_activity_log
          ORDER BY created_at DESC
          LIMIT 20
        `)
        ]);
        res.json({
            success: true,
            data: {
                users: userStats.rows[0],
                organizations: orgStats.rows[0],
                system_health: systemHealth.rows,
                recent_activity: recentActivity.rows
            }
        });
    }
    catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to load dashboard data' });
    }
});
// System metrics endpoint
router.get('/metrics', (0, requireCaps_1.requireCaps)('system:monitor'), async (req, res) => {
    try {
        const pool = require('../../../Database/db/pool');
        const metrics = await pool.query(`
        SELECT metric_name, metric_value, tags, collected_at
        FROM system_metrics
        WHERE collected_at > NOW() - INTERVAL '1 hour'
        ORDER BY collected_at DESC
        LIMIT 100
      `);
        res.json({
            success: true,
            data: metrics.rows
        });
    }
    catch (error) {
        console.error('System metrics error:', error);
        res.status(500).json({ success: false, error: 'Failed to load system metrics' });
    }
});
// Admin capabilities check
router.get('/capabilities', async (req, res) => {
    try {
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(400).json({ success: false, error: 'Admin ID required' });
        }
        const pool = require('../../../Database/db/pool');
        // Get admin capabilities from permission cache
        const capabilities = await pool.query(`
        SELECT DISTINCT ac.capability_name, ac.category
        FROM admin_permission_cache apc
        JOIN admin_capabilities ac ON apc.capability_id = ac.capability_id
        WHERE apc.admin_id = $1 AND apc.is_active = true
        AND (apc.expires_at IS NULL OR apc.expires_at > NOW())
        ORDER BY ac.category, ac.capability_name
      `, [adminId]);
        res.json({
            success: true,
            data: capabilities.rows
        });
    }
    catch (error) {
        console.error('Admin capabilities error:', error);
        res.status(500).json({ success: false, error: 'Failed to load admin capabilities' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map