/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.ts
 * 
 * Description: Endpoints for Manager dashboard KPIs (GET /dashboard/kpis) for Manager Users
 * Function: Expose KPI data for dashboard widgets.
 * Importance: Provides overview insights for Manager role.
 * Connects to: dashboard.service.ts, activity.repo.ts, domain repos.
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as dashboardService from '../services/dashboard.service';

const router = Router();

router.get(
  '/kpis',
  requireCaps('dashboard:view'),
  async (req: any, res) => {
    try {
      const managerId = req.user?.userId;
      const kpis = await dashboardService.getDashboardKPIs(managerId);
      res.json({ success: true, data: kpis });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to load KPIs' });
    }
  }
);

export default router;
