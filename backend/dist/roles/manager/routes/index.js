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
 * Description: Complete Manager API routes - all endpoints for Manager hub
 * Function: Compose and mount route handlers for Manager module
 * Importance: Centralizes Manager routing surface with full endpoint coverage
 * Connects to: dashboard.ts, profile.ts, services.ts, ecosystem.ts, orders.ts, reports.ts, support.ts
 *
 * Notes: Routes map to Manager hub tabs and provide complete API coverage
 */
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth");
const requireCaps_1 = require("../../../middleware/requireCaps");
// Import all route modules
const dashboard_1 = __importDefault(require("./dashboard"));
const profile_1 = __importDefault(require("./profile"));
const services_1 = __importDefault(require("./services"));
const ecosystem_1 = __importDefault(require("./ecosystem"));
const orders_1 = __importDefault(require("./orders"));
const reports_1 = __importDefault(require("./reports"));
const support_1 = __importDefault(require("./support"));
const router = (0, express_1.Router)();
// Apply authentication to all manager routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('⚠️  Manager routes: Authentication bypassed for development');
    router.use((0, requireCaps_1.bypassAuth)());
}
else {
    router.use(auth_1.authenticate);
}
// Mount all manager route modules
router.use('/dashboard', dashboard_1.default);
router.use('/profile', profile_1.default);
router.use('/services', services_1.default);
router.use('/ecosystem', ecosystem_1.default);
router.use('/orders', orders_1.default);
router.use('/reports', reports_1.default);
router.use('/support', support_1.default);
// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        module: 'manager',
        timestamp: new Date().toISOString(),
        version: 'v1'
    });
});
// Manager-specific endpoints (activity, contractors, etc. from original inventory)
router.get('/activity', (0, requireCaps_1.requireCaps)('dashboard:view'), async (req, res) => {
    try {
        const managerId = req.user?.userId;
        if (!managerId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        // Get recent activities for this manager
        const result = await require('../../../Database/db/pool').query(`SELECT id, action_type, description, created_at, metadata
         FROM system_activity 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`, [managerId]);
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Activity fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load activities' });
    }
});
router.get('/contractors', (0, requireCaps_1.requireCaps)('contractors:view'), async (req, res) => {
    try {
        const managerId = req.user?.userId;
        if (!managerId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const result = await require('../../../Database/db/pool').query(`SELECT contractor_id, company_name, contact_name, email, phone, status
         FROM contractors 
         WHERE cks_manager = $1 AND status != 'archived'
         ORDER BY company_name`, [managerId]);
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Contractors fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load contractors' });
    }
});
router.get('/centers', (0, requireCaps_1.requireCaps)('centers:view'), async (req, res) => {
    try {
        const managerId = req.user?.userId;
        if (!managerId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const result = await require('../../../Database/db/pool').query(`SELECT center_id, center_name, city, state, status
         FROM centers 
         WHERE cks_manager = $1 AND status != 'archived'
         ORDER BY center_name`, [managerId]);
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Centers fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load centers' });
    }
});
router.get('/customers', (0, requireCaps_1.requireCaps)('customers:view'), async (req, res) => {
    try {
        const managerId = req.user?.userId;
        if (!managerId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const result = await require('../../../Database/db/pool').query(`SELECT customer_id, company_name, contact_name, email, phone, status
         FROM customers 
         WHERE cks_manager = $1 AND status != 'archived'
         ORDER BY company_name`, [managerId]);
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Customers fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load customers' });
    }
});
// Clear activity endpoint (from original manager routes)
router.post('/clear-activity', (0, requireCaps_1.requireCaps)('dashboard:manage'), async (req, res) => {
    try {
        const managerId = req.user?.userId;
        const { code } = req.body;
        if (!managerId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        // Log the clear activity action
        await require('../../../Database/db/pool').query(`SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            managerId,
            'manager',
            'clear_activity',
            'dashboard',
            'Manager cleared activity log',
            'activity',
            code,
            JSON.stringify({ cleared_by: managerId }),
            null,
            req.ip,
            req.get('User-Agent')
        ]);
        res.json({ success: true, message: 'Activity log cleared' });
    }
    catch (error) {
        console.error('Clear activity error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear activity' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map