/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: deliveries.ts
 * 
 * Description: deliveries endpoints for warehouse role
 * Function: Handle warehouse deliveries operations
 * Importance: deliveries functionality for warehouse users
 * Connects to: deliveries.service.ts
 * 
 * Notes: Warehouse-specific deliveries endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as deliveriesService from '../services/deliveries.service';

const router = Router();

// Placeholder deliveries endpoint
router.get(
  '/',
  requireCaps('deliveries:view'),
  async (req: any, res) => {
    try {
      const warehouseId = req.user?.userId;
      if (!warehouseId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await deliveriesService.getDeliveriesData(warehouseId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Deliveries error:', error);
      res.status(500).json({ success: false, error: 'Failed to load deliveries' });
    }
  }
);

export default router;