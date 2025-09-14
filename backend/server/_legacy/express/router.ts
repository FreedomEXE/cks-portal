/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: router.ts
 *
 * Description: Manager role router - composes domain routes with manager configuration
 * Function: Mount domain route factories configured for manager role capabilities
 * Importance: Role entry point that defines manager API surface using shared domains
 * Connects to: Domain route factories, manager config, capability enforcement
 */

import { Router } from 'express';
import { authenticate } from '../../core/auth/authenticate';
import { requireCaps, bypassAuth } from '../../core/auth/requireCaps';
import { ManagerConfig } from './config';

// Import domain route factories
import { createDashboardRouter } from '../../domains/dashboard/routes.factory';
import { createCatalogRouter } from '../../domains/catalog/routes.factory';

const router = Router();

// Apply authentication to all manager routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.warn('⚠️  Manager routes: Authentication bypassed for development');
  router.use(bypassAuth());
} else {
  router.use(authenticate);
}

// Mount domain routers with manager configuration
router.use('/dashboard', createDashboardRouter(ManagerConfig.domains.dashboard));

// Catalog routes
router.use('/catalog', createCatalogRouter(ManagerConfig.domains.catalog));

// Profile routes (placeholder - would use profile route factory)
router.use('/profile', createProfileRouterPlaceholder());

// Directory routes (placeholder - would use directory route factory)
router.use('/ecosystem', createDirectoryRouterPlaceholder());

// Services routes (placeholder - would use services route factory)
router.use('/services', createServicesRouterPlaceholder());

// Orders routes (placeholder - would use orders route factory)
router.use('/orders', createOrdersRouterPlaceholder());

// Reports routes (placeholder - would use reports route factory)
router.use('/reports', createReportsRouterPlaceholder());

// Support routes (placeholder - would use support route factory)
router.use('/support', createSupportRouterPlaceholder());

// Manager-specific endpoints that don't fit into standard domains
router.get('/activity',
  requireCaps(ManagerConfig.capabilities.dashboard.view),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      // This would use the activity domain service
      const result = await require('../../db/connection').query(
        `SELECT id, action_type, description, created_at, metadata
         FROM system_activity
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [managerId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Activity fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load activities' });
    }
  }
);

router.get('/contractors',
  requireCaps(ManagerConfig.capabilities.contractors.view),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const result = await require('../../db/connection').query(
        `SELECT contractor_id, company_name, contact_name, email, phone, status
         FROM contractors
         WHERE cks_manager = $1 AND status != 'archived'
         ORDER BY company_name`,
        [managerId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Contractors fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load contractors' });
    }
  }
);

router.get('/centers',
  requireCaps(ManagerConfig.capabilities.centers.view),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const result = await require('../../db/connection').query(
        `SELECT center_id, center_name, city, state, status
         FROM centers
         WHERE cks_manager = $1 AND status != 'archived'
         ORDER BY center_name`,
        [managerId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Centers fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load centers' });
    }
  }
);

router.get('/customers',
  requireCaps(ManagerConfig.capabilities.customers.view),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const result = await require('../../db/connection').query(
        `SELECT customer_id, company_name, contact_name, email, phone, status
         FROM customers
         WHERE cks_manager = $1 AND status != 'archived'
         ORDER BY company_name`,
        [managerId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Customers fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load customers' });
    }
  }
);

// Clear activity endpoint
router.post('/clear-activity',
  requireCaps(ManagerConfig.capabilities.dashboard.manage),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      const { code } = req.body;

      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      // This would use the activity domain service
      await require('../../db/connection').query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          managerId,
          'manager',
          'clear_activity',
          'dashboard',
          'Manager cleared activity log',
          'activity',
          code,
          JSON.stringify({ cleared_by: managerId }),
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      res.json({ success: true, message: 'Activity log cleared' });
    } catch (error) {
      console.error('Clear activity error:', error);
      res.status(500).json({ success: false, error: 'Failed to clear activity' });
    }
  }
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    role: 'manager',
    timestamp: new Date().toISOString(),
    version: 'v1',
    domains: Object.keys(ManagerConfig.domains),
    features: Object.keys(ManagerConfig.features).filter(key =>
      ManagerConfig.features[key as keyof typeof ManagerConfig.features]
    )
  });
});

/**
 * Placeholder route factories (these would be implemented as proper domain factories)
 */
function createProfileRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(ManagerConfig.capabilities.profile.view), (req, res) => {
    res.json({ message: 'Profile routes - to be implemented with profile domain factory' });
  });
  return router;
}

function createDirectoryRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(ManagerConfig.capabilities.directory.view), (req, res) => {
    res.json({ message: 'Directory routes - to be implemented with directory domain factory' });
  });
  return router;
}

function createServicesRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(ManagerConfig.capabilities.services.view), (req, res) => {
    res.json({ message: 'Services routes - to be implemented with services domain factory' });
  });
  return router;
}

function createOrdersRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(ManagerConfig.capabilities.orders.view), (req, res) => {
    res.json({ message: 'Orders routes - to be implemented with orders domain factory' });
  });
  return router;
}

function createReportsRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(ManagerConfig.capabilities.reports.view), (req, res) => {
    res.json({ message: 'Reports routes - to be implemented with reports domain factory' });
  });
  return router;
}

function createSupportRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(ManagerConfig.capabilities.support.view), (req, res) => {
    res.json({ message: 'Support routes - to be implemented with support domain factory' });
  });
  return router;
}

export default router;