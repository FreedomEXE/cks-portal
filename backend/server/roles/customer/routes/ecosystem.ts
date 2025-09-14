/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: ecosystem.ts
 * 
 * Description: ecosystem endpoints for customer role
 * Function: Handle customer ecosystem operations
 * Importance: ecosystem functionality for customer users
 * Connects to: ecosystem.service.ts
 * 
 * Notes: Customer-specific ecosystem endpoints
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
      const customerId = req.user?.userId;
      if (!customerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await ecosystemService.getEcosystemData(customerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Ecosystem error:', error);
      res.status(500).json({ success: false, error: 'Failed to load ecosystem' });
    }
  }
);

export default router;