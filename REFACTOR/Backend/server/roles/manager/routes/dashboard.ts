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

// KPIs endpoint (existing)
router.get(
  '/kpis',
  requireCaps('dashboard:view'),
  async (req: any, res) => {
    try {
      const managerId = req.user?.userId || 'test-manager-001'; // Fallback for testing
      const kpis = await dashboardService.getDashboardKPIs(managerId);
      res.json({ success: true, data: kpis });
    } catch (error) {
      console.error('Dashboard KPIs error:', error);
      res.status(500).json({ success: false, error: 'Failed to load KPIs' });
    }
  }
);

// Comprehensive dashboard data endpoint
router.get(
  '/data',
  requireCaps('dashboard:view'),
  async (req: any, res) => {
    try {
      const managerId = req.user?.userId || 'test-manager-001'; // Fallback for testing
      const dashboardData = await dashboardService.getDashboardData(managerId);
      res.json({ success: true, data: dashboardData });
    } catch (error) {
      console.error('Dashboard data error:', error);
      res.status(500).json({ success: false, error: 'Failed to load dashboard data' });
    }
  }
);

// Orders overview endpoint
router.get(
  '/orders',
  requireCaps('dashboard:view'),
  async (req: any, res) => {
    try {
      const managerId = req.user?.userId || 'test-manager-001'; // Fallback for testing
      const ordersOverview = await dashboardService.getOrdersOverview(managerId);
      res.json({ success: true, data: ordersOverview });
    } catch (error) {
      console.error('Orders overview error:', error);
      res.status(500).json({ success: false, error: 'Failed to load orders overview' });
    }
  }
);

export default router;
