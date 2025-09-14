/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.ts
 * 
 * Description: Manage contractor services catalog (GET/POST/PATCH /services)
 * Function: Handle contractor service offerings and capabilities
 * Importance: Core functionality for contractor service management
 * Connects to: services.service.ts, services.repo.ts, validators
 * 
 * Notes: Contractor-specific service catalog management
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as servicesService from '../services/services.service';

const router = Router();

// Get contractor services
router.get(
  '/',
  requireCaps('services:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const services = await servicesService.getServices(contractorId);
      res.json({ success: true, data: services });
    } catch (error) {
      console.error('Services fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load services' });
    }
  }
);

// Create new service
router.post(
  '/',
  requireCaps('services:create'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const newService = await servicesService.createService(contractorId, req.body);
      res.json({ success: true, data: newService });
    } catch (error) {
      console.error('Service creation error:', error);
      res.status(500).json({ success: false, error: 'Failed to create service' });
    }
  }
);

// Update service
router.patch(
  '/:serviceId',
  requireCaps('services:edit'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      const { serviceId } = req.params;
      
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const updatedService = await servicesService.updateService(contractorId, serviceId, req.body);
      res.json({ success: true, data: updatedService });
    } catch (error) {
      console.error('Service update error:', error);
      res.status(500).json({ success: false, error: 'Failed to update service' });
    }
  }
);

export default router;