/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: ecosystem.ts
 * 
 * Description: ecosystem endpoints for center role
 * Function: Handle center ecosystem operations
 * Importance: ecosystem functionality for center users
 * Connects to: ecosystem.service.ts
 * 
 * Notes: Center-specific ecosystem endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as ecosystemService from '../services/ecosystem.service';

const router = Router();

// Placeholder ecosystem endpoint
router.get(
  '/',
  requireCaps('ecosystem:view'),
  async (req: any, res) => {
    try {
      const centerId = req.user?.userId;
      if (!centerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await ecosystemService.getEcosystemData(centerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Ecosystem error:', error);
      res.status(500).json({ success: false, error: 'Failed to load ecosystem' });
    }
  }
);

export default router;