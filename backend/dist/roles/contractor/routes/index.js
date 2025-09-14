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
 * Description: Complete Contractor API routes - all endpoints for Contractor hub
 * Function: Compose and mount route handlers for Contractor module
 * Importance: Centralizes Contractor routing surface with full endpoint coverage
 * Connects to: dashboard.ts, profile.ts, services.ts, ecosystem.ts, orders.ts, reports.ts, support.ts
 *
 * Notes: Routes map to Contractor hub tabs and provide complete API coverage
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
// Apply authentication to all contractor routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('⚠️  Contractor routes: Authentication bypassed for development');
    router.use((0, requireCaps_1.bypassAuth)());
}
else {
    router.use(auth_1.authenticate);
}
// Mount all contractor route modules
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
        module: 'contractor',
        timestamp: new Date().toISOString(),
        version: 'v1'
    });
});
// Contractor-specific endpoints
router.get('/activity', (0, requireCaps_1.requireCaps)('dashboard:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        // Get recent activities for this contractor
        const result = await require('../../../Database/db/pool').query(`SELECT id, action_type, description, created_at, metadata
         FROM system_activity 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`, [contractorId]);
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Activity fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load activities' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map