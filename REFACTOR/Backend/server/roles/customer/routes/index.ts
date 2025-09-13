/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 * 
 * Description: Complete Customer API routes - all endpoints for Customer hub
 * Function: Compose and mount route handlers for Customer module
 * Importance: Centralizes Customer routing surface with full endpoint coverage
 * Connects to: Route modules for Customer functionality
 * 
 * Notes: Routes map to Customer hub tabs and provide complete API coverage
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

// Apply authentication to all customer routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.warn('⚠️  Customer routes: Authentication bypassed for development');
  router.use(bypassAuth());
} else {
  router.use(authenticate);
}

// Mount all customer route modules
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
    module: 'customer',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

export default router;