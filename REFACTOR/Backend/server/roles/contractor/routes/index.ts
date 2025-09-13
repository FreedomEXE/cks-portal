/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 * 
 * Description: Complete Contractor API routes - all endpoints for Contractor hub
 * Function: Compose and mount route handlers for Contractor module
 * Importance: Centralizes Contractor routing surface with full endpoint coverage
 * Connects to: dashboard.ts, profile.ts, services.ts, ecosystem.ts, orders.ts, reports.ts, support.ts
 * 
 * Notes: Routes map to Contractor hub tabs and provide complete API coverage
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { requireCaps, bypassAuth } from '../../../middleware/requireCaps';

// Import all route modules
import dashboard from './dashboard';
import profile from './profile';
import services from './services';
import ecosystem from './ecosystem';
import orders from './orders';
import reports from './reports';
import support from './support';

const router = Router();

// Apply authentication to all contractor routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.warn('⚠️  Contractor routes: Authentication bypassed for development');
  router.use(bypassAuth());
} else {
  router.use(authenticate);
}

// Mount all contractor route modules
router.use('/dashboard', dashboard);
router.use('/profile', profile);
router.use('/services', services);
router.use('/ecosystem', ecosystem);
router.use('/orders', orders);
router.use('/reports', reports);
router.use('/support', support);

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    module: 'contractor',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

// Contractor-specific endpoints
router.get('/activity', 
  requireCaps('dashboard:view'),
  async (req, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      // Get recent activities for this contractor
      const result = await require('../../../Database/db/pool').query(
        `SELECT id, action_type, description, created_at, metadata
         FROM system_activity 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [contractorId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Activity fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load activities' });
    }
  }
);

export default router;