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
 * Description: Complete Crew API routes - all endpoints for Crew hub
 * Function: Compose and mount route handlers for Crew module
 * Importance: Centralizes Crew routing surface with full endpoint coverage
 * Connects to: Route modules for Crew functionality
 *
 * Notes: Routes map to Crew hub tabs and provide complete API coverage
 */
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth");
const requireCaps_1 = require("../../../middleware/requireCaps");
// Import all route modules
const dashboard_1 = __importDefault(require("./dashboard"));
const profile_1 = __importDefault(require("./profile"));
const ecosystem_1 = __importDefault(require("./ecosystem"));
const services_1 = __importDefault(require("./services"));
const orders_1 = __importDefault(require("./orders"));
const reports_1 = __importDefault(require("./reports"));
const support_1 = __importDefault(require("./support"));
const router = (0, express_1.Router)();
// Apply authentication to all crew routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('⚠️  Crew routes: Authentication bypassed for development');
    router.use((0, requireCaps_1.bypassAuth)());
}
else {
    router.use(auth_1.authenticate);
}
// Mount all crew route modules
router.use('/dashboard', dashboard_1.default);
router.use('/profile', profile_1.default);
router.use('/ecosystem', ecosystem_1.default);
router.use('/services', services_1.default);
router.use('/orders', orders_1.default);
router.use('/reports', reports_1.default);
router.use('/support', support_1.default);
// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        module: 'crew',
        timestamp: new Date().toISOString(),
        version: 'v1'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map