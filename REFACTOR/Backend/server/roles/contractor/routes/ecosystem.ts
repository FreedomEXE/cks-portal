/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: ecosystem.ts
 * 
 * Description: Aggregated view of customers/centers/crews for contractor (GET /ecosystem)
 * Function: Provide ecosystem relationships and network view for contractor
 * Importance: Enables contractor to view their network connections and opportunities
 * Connects to: ecosystem.service.ts, multiple repos
 * 
 * Notes: Contractor-specific view of ecosystem relationships
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as ecosystemService from '../services/ecosystem.service';

const router = Router();

// Get ecosystem overview
router.get(
  '/',
  requireCaps('ecosystem:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const ecosystem = await ecosystemService.getEcosystemData(contractorId);
      res.json({ success: true, data: ecosystem });
    } catch (error) {
      console.error('Ecosystem fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load ecosystem data' });
    }
  }
);

// Get available opportunities
router.get(
  '/opportunities',
  requireCaps('ecosystem:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const opportunities = await ecosystemService.getOpportunities(contractorId);
      res.json({ success: true, data: opportunities });
    } catch (error) {
      console.error('Opportunities fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load opportunities' });
    }
  }
);

export default router;