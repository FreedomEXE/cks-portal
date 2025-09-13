/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.ts
 * 
 * Description: services endpoints for warehouse role
 * Function: Handle warehouse services operations
 * Importance: services functionality for warehouse users
 * Connects to: services.service.ts
 * 
 * Notes: Warehouse-specific services endpoints
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
      const warehouseId = req.user?.userId;
      if (!warehouseId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const data = await servicesService.getServicesData(warehouseId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Services error:', error);
      res.status(500).json({ success: false, error: 'Failed to load services' });
    }
  }
);

export default router;