/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: reports.ts
 * 
 * Description: reports endpoints for crew role
 * Function: Handle crew reports operations
 * Importance: reports functionality for crew users
 * Connects to: reports.service.ts
 * 
 * Notes: Crew-specific reports endpoints
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
      const crewId = req.user?.userId;
      if (!crewId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await reportsService.getReportsData(crewId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({ success: false, error: 'Failed to load reports' });
    }
  }
);

export default router;