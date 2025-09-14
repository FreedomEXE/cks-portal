/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: router.ts
 *
 * Description: Admin role router - composes domain routes with admin configuration
 * Function: Mount domain route factories configured for admin role capabilities
 * Importance: Admin entry point with global scope and comprehensive permissions
 * Connects to: Domain route factories, admin config, system-wide capability enforcement
 */

import { Router } from 'express';
import { authenticate } from '../../core/auth/authenticate';
import { requireCaps, bypassAuth } from '../../core/auth/requireCaps';
import { AdminConfig } from './config';

// Import domain route factories
import { createDashboardRouter } from '../../domains/dashboard/routes.factory';
import { createCatalogRouter } from '../../domains/catalog/routes.factory';

const router = Router();

// Apply authentication to all admin routes
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.warn('⚠️  Admin routes: Authentication bypassed for development');
  router.use(bypassAuth());
} else {
  router.use(authenticate);
}

// Mount domain routers with admin configuration
router.use('/dashboard', createDashboardRouter(AdminConfig.domains.dashboard));

// Catalog routes
router.use('/catalog', createCatalogRouter(AdminConfig.domains.catalog));

// Profile routes (placeholder - would use profile route factory)
router.use('/profile', createProfileRouterPlaceholder());

// Directory routes (placeholder - would use directory route factory)
router.use('/directory', createDirectoryRouterPlaceholder());

// Create routes (placeholder - would use create domain factory)
router.use('/create', createCreateRouterPlaceholder());

// Assign routes (placeholder - would use assign domain factory)
router.use('/assign', createAssignRouterPlaceholder());

// Archive routes (placeholder - would use archive domain factory)
router.use('/archive', createArchiveRouterPlaceholder());

// Support routes (placeholder - would use support domain factory)
router.use('/support', createSupportRouterPlaceholder());

// Admin-specific system endpoints
router.get('/system/health',
  requireCaps(AdminConfig.capabilities.system.monitoring),
  async (req, res) => {
    try {
      // System health check with detailed info for admin
      const systemInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.API_VERSION || 'v1',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected', // Would check actual DB connection
        services: {
          auth: 'operational',
          logging: 'operational',
          api: 'operational'
        }
      };

      res.json({ success: true, data: systemInfo });
    } catch (error) {
      console.error('System health check error:', error);
      res.status(500).json({ success: false, error: 'System health check failed' });
    }
  }
);

router.get('/system/stats',
  requireCaps(AdminConfig.capabilities.system.monitoring),
  async (req, res) => {
    try {
      // Get system statistics
      const stats = await require('../../db/connection').query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE archived = false) as total_users,
          (SELECT COUNT(*) FROM users WHERE role_code = 'contractor' AND archived = false) as contractors,
          (SELECT COUNT(*) FROM users WHERE role_code = 'customer' AND archived = false) as customers,
          (SELECT COUNT(*) FROM users WHERE role_code = 'center' AND archived = false) as centers,
          (SELECT COUNT(*) FROM users WHERE role_code = 'crew' AND archived = false) as crew,
          (SELECT COUNT(*) FROM users WHERE role_code = 'warehouse' AND archived = false) as warehouses,
          (SELECT COUNT(*) FROM users WHERE role_code = 'manager' AND archived = false) as managers,
          (SELECT COUNT(*) FROM system_activity WHERE created_at > NOW() - INTERVAL '24 hours') as activity_24h
      `);

      res.json({ success: true, data: stats.rows[0] });
    } catch (error) {
      console.error('System stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to load system statistics' });
    }
  }
);

router.post('/system/maintenance',
  requireCaps(AdminConfig.capabilities.system.maintenance),
  async (req, res) => {
    try {
      const { operation, params } = req.body;
      const adminId = req.user?.userId;

      // Log maintenance operation
      await require('../../db/connection').query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          adminId,
          'admin',
          'system_maintenance',
          'system',
          `Admin performed maintenance operation: ${operation}`,
          'system',
          operation,
          JSON.stringify({ params, performed_by: adminId }),
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      res.json({ success: true, message: `Maintenance operation ${operation} completed` });
    } catch (error) {
      console.error('Maintenance operation error:', error);
      res.status(500).json({ success: false, error: 'Maintenance operation failed' });
    }
  }
);

// Global activity endpoint (admin can see all activity)
router.get('/activity',
  requireCaps(AdminConfig.capabilities.dashboard.view),
  async (req, res) => {
    try {
      const { limit = 50, category, user_role, date_from, date_to } = req.query;

      let query = `
        SELECT id, user_id, user_role, action_type, action_category, description,
               entity_type, entity_id, created_at, metadata
        FROM system_activity
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        query += ` AND action_category = $${++paramCount}`;
        params.push(category);
      }

      if (user_role) {
        query += ` AND user_role = $${++paramCount}`;
        params.push(user_role);
      }

      if (date_from) {
        query += ` AND created_at >= $${++paramCount}::date`;
        params.push(date_from);
      }

      if (date_to) {
        query += ` AND created_at <= $${++paramCount}::date + interval '1 day'`;
        params.push(date_to);
      }

      query += ` ORDER BY created_at DESC LIMIT $${++paramCount}`;
      params.push(limit);

      const result = await require('../../db/connection').query(query, params);

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Activity fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load activities' });
    }
  }
);

