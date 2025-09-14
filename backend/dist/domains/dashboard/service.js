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
exports.getDashboardKPIs = getDashboardKPIs;
exports.getDashboardData = getDashboardData;
exports.getOrdersOverview = getOrdersOverview;
exports.getRecentActivity = getRecentActivity;
exports.getAnalytics = getAnalytics;
exports.clearActivity = clearActivity;
/**
 * File: service.ts
 *
 * Description: Dashboard business logic service - role-aware dashboard data processing
 * Function: Compute KPIs, activity, and analytics based on user role and scope
 * Importance: Single source of dashboard logic that adapts to different role contexts
 * Connects to: dashboard repository, activity logs, role-specific data scoping
 */
const dashboardRepo = __importStar(require("./repository"));
const activityRepo = __importStar(require("../activity/repository"));
const audit_1 = require("../../core/logging/audit");
/**
 * Get dashboard KPIs based on user role and scope
 */
async function getDashboardKPIs(userId, scope, roleCode, options = {}) {
    try {
        switch (scope) {
            case 'global':
                // Admin/Manager - global system KPIs
                return await dashboardRepo.getGlobalKPIs(userId, roleCode, options);
            case 'ecosystem':
                // Contractor - their ecosystem KPIs
                return await dashboardRepo.getEcosystemKPIs(userId, roleCode, options);
            case 'entity':
                // Customer/Center/Crew/Warehouse - entity-specific KPIs
                return await dashboardRepo.getEntityKPIs(userId, roleCode, options);
            default:
                throw new Error(`Unsupported scope: ${scope}`);
        }
    }
    catch (error) {
        console.error('Error getting dashboard KPIs:', error);
        // Return fallback KPIs structure
        return {
            contractors: 0,
            customers: 0,
            centers: 0,
            crew: 0,
            orders: 0,
            revenue: 0
        };
    }
}
/**
 * Get comprehensive dashboard data
 */
async function getDashboardData(userId, scope, roleCode, features) {
    try {
        const data = {};
        // Get KPIs if enabled
        if (features.kpis) {
            data.kpis = await getDashboardKPIs(userId, scope, roleCode);
        }
        // Get order statistics if enabled
        if (features.orders) {
            data.orderStats = await getOrdersOverview(userId, scope, roleCode);
        }
        // Get recent activity if enabled
        if (features.activity) {
            data.recentActivity = await getRecentActivity(userId, scope, roleCode, { limit: 5 });
        }
        // Get performance metrics based on role
        data.performanceMetrics = await dashboardRepo.getPerformanceMetrics(userId, scope, roleCode);
        // Generate summary
        data.summary = {
            totalRevenue: data.orderStats?.revenue_this_month || 0,
            activeOrders: (data.orderStats?.pending || 0) + (data.orderStats?.in_progress || 0),
            completedThisMonth: data.orderStats?.completed || 0,
            avgCompletionTime: data.performanceMetrics?.avg_completion_time || 0
        };
        return data;
    }
    catch (error) {
        console.error('Error getting dashboard data:', error);
        return {
            kpis: { contractors: 0, customers: 0, centers: 0, crew: 0 },
            orderStats: { total: 0, pending: 0, in_progress: 0, completed: 0, revenue_this_month: 0 },
            performanceMetrics: { avg_completion_time: 0, customer_satisfaction: 85, on_time_delivery: 0 },
            recentActivity: [],
            summary: {
                totalRevenue: 0,
                activeOrders: 0,
                completedThisMonth: 0,
                avgCompletionTime: 0
            }
        };
    }
}
/**
 * Get orders overview for dashboard
 */
async function getOrdersOverview(userId, scope, roleCode) {
    try {
        const orderCounts = await dashboardRepo.getOrderCounts(userId, scope, roleCode);
        const recentOrders = await dashboardRepo.getRecentOrders(userId, scope, roleCode, 10);
        return {
            statusCounts: orderCounts,
            recentOrders,
            totalOrders: Object.values(orderCounts).reduce((sum, count) => sum + count, 0)
        };
    }
    catch (error) {
        console.error('Error getting orders overview:', error);
        return {
            statusCounts: {},
            recentOrders: [],
            totalOrders: 0
        };
    }
}
/**
 * Get recent activity for dashboard
 */
async function getRecentActivity(userId, scope, roleCode, options = {}) {
    try {
        return await activityRepo.getActivityForDashboard(userId, scope, roleCode, {
            limit: options.limit || 10,
            category: options.category,
            date_from: options.date_from,
            date_to: options.date_to
        });
    }
    catch (error) {
        console.error('Error getting recent activity:', error);
        return [];
    }
}
/**
 * Get analytics data
 */
async function getAnalytics(userId, scope, roleCode, options = {}) {
    try {
        return await dashboardRepo.getAnalytics(userId, scope, roleCode, options);
    }
    catch (error) {
        console.error('Error getting analytics:', error);
        return {
            trends: {},
            comparisons: {},
            forecasts: {}
        };
    }
}
/**
 * Clear activity logs (admin/manager only)
 */
async function clearActivity(userId, roleCode, confirmationCode, category) {
    try {
        // Validate confirmation code (simple check for now)
        if (confirmationCode !== 'CLEAR-LOGS') {
            throw new Error('Invalid confirmation code');
        }
        // Only allow admin and manager roles to clear activity
        if (!['admin', 'manager'].includes(roleCode.toLowerCase())) {
            throw new Error('Insufficient permissions to clear activity logs');
        }
        // Clear activity logs
        const clearedCount = await activityRepo.clearActivityLogs(userId, category);
        // Log the clear activity action
        await audit_1.ActivityLog.system.maintenance(userId, roleCode, 'clear_activity_logs', `Cleared ${clearedCount} activity log entries`, { category, confirmationCode });
        return {
            success: true,
            message: `Successfully cleared ${clearedCount} activity entries`,
            cleared: clearedCount
        };
    }
    catch (error) {
        console.error('Error clearing activity:', error);
        throw error;
    }
}
//# sourceMappingURL=service.js.map