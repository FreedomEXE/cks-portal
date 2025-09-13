/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: routes.factory.ts
 *
 * Description: Dashboard route factory - creates role-specific dashboard routes
 * Function: Generate dashboard endpoints based on role capabilities and configuration
 * Importance: Single dashboard logic that adapts to different role requirements
 * Connects to: dashboard service, role configs, capability guards
 */

import { Router } from 'express';
import { requireCaps } from '../../core/auth/requireCaps';
import { validate } from '../../core/validation/zod';
import { ResponseHelpers } from '../../core/http/responses';
import { ErrorHelpers } from '../../core/http/errors';
import * as dashboardService from './service';
import { z } from 'zod';

/**
 * Configuration for dashboard route factory
 */
export interface DashboardRouteConfig {
  capabilities: {
    view: string;        // e.g., 'dashboard:view'
    manage?: string;     // e.g., 'dashboard:manage'
  };
  features: {
    kpis: boolean;
    orders: boolean;
    activity: boolean;
    analytics: boolean;
    clearActivity?: boolean;
  };
  scope: 'global' | 'ecosystem' | 'entity';  // Data scope for the role
  roleCode: string;
}

/**
 * Create dashboard router for specific role configuration
 */
export function createDashboardRouter(config: DashboardRouteConfig): Router {
  const router = Router();

  // Validation schemas
  const kpisQuerySchema = z.object({
    period: z.enum(['day', 'week', 'month', 'year']).default('month'),
    metrics: z.string().optional()
  });

  const activityQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    category: z.string().optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  });

  // KPIs endpoint
  if (config.features.kpis) {
    router.get(
      '/kpis',
      requireCaps(config.capabilities.view),
      validate(kpisQuerySchema, 'query'),
      async (req, res) => {
        try {
          const userId = req.user!.userId;
          const { period, metrics } = req.query as any;

          const kpis = await dashboardService.getDashboardKPIs(
            userId,
            config.scope,
            config.roleCode,
            { period, metrics }
          );

          return ResponseHelpers.ok(res, kpis, {
            role: config.roleCode,
            scope: config.scope,
            period
          });
        } catch (error) {
          console.error('Dashboard KPIs error:', error);
          return ErrorHelpers.internal(req, res, 'Failed to load dashboard KPIs');
        }
      }
    );
  }

  // Comprehensive dashboard data endpoint
  router.get(
    '/data',
    requireCaps(config.capabilities.view),
    async (req, res) => {
      try {
        const userId = req.user!.userId;

        const dashboardData = await dashboardService.getDashboardData(
          userId,
          config.scope,
          config.roleCode,
          config.features
        );

        return ResponseHelpers.ok(res, dashboardData, {
          role: config.roleCode,
          scope: config.scope,
          features: config.features
        });
      } catch (error) {
        console.error('Dashboard data error:', error);
        return ErrorHelpers.internal(req, res, 'Failed to load dashboard data');
      }
    }
  );

  // Orders overview endpoint
  if (config.features.orders) {
    router.get(
      '/orders',
      requireCaps(config.capabilities.view),
      async (req, res) => {
        try {
          const userId = req.user!.userId;

          const ordersOverview = await dashboardService.getOrdersOverview(
            userId,
            config.scope,
            config.roleCode
          );

          return ResponseHelpers.ok(res, ordersOverview, {
            role: config.roleCode,
            scope: config.scope
          });
        } catch (error) {
          console.error('Orders overview error:', error);
          return ErrorHelpers.internal(req, res, 'Failed to load orders overview');
        }
      }
    );
  }

  // Activity endpoint
  if (config.features.activity) {
    router.get(
      '/activity',
      requireCaps(config.capabilities.view),
      validate(activityQuerySchema, 'query'),
      async (req, res) => {
        try {
          const userId = req.user!.userId;
          const { limit, category, date_from, date_to } = req.query as any;

          const activities = await dashboardService.getRecentActivity(
            userId,
            config.scope,
            config.roleCode,
            { limit, category, date_from, date_to }
          );

          return ResponseHelpers.ok(res, activities, {
            role: config.roleCode,
            scope: config.scope,
            filters: { category, date_from, date_to }
          });
        } catch (error) {
          console.error('Activity fetch error:', error);
          return ErrorHelpers.internal(req, res, 'Failed to load activity');
        }
      }
    );
  }

  // Clear activity endpoint (admin/manager only)
  if (config.features.clearActivity && config.capabilities.manage) {
    router.post(
      '/clear-activity',
      requireCaps(config.capabilities.manage),
      validate(z.object({
        code: z.string().min(1, 'Confirmation code required'),
        category: z.string().optional()
      }), 'body'),
      async (req, res) => {
        try {
          const userId = req.user!.userId;
          const { code, category } = req.body;

          const result = await dashboardService.clearActivity(
            userId,
            config.roleCode,
            code,
            category
          );

          return ResponseHelpers.ok(res, result, {
            role: config.roleCode,
            action: 'clear_activity'
          });
        } catch (error) {
          console.error('Clear activity error:', error);
          return ErrorHelpers.internal(req, res, 'Failed to clear activity');
        }
      }
    );
  }

  // Analytics endpoint (if enabled)
  if (config.features.analytics) {
    router.get(
      '/analytics',
      requireCaps(config.capabilities.view),
      validate(z.object({
        timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
        metrics: z.array(z.string()).optional()
      }), 'query'),
      async (req, res) => {
        try {
          const userId = req.user!.userId;
          const { timeframe, metrics } = req.query as any;

          const analytics = await dashboardService.getAnalytics(
            userId,
            config.scope,
            config.roleCode,
            { timeframe, metrics }
          );

          return ResponseHelpers.ok(res, analytics, {
            role: config.roleCode,
            scope: config.scope,
            timeframe
          });
        } catch (error) {
          console.error('Analytics error:', error);
          return ErrorHelpers.internal(req, res, 'Failed to load analytics');
        }
      }
    );
  }

  // Health check for this domain
  router.get('/health', (req, res) => {
    return ResponseHelpers.health(res, 'ok', {
      domain: 'dashboard',
      role: config.roleCode,
      features: Object.keys(config.features).filter(key => config.features[key as keyof typeof config.features])
    });
  });

  return router;
}