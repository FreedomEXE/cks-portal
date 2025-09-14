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
 * File: services.ts
 *
 * Description: Manage contractor services catalog (GET/POST/PATCH /services)
 * Function: Handle contractor service offerings and capabilities
 * Importance: Core functionality for contractor service management
 * Connects to: services.service.ts, services.repo.ts, validators
 *
 * Notes: Contractor-specific service catalog management
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const servicesService = __importStar(require("../services/services.service"));
const router = (0, express_1.Router)();
// Get contractor services
router.get('/', (0, requireCaps_1.requireCaps)('services:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const services = await servicesService.getServices(contractorId);
        res.json({ success: true, data: services });
    }
    catch (error) {
        console.error('Services fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load services' });
    }
});
// Create new service
router.post('/', (0, requireCaps_1.requireCaps)('services:create'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const newService = await servicesService.createService(contractorId, req.body);
        res.json({ success: true, data: newService });
    }
    catch (error) {
        console.error('Service creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create service' });
    }
});
// Update service
router.patch('/:serviceId', (0, requireCaps_1.requireCaps)('services:edit'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        const { serviceId } = req.params;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const updatedService = await servicesService.updateService(contractorId, serviceId, req.body);
        res.json({ success: true, data: updatedService });
    }
    catch (error) {
        console.error('Service update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update service' });
    }
});
exports.default = router;
//# sourceMappingURL=services.js.map