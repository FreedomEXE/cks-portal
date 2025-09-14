"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashboardRouter = createDashboardRouter;
/**
 * File: routes.factory.ts
 *
 * Description: Dashboard route factory - creates role-specific dashboard routes
 * Function: Generate dashboard endpoints based on role capabilities and configuration
 * Importance: Single dashboard logic that adapts to different role requirements
 * Connects to: dashboard service, role configs, capability guards
 */
const express_1 = require("express");
const requireCaps_1 = require("../../core/auth/requireCaps");
const zod_1 = require("../../core/validation/zod");
const responses_1 = require("../../core/http/responses");
const errors_1 = require("../../core/http/errors");
const dashboardService = __importStar(require("./service"));
const zod_2 = require("zod");
/**
 * Create dashboard router for specific role configuration
 */
function createDashboardRouter(config) {
    const router = (0, express_1.Router)();
    // Validation schemas
    const kpisQuerySchema = zod_2.z.object({
        period: zod_2.z.enum(['day', 'week', 'month', 'year']).default('month'),
        metrics: zod_2.z.string().optional()
    });
    const activityQuerySchema = zod_2.z.object({
        limit: zod_2.z.coerce.number().int().min(1).max(100).default(10),
        category: zod_2.z.string().optional(),
        date_from: zod_2.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        date_to: zod_2.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    });
    // KPIs endpoint
    if (config.features.kpis) {
        router.get('/kpis', (0, requireCaps_1.requireCaps)(config.capabilities.view), (0, zod_1.validate)(kpisQuerySchema, 'query'), async (req, res) => {
            try {
                const userId = req.user.userId;
                const { period, metrics } = req.query;
                const kpis = await dashboardService.getDashboardKPIs(userId, config.scope, config.roleCode, { period, metrics });
                return responses_1.ResponseHelpers.ok(res, kpis, {
                    role: config.roleCode,
                    scope: config.scope,
                    period
                });
            }
            catch (error) {
                console.error('Dashboard KPIs error:', error);
                return errors_1.ErrorHelpers.internal(req, res, 'Failed to load dashboard KPIs');
            }
        });
    }
    // Comprehensive dashboard data endpoint
    router.get('/data', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
        try {
            const userId = req.user.userId;
            const dashboardData = await dashboardService.getDashboardData(userId, config.scope, config.roleCode, config.features);
            return responses_1.ResponseHelpers.ok(res, dashboardData, {
                role: config.roleCode,
                scope: config.scope,
                features: config.features
            });
        }
        catch (error) {
            console.error('Dashboard data error:', error);
            return errors_1.ErrorHelpers.internal(req, res, 'Failed to load dashboard data');
        }
    });
    // Orders overview endpoint
    if (config.features.orders) {
        router.get('/orders', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const userId = req.user.userId;
                const ordersOverview = await dashboardService.getOrdersOverview(userId, config.scope, config.roleCode);
                return responses_1.ResponseHelpers.ok(res, ordersOverview, {
                    role: config.roleCode,
                    scope: config.scope
                });
            }
            catch (error) {
                console.error('Orders overview error:', error);
                return errors_1.ErrorHelpers.internal(req, res, 'Failed to load orders overview');
            }
        });
    }
    // Activity endpoint
    if (config.features.activity) {
        router.get('/activity', (0, requireCaps_1.requireCaps)(config.capabilities.view), (0, zod_1.validate)(activityQuerySchema, 'query'), async (req, res) => {
            try {
                const userId = req.user.userId;
                const { limit, category, date_from, date_to } = req.query;
                const activities = await dashboardService.getRecentActivity(userId, config.scope, config.roleCode, { limit, category, date_from, date_to });
                return responses_1.ResponseHelpers.ok(res, activities, {
                    role: config.roleCode,
                    scope: config.scope,
                    filters: { category, date_from, date_to }
                });
            }
            catch (error) {
                console.error('Activity fetch error:', error);
                return errors_1.ErrorHelpers.internal(req, res, 'Failed to load activity');
            }
        });
    }
    // Clear activity endpoint (admin/manager only)
    if (config.features.clearActivity && config.capabilities.manage) {
        router.post('/clear-activity', (0, requireCaps_1.requireCaps)(config.capabilities.manage), (0, zod_1.validate)(zod_2.z.object({
            code: zod_2.z.string().min(1, 'Confirmation code required'),
            category: zod_2.z.string().optional()
        }), 'body'), async (req, res) => {
            try {
                const userId = req.user.userId;
                const { code, category } = req.body;
                const result = await dashboardService.clearActivity(userId, config.roleCode, code, category);
                return responses_1.ResponseHelpers.ok(res, result, {
                    role: config.roleCode,
                    action: 'clear_activity'
                });
            }
            catch (error) {
                console.error('Clear activity error:', error);
                return errors_1.ErrorHelpers.internal(req, res, 'Failed to clear activity');
            }
        });
    }
    // Analytics endpoint (if enabled)
    if (config.features.analytics) {
        router.get('/analytics', (0, requireCaps_1.requireCaps)(config.capabilities.view), (0, zod_1.validate)(zod_2.z.object({
            timeframe: zod_2.z.enum(['week', 'month', 'quarter', 'year']).default('month'),
            metrics: zod_2.z.array(zod_2.z.string()).optional()
        }), 'query'), async (req, res) => {
            try {
                const userId = req.user.userId;
                const { timeframe, metrics } = req.query;
                const analytics = await dashboardService.getAnalytics(userId, config.scope, config.roleCode, { timeframe, metrics });
                return responses_1.ResponseHelpers.ok(res, analytics, {
                    role: config.roleCode,
                    scope: config.scope,
                    timeframe
                });
            }
            catch (error) {
                console.error('Analytics error:', error);
                return errors_1.ErrorHelpers.internal(req, res, 'Failed to load analytics');
            }
        });
    }
    // Health check for this domain
    router.get('/health', (req, res) => {
        return responses_1.ResponseHelpers.health(res, 'ok', {
            domain: 'dashboard',
            role: config.roleCode,
            features: Object.keys(config.features).filter(key => config.features[key])
        });
    });
    return router;
}
//# sourceMappingURL=routes.factory.js.map