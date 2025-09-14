/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: profile.ts
 * 
 * Description: Contractor profile read/update endpoints (GET/PATCH /profile)
 * Function: Handle contractor profile data operations
 * Importance: Manages contractor profile information for Contractor role
 * Connects to: profile.service.ts, profile.repo.ts, validators
 * 
 * Notes: Handles contractor-specific profile fields and validations
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as profileService from '../services/profile.service';

const router = Router();

// Get contractor profile
router.get(
  '/',
  requireCaps('profile:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const profile = await profileService.getProfile(contractorId);
      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load profile' });
    }
  }
);

// Update contractor profile
router.patch(
  '/',
  requireCaps('profile:edit'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const updatedProfile = await profileService.updateProfile(contractorId, req.body);
      res.json({ success: true, data: updatedProfile });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

export default router;