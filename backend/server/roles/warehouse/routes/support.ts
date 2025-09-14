/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: support.ts
 * 
 * Description: support endpoints for warehouse role
 * Function: Handle warehouse support operations
 * Importance: support functionality for warehouse users
 * Connects to: support.service.ts
 * 
 * Notes: Warehouse-specific support endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as supportService from '../services/support.service';

const router = Router();

// Placeholder support endpoint
router.get(
  '/',
  requireCaps('support:view'),
  async (req: any, res) => {
    try {
      const warehouseId = req.user?.userId;
      if (!warehouseId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await supportService.getSupportData(warehouseId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Support error:', error);
      res.status(500).json({ success: false, error: 'Failed to load support' });
    }
  }
);

export default router;