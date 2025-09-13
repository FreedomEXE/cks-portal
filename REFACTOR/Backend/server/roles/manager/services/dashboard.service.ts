/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.service.ts
 * 
 * Description: Business logic to compute KPIs; may query orders/activity.
 * Function: Aggregate data to produce Manager dashboard KPIs.
 * Importance: Drives Dashboard tab insights and metrics.
 * Connects to: dashboard.repo.ts, orders.repo.ts.
 */

import type { DashboardKPI } from '../validators/dashboard.schema';
import * as dashboardRepo from '../repositories/dashboard.repo';
import * as ordersRepo from '../repositories/orders.repo';

// Get basic KPI counts for dashboard
export async function getDashboardKPIs(managerId: string): Promise<DashboardKPI> {
  try {
    const entityCounts = await dashboardRepo.getEntityCounts(managerId);
    return entityCounts;
  } catch (error) {
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
export async function getDashboardData(managerId: string) {
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
  } catch (error) {
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
export async function getOrdersOverview(managerId: string) {
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
  } catch (error) {
    console.error('Error getting orders overview:', error);
    return {
      statusCounts: {},
      recentOrders: [],
      totalOrders: 0
    };
  }
}
