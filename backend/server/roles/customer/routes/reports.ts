/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: reports.ts
 * 
 * Description: reports endpoints for customer role
 * Function: Handle customer reports operations
 * Importance: reports functionality for customer users
 * Connects to: reports.service.ts
 * 
 * Notes: Customer-specific reports endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as reportsService from '../services/reports.service';

const router = Router();

// Placeholder reports endpoint
router.get(
  '/',
  requireCaps('reports:view'),
  async (req: any, res) => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await reportsService.getReportsData(customerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({ success: false, error: 'Failed to load reports' });
    }
  }
);

export default router;