/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: orders.ts
 * 
 * Description: orders endpoints for customer role
 * Function: Handle customer orders operations
 * Importance: orders functionality for customer users
 * Connects to: orders.service.ts
 * 
 * Notes: Customer-specific orders endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as ordersService from '../services/orders.service';

const router = Router();

// Placeholder orders endpoint
router.get(
  '/',
  requireCaps('orders:view'),
  async (req: any, res) => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await ordersService.getOrdersData(customerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Orders error:', error);
      res.status(500).json({ success: false, error: 'Failed to load orders' });
    }
  }
);

export default router;