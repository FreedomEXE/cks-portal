/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: support.ts
 * 
 * Description: support endpoints for crew role
 * Function: Handle crew support operations
 * Importance: support functionality for crew users
 * Connects to: support.service.ts
 * 
 * Notes: Crew-specific support endpoints
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
      const crewId = req.user?.userId;
      if (!crewId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await supportService.getSupportData(crewId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Support error:', error);
      res.status(500).json({ success: false, error: 'Failed to load support' });
    }
  }
);

export default router;