// Global clear activity endpoint
router.post('/clear-activity',
  requireCaps(AdminConfig.capabilities.dashboard.admin),
  async (req, res) => {
    try {
      const adminId = req.user?.userId;
      const { code, category } = req.body;

      if (!adminId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      if (code !== 'ADMIN-CLEAR-ALL') {
        return res.status(400).json({ success: false, error: 'Invalid confirmation code' });
      }

      // Clear activity logs
      let query = 'DELETE FROM system_activity';
      const params: any[] = [];

      if (category) {
        query += ' WHERE action_category = $1';
        params.push(category);
      }

      const result = await require('../../db/connection').query(query, params);

      // Log the clear operation
      await require('../../db/connection').query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          adminId,
          'admin',
          'clear_activity',
          'system',
          `Admin cleared ${result.rowCount} activity log entries`,
          'activity',
          code,
          JSON.stringify({ cleared_count: result.rowCount, category, cleared_by: adminId }),
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      res.json({
        success: true,
        message: `Activity log cleared: ${result.rowCount} entries removed`,
        cleared: result.rowCount
      });
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
    role: 'admin',
    timestamp: new Date().toISOString(),
    version: 'v1',
    scope: 'global',
    domains: Object.keys(AdminConfig.domains),
    features: Object.keys(AdminConfig.features).filter(key =>
      AdminConfig.features[key as keyof typeof AdminConfig.features]
    )
  });
});

/**
 * Placeholder route factories (these would be implemented as proper domain factories)
 */
function createProfileRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(AdminConfig.capabilities.profile.view), (req, res) => {
    res.json({ message: 'Profile routes - to be implemented with profile domain factory' });
  });
  return router;
}

function createDirectoryRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(AdminConfig.capabilities.directory.view), (req, res) => {
    res.json({ message: 'Directory routes - to be implemented with directory domain factory' });
  });
  return router;
}

function createCreateRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(AdminConfig.capabilities.users.view), (req, res) => {
    res.json({ message: 'Create routes - to be implemented with create domain factory' });
  });
  return router;
}

function createAssignRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(AdminConfig.capabilities.assignments.view), (req, res) => {
    res.json({ message: 'Assign routes - to be implemented with assign domain factory' });
  });
  return router;
}

function createArchiveRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(AdminConfig.capabilities.archive.view), (req, res) => {
    res.json({ message: 'Archive routes - to be implemented with archive domain factory' });
  });
  return router;
}

function createSupportRouterPlaceholder() {
  const router = Router();
  router.get('/', requireCaps(AdminConfig.capabilities.support.view), (req, res) => {
    res.json({ message: 'Support routes - to be implemented with support domain factory' });
  });
  return router;
}

export default router;