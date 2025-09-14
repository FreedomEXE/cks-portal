/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: profile.ts
 * 
 * Description: profile endpoints for center role
 * Function: Handle center profile operations
 * Importance: profile functionality for center users
 * Connects to: profile.service.ts
 * 
 * Notes: Center-specific profile endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as profileService from '../services/profile.service';

const router = Router();

// Placeholder profile endpoint
router.get(
  '/',
  requireCaps('profile:view'),
  async (req: any, res) => {
    try {
      const centerId = req.user?.userId;
      if (!centerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await profileService.getProfileData(centerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to load profile' });
    }
  }
);

export default router;