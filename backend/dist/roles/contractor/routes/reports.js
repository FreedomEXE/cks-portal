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
 * File: reports.ts
 *
 * Description: Report catalog/access endpoints (GET /reports)
 * Function: Handle contractor reporting and analytics access
 * Importance: Provides contractor with business insights and reporting capabilities
 * Connects to: reports.service.ts, report query layer
 *
 * Notes: Contractor-specific reporting and analytics
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const reportsService = __importStar(require("../services/reports.service"));
const router = (0, express_1.Router)();
// Get available reports
router.get('/', (0, requireCaps_1.requireCaps)('reports:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const reports = await reportsService.getAvailableReports(contractorId);
        res.json({ success: true, data: reports });
    }
    catch (error) {
        console.error('Reports fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load reports' });
    }
});
// Generate specific report
router.get('/:reportType', (0, requireCaps_1.requireCaps)('reports:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        const { reportType } = req.params;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const reportData = await reportsService.generateReport(contractorId, reportType, req.query);
        res.json({ success: true, data: reportData });
    }
    catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate report' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map