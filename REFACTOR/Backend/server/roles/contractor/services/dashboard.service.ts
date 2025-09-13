/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.service.ts
 * 
 * Description: Business logic to compute KPIs; may query orders/activity.
 * Function: Aggregate data to produce Contractor dashboard KPIs.
 * Importance: Drives Dashboard tab insights and metrics.
 * Connects to: dashboard.repo.ts, orders.repo.ts.
 */

import type { DashboardKPI } from '../validators/dashboard.schema';
import * as dashboardRepo from '../repositories/dashboard.repo';
import * as ordersRepo from '../repositories/orders.repo';

// Get basic KPI counts for dashboard
export async function getDashboardKPIs(contractorId: string): Promise<DashboardKPI> {
  try {
    const entityCounts = await dashboardRepo.getEntityCounts(contractorId);
    return entityCounts;
  } catch (error) {
    console.error('Error getting dashboard KPIs:', error);
    // Return fallback data if database query fails
    return {
      activeJobs: 0,
      completedJobs: 0,
      totalRevenue: 0,
      avgRating: 0
    };
  }
}

// Get comprehensive dashboard data
export async function getDashboardData(contractorId: string) {
  try {
    const [kpis, jobStats, performanceMetrics, recentActivity] = await Promise.all([
      dashboardRepo.getEntityCounts(contractorId),
      dashboardRepo.getJobStats(contractorId),
      dashboardRepo.getPerformanceMetrics(contractorId),
      dashboardRepo.getRecentActivity(contractorId, 5)
    ]);

    return {
      kpis,
      jobStats,
      performanceMetrics,
      recentActivity,
      summary: {
        totalRevenue: jobStats.revenue_this_month,
        activeJobs: jobStats.pending + jobStats.in_progress,
        completedThisMonth: jobStats.completed,
        avgRating: performanceMetrics.avg_rating
      }
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    // Return fallback data structure
    return {
      kpis: { activeJobs: 0, completedJobs: 0, totalRevenue: 0, avgRating: 0 },
      jobStats: { total: 0, pending: 0, in_progress: 0, completed: 0, revenue_this_month: 0 },
      performanceMetrics: { avg_rating: 0, completion_rate: 85, on_time_delivery: 0 },
      recentActivity: [],
      summary: {
        totalRevenue: 0,
        activeJobs: 0,
        completedThisMonth: 0,
        avgRating: 0
      }
    };
  }
}

// Get contractor's orders overview
export async function getOrdersOverview(contractorId: string) {
  try {
    const [orderCounts, recentOrders] = await Promise.all([
      ordersRepo.getOrderCountsByStatus(contractorId),
      ordersRepo.getOrdersForContractor(contractorId, { date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })
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