/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.ts
 * 
 * Description: services endpoints for customer role
 * Function: Handle customer services operations
 * Importance: services functionality for customer users
 * Connects to: services.service.ts
 * 
 * Notes: Customer-specific services endpoints
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
      const customerId = req.user?.userId;
      if (!customerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await servicesService.getServicesData(customerId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Services error:', error);
      res.status(500).json({ success: false, error: 'Failed to load services' });
    }
  }
);

export default router;