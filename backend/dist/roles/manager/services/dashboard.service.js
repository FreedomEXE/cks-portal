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
const dashboardRepo = __importStar(require("../repositories/dashboard.repo"));
const ordersRepo = __importStar(require("../repositories/orders.repo"));
// Get basic KPI counts for dashboard
async function getDashboardKPIs(managerId) {
    try {
        const entityCounts = await dashboardRepo.getEntityCounts(managerId);
        return entityCounts;
    }
    catch (error) {
        console.error('Error getting dashboard KPIs:', error);
        // Return fallback data if database query fails
        return {
            contractors: 0,
            customers: 0,
            centers: 0,
            crew: 0
        };
    }
}
// Get comprehensive dashboard data
async function getDashboardData(managerId) {
    try {
        const [kpis, orderStats, performanceMetrics, recentActivity] = await Promise.all([
            dashboardRepo.getEntityCounts(managerId),
            dashboardRepo.getOrderStats(managerId),
            dashboardRepo.getPerformanceMetrics(managerId),
            dashboardRepo.getRecentActivity(managerId, 5)
        ]);
        return {
            kpis,
            orderStats,
            performanceMetrics,
            recentActivity,
            summary: {
                totalRevenue: orderStats.revenue_this_month,
                activeOrders: orderStats.pending + orderStats.in_progress,
                completedThisMonth: orderStats.completed,
                avgCompletionTime: performanceMetrics.avg_completion_time
            }
        };
    }
    catch (error) {
        console.error('Error getting dashboard data:', error);
        // Return fallback data structure
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
// Get manager's order overview
async function getOrdersOverview(managerId) {
    try {
        const [orderCounts, recentOrders] = await Promise.all([
            ordersRepo.getOrderCountsByStatus(managerId),
            ordersRepo.getOrdersForManager(managerId, { date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })
        ]);
        return {
            statusCounts: orderCounts,
            recentOrders: recentOrders.slice(0, 10), // Latest 10 orders
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
//# sourceMappingURL=dashboard.service.js.map