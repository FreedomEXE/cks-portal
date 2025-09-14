/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: service.ts
 *
 * Description: Dashboard business logic service - role-aware dashboard data processing
 * Function: Compute KPIs, activity, and analytics based on user role and scope
 * Importance: Single source of dashboard logic that adapts to different role contexts
 * Connects to: dashboard repository, activity logs, role-specific data scoping
 */

import * as dashboardRepo from './repository';
import * as activityRepo from '../activity/repository';
import { ActivityLog } from '../../core/logging/audit';

export interface DashboardFeatures {
  kpis: boolean;
  orders: boolean;
  activity: boolean;
  analytics: boolean;
  clearActivity?: boolean;
}

export interface DashboardOptions {
  period?: 'day' | 'week' | 'month' | 'year';
  metrics?: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  limit?: number;
  category?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Get dashboard KPIs based on user role and scope
 */
export async function getDashboardKPIs(
  userId: string,
  scope: 'global' | 'ecosystem' | 'entity',
  roleCode: string,
  options: DashboardOptions = {}
): Promise<any> {
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
  } catch (error) {
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
export async function getDashboardData(
  userId: string,
  scope: 'global' | 'ecosystem' | 'entity',
  roleCode: string,
  features: DashboardFeatures
): Promise<any> {
  try {
    const data: any = {};

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
  } catch (error) {
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
export async function getOrdersOverview(
  userId: string,
  scope: 'global' | 'ecosystem' | 'entity',
  roleCode: string
): Promise<any> {
  try {
    const orderCounts = await dashboardRepo.getOrderCounts(userId, scope, roleCode);
    const recentOrders = await dashboardRepo.getRecentOrders(userId, scope, roleCode, 10);

    return {
      statusCounts: orderCounts,
      recentOrders,
      totalOrders: Object.values(orderCounts).reduce((sum: number, count: any) => sum + count, 0)
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

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(
  userId: string,
  scope: 'global' | 'ecosystem' | 'entity',
  roleCode: string,
  options: DashboardOptions = {}
): Promise<any[]> {
  try {
    return await activityRepo.getActivityForDashboard(userId, scope, roleCode, {
      limit: options.limit || 10,
      category: options.category,
      date_from: options.date_from,
      date_to: options.date_to
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

/**
 * Get analytics data
 */
export async function getAnalytics(
  userId: string,
  scope: 'global' | 'ecosystem' | 'entity',
  roleCode: string,
  options: DashboardOptions = {}
): Promise<any> {
  try {
    return await dashboardRepo.getAnalytics(userId, scope, roleCode, options);
  } catch (error) {
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
export async function clearActivity(
  userId: string,
  roleCode: string,
  confirmationCode: string,
  category?: string
): Promise<{ success: boolean; message: string; cleared: number }> {
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
    await ActivityLog.system.maintenance(
      userId,
      roleCode,
      'clear_activity_logs',
      `Cleared ${clearedCount} activity log entries`,
      { category, confirmationCode }
    );

    return {
      success: true,
      message: `Successfully cleared ${clearedCount} activity entries`,
      cleared: clearedCount
    };
  } catch (error) {
    console.error('Error clearing activity:', error);
    throw error;
  }
}