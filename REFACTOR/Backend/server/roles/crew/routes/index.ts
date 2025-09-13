/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 * 
 * Description: Complete Crew API routes - all endpoints for Crew hub
 * Function: Compose and mount route handlers for Crew module
 * Importance: Centralizes Crew routing surface with full endpoint coverage
 * Connects to: Route modules for Crew functionality
 * 
 * Notes: Routes map to Crew hub tabs and provide complete API coverage
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { requireCaps, bypassAuth } from '../../../middleware/requireCaps';

// Import all route modules
import dashboard from './dashboard';
import profile from './profile';
import ecosystem from './ecosystem';
import services from './services';
import orders from './orders';
import reports from './reports';
import support from './support';

const router = Router();

// Apply authentication to all crew routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.warn('⚠️  Crew routes: Authentication bypassed for development');
  router.use(bypassAuth());
} else {
  router.use(authenticate);
}

// Mount all crew route modules
router.use('/dashboard', dashboard);
router.use('/profile', profile);
router.use('/ecosystem', ecosystem);
router.use('/services', services);
router.use('/orders', orders);
router.use('/reports', reports);
router.use('/support', support);

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    module: 'crew',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

export default router;