/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 * 
 * Description: Complete Warehouse API routes - all endpoints for Warehouse hub
 * Function: Compose and mount route handlers for Warehouse module
 * Importance: Centralizes Warehouse routing surface with full endpoint coverage
 * Connects to: Route modules for Warehouse functionality
 * 
 * Notes: Routes map to Warehouse hub tabs and provide complete API coverage
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { requireCaps, bypassAuth } from '../../../middleware/requireCaps';

// Import all route modules
import dashboard from './dashboard';
import profile from './profile';
import services from './services';
import orders from './orders';
import reports from './reports';
import support from './support';
import inventory from './inventory';
import deliveries from './deliveries';

const router = Router();

// Apply authentication to all warehouse routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.warn('⚠️  Warehouse routes: Authentication bypassed for development');
  router.use(bypassAuth());
} else {
  router.use(authenticate);
}

// Mount all warehouse route modules
router.use('/dashboard', dashboard);
router.use('/profile', profile);
router.use('/services', services);
router.use('/orders', orders);
router.use('/reports', reports);
router.use('/support', support);
router.use('/inventory', inventory);
router.use('/deliveries', deliveries);

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    module: 'warehouse',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

export default router;