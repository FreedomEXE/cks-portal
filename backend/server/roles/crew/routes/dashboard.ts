/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.ts
 * 
 * Description: dashboard endpoints for crew role
 * Function: Handle crew dashboard operations
 * Importance: dashboard functionality for crew users
 * Connects to: dashboard.service.ts
 * 
 * Notes: Crew-specific dashboard endpoints
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
      const crewId = req.user?.userId;
      if (!crewId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await dashboardService.getDashboardData(crewId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
  }
);

export default router;