"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * File: dashboard.ts
 *
 * Description: Endpoints for Contractor dashboard KPIs (GET /dashboard/kpis) for Contractor Users
 * Function: Expose KPI data for dashboard widgets.
 * Importance: Provides overview insights for Contractor role.
 * Connects to: dashboard.service.ts, activity.repo.ts, domain repos.
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const dashboardService = __importStar(require("../services/dashboard.service"));
const router = (0, express_1.Router)();
// KPIs endpoint
router.get('/kpis', (0, requireCaps_1.requireCaps)('dashboard:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId || 'test-contractor-001'; // Fallback for testing
        const kpis = await dashboardService.getDashboardKPIs(contractorId);
        res.json({ success: true, data: kpis });
    }
    catch (error) {
        console.error('Dashboard KPIs error:', error);
        res.status(500).json({ success: false, error: 'Failed to load KPIs' });
    }
});
// Comprehensive dashboard data endpoint
router.get('/data', (0, requireCaps_1.requireCaps)('dashboard:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId || 'test-contractor-001'; // Fallback for testing
        const dashboardData = await dashboardService.getDashboardData(contractorId);
        res.json({ success: true, data: dashboardData });
    }
    catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ success: false, error: 'Failed to load dashboard data' });
    }
});
// Orders overview endpoint
router.get('/orders', (0, requireCaps_1.requireCaps)('dashboard:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId || 'test-contractor-001'; // Fallback for testing
        const ordersOverview = await dashboardService.getOrdersOverview(contractorId);
        res.json({ success: true, data: ordersOverview });
    }
    catch (error) {
        console.error('Orders overview error:', error);
        res.status(500).json({ success: false, error: 'Failed to load orders overview' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map