/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: reports.ts
 * 
 * Description: Report catalog/access endpoints (GET /reports)
 * Function: Handle contractor reporting and analytics access
 * Importance: Provides contractor with business insights and reporting capabilities
 * Connects to: reports.service.ts, report query layer
 * 
 * Notes: Contractor-specific reporting and analytics
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as reportsService from '../services/reports.service';

const router = Router();

// Get available reports
router.get(
  '/',
  requireCaps('reports:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const reports = await reportsService.getAvailableReports(contractorId);
      res.json({ success: true, data: reports });
    } catch (error) {
      console.error('Reports fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load reports' });
    }
  }
);

// Generate specific report
router.get(
  '/:reportType',
  requireCaps('reports:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      const { reportType } = req.params;
      
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const reportData = await reportsService.generateReport(contractorId, reportType, req.query);
      res.json({ success: true, data: reportData });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate report' });
    }
  }
);

export default router;