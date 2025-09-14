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
 * File: orders.ts
 *
 * Description: Orders list/create/update endpoints (GET/POST/PATCH /orders)
 * Function: Handle contractor order operations and management
 * Importance: Core functionality for contractor order processing
 * Connects to: orders.service.ts, orders.repo.ts, validators, activity logs
 *
 * Notes: Contractor-specific order management and workflow
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const ordersService = __importStar(require("../services/orders.service"));
const router = (0, express_1.Router)();
// Get contractor orders
router.get('/', (0, requireCaps_1.requireCaps)('orders:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const orders = await ordersService.getOrders(contractorId, req.query);
        res.json({ success: true, data: orders });
    }
    catch (error) {
        console.error('Orders fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load orders' });
    }
});
// Get specific order
router.get('/:orderId', (0, requireCaps_1.requireCaps)('orders:view'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        const { orderId } = req.params;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const order = await ordersService.getOrderById(contractorId, orderId);
        res.json({ success: true, data: order });
    }
    catch (error) {
        console.error('Order fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to load order' });
    }
});
// Update order status
router.patch('/:orderId', (0, requireCaps_1.requireCaps)('orders:edit'), async (req, res) => {
    try {
        const contractorId = req.user?.userId;
        const { orderId } = req.params;
        if (!contractorId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const updatedOrder = await ordersService.updateOrder(contractorId, orderId, req.body);
        res.json({ success: true, data: updatedOrder });
    }
    catch (error) {
        console.error('Order update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map