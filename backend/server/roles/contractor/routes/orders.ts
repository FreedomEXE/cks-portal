/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

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

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as ordersService from '../services/orders.service';

const router = Router();

// Get contractor orders
router.get(
  '/',
  requireCaps('orders:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const orders = await ordersService.getOrders(contractorId, req.query);
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Orders fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load orders' });
    }
  }
);

// Get specific order
router.get(
  '/:orderId',
  requireCaps('orders:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      const { orderId } = req.params;
      
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const order = await ordersService.getOrderById(contractorId, orderId);
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Order fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load order' });
    }
  }
);

// Update order status
router.patch(
  '/:orderId',
  requireCaps('orders:edit'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      const { orderId } = req.params;
      
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const updatedOrder = await ordersService.updateOrder(contractorId, orderId, req.body);
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error('Order update error:', error);
      res.status(500).json({ success: false, error: 'Failed to update order' });
    }
  }
);

export default router;