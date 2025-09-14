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
 * Description: Complete Warehouse API routes - all endpoints for Warehouse hub
 * Function: Compose and mount route handlers for Warehouse module
 * Importance: Centralizes Warehouse routing surface with full endpoint coverage
 * Connects to: Route modules for Warehouse functionality
 *
 * Notes: Routes map to Warehouse hub tabs and provide complete API coverage
 */
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth");
const requireCaps_1 = require("../../../middleware/requireCaps");
// Import all route modules
const dashboard_1 = __importDefault(require("./dashboard"));
const profile_1 = __importDefault(require("./profile"));
const services_1 = __importDefault(require("./services"));
const orders_1 = __importDefault(require("./orders"));
const reports_1 = __importDefault(require("./reports"));
const support_1 = __importDefault(require("./support"));
const inventory_1 = __importDefault(require("./inventory"));
const deliveries_1 = __importDefault(require("./deliveries"));
const router = (0, express_1.Router)();
// Apply authentication to all warehouse routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('⚠️  Warehouse routes: Authentication bypassed for development');
    router.use((0, requireCaps_1.bypassAuth)());
}
else {
    router.use(auth_1.authenticate);
}
// Mount all warehouse route modules
router.use('/dashboard', dashboard_1.default);
router.use('/profile', profile_1.default);
router.use('/services', services_1.default);
router.use('/orders', orders_1.default);
router.use('/reports', reports_1.default);
router.use('/support', support_1.default);
router.use('/inventory', inventory_1.default);
router.use('/deliveries', deliveries_1.default);
// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        module: 'warehouse',
        timestamp: new Date().toISOString(),
        version: 'v1'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map