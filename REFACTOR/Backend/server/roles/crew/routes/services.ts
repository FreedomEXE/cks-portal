/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.ts
 * 
 * Description: services endpoints for crew role
 * Function: Handle crew services operations
 * Importance: services functionality for crew users
 * Connects to: services.service.ts
 * 
 * Notes: Crew-specific services endpoints
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as servicesService from '../services/services.service';

const router = Router();

// Placeholder services endpoint
router.get(
  '/',
  requireCaps('services:view'),
  async (req: any, res) => {
    try {
      const crewId = req.user?.userId;
      if (!crewId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await servicesService.getServicesData(crewId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Services error:', error);
      res.status(500).json({ success: false, error: 'Failed to load services' });
    }
  }
);

export default router;