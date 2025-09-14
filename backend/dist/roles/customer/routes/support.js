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
 * Description: support endpoints for customer role
 * Function: Handle customer support operations
 * Importance: support functionality for customer users
 * Connects to: support.service.ts
 *
 * Notes: Customer-specific support endpoints
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const supportService = __importStar(require("../services/support.service"));
const router = (0, express_1.Router)();
// Placeholder support endpoint
router.get('/', (0, requireCaps_1.requireCaps)('support:view'), async (req, res) => {
    try {
        const customerId = req.user?.userId;
        if (!customerId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const data = await supportService.getSupportData(customerId);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Support error:', error);
        res.status(500).json({ success: false, error: 'Failed to load support' });
    }
});
exports.default = router;
//# sourceMappingURL=support.js.map