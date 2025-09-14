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
 * File: support.ts
 *
 * Description: Support/KB or ticket bootstrap endpoints (GET /support)
 * Function: Handle contractor support requests and knowledge base access
 * Importance: Provides contractor with help resources and support channels
 * Connects to: support.service.ts, external helpdesk API (if any)
 *
 * Notes: Contractor-specific support and help functionality
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const supportService = __importStar(require("../services/support.service"));
const router = (0, express_1.Router)();
// Get support resources
router.get('/', (0, requireCaps_1.requireCaps)('support:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const supportData = await supportService.getSupportResources(contractorId);
        res.json({ success: true, data: supportData });
    }
    catch (error) {
        console.error('Support fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load support data' });
    }
});
// Submit support ticket
router.post('/ticket', (0, requireCaps_1.requireCaps)('support:create'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const ticket = await supportService.createSupportTicket(contractorId, req.body);
        res.json({ success: true, data: ticket });
    }
    catch (error) {
        console.error('Support ticket creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create support ticket' });
    }
});
// Get knowledge base articles
router.get('/kb', (0, requireCaps_1.requireCaps)('support:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const kbArticles = await supportService.getKnowledgeBase(contractorId, req.query);
        res.json({ success: true, data: kbArticles });
    }
    catch (error) {
        console.error('KB fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load knowledge base' });
    }
});
exports.default = router;
//# sourceMappingURL=support.js.map