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
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.updateOrder = updateOrder;
exports.acceptOrder = acceptOrder;
exports.completeOrder = completeOrder;
/**
 * File: orders.service.ts
 *
 * Description: Order listing/creation; status transitions and side-effects.
 * Function: Handle contractor order operations and workflow management
 * Importance: Core business logic for contractor order processing
 * Connects to: orders.repo.ts, validators, activity.repo.ts.
 */
const ordersRepo = __importStar(require("../repositories/orders.repo"));
const activityRepo = __importStar(require("../repositories/activity.repo"));
// Get orders for contractor
async function getOrders(contractorId, filters) {
    try {
        const orders = await ordersRepo.getOrdersForContractor(contractorId, filters);
        return orders;
    }
    catch (error) {
        console.error('Error getting orders:', error);
        return [];
    }
}
// Get specific order by ID
async function getOrderById(contractorId, orderId) {
    try {
        const order = await ordersRepo.getOrderById(contractorId, orderId);
        return order;
    }
    catch (error) {
        console.error('Error getting order:', error);
        throw new Error('Order not found');
    }
}
// Update order status
async function updateOrder(contractorId, orderId, updateData) {
    try {
        const updatedOrder = await ordersRepo.updateOrder(contractorId, orderId, updateData);
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'order_updated',
            entityType: 'order',
            entityId: orderId,
            description: `Order ${orderId} updated by contractor`,
            metadata: updateData
        });
        return updatedOrder;
    }
    catch (error) {
        console.error('Error updating order:', error);
        throw new Error('Failed to update order');
    }
}
// Accept order (contractor-specific action)
async function acceptOrder(contractorId, orderId) {
    try {
        const acceptedOrder = await ordersRepo.updateOrder(contractorId, orderId, {
            status: 'accepted',
            acceptedAt: new Date(),
            acceptedBy: contractorId
        });
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'order_accepted',
            entityType: 'order',
            entityId: orderId,
            description: `Order ${orderId} accepted by contractor`,
            metadata: { acceptedAt: new Date() }
        });
        return acceptedOrder;
    }
    catch (error) {
        console.error('Error accepting order:', error);
        throw new Error('Failed to accept order');
    }
}
// Complete order (contractor-specific action)
async function completeOrder(contractorId, orderId, completionData) {
    try {
        const completedOrder = await ordersRepo.updateOrder(contractorId, orderId, {
            status: 'completed',
            completedAt: new Date(),
            completedBy: contractorId,
            ...completionData
        });
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'order_completed',
            entityType: 'order',
            entityId: orderId,
            description: `Order ${orderId} completed by contractor`,
            metadata: { completedAt: new Date(), ...completionData }
        });
        return completedOrder;
    }
    catch (error) {
        console.error('Error completing order:', error);
        throw new Error('Failed to complete order');
    }
}
//# sourceMappingURL=orders.service.js.map