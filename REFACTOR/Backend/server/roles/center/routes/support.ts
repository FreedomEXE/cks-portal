/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: support.ts
 * 
 * Description: support endpoints for center role
 * Function: Handle center support operations
 * Importance: support functionality for center users
 * Connects to: support.service.ts
 * 
 * Notes: Center-specific support endpoints
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
      const centerId = req.user?.userId;
      if (!centerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await supportService.getSupportData(centerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Support error:', error);
      res.status(500).json({ success: false, error: 'Failed to load support' });
    }
  }
);

export default router;