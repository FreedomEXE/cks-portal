/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.ts
 * 
 * Description: dashboard endpoints for customer role
 * Function: Handle customer dashboard operations
 * Importance: dashboard functionality for customer users
 * Connects to: dashboard.service.ts
 * 
 * Notes: Customer-specific dashboard endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as dashboardService from '../services/dashboard.service';

const router = Router();

// Placeholder dashboard endpoint
router.get(
  '/',
  requireCaps('dashboard:view'),
  async (req: any, res) => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await dashboardService.getDashboardData(customerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
  }
);

export default router;