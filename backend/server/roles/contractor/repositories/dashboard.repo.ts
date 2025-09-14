/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.repo.ts
 * 
 * Description: DB queries for contractor dashboard KPIs and metrics
 * Function: Aggregate data across entities for dashboard display
 * Importance: Powers Contractor dashboard insights and overview
 * Connects to: dashboard.service.ts
 * 
 * Notes: Specialized queries for contractor dashboard data aggregation
 */

import { query } from '../../../db/connection';

// Get entity counts for dashboard KPIs
export async function getEntityCounts(contractorId: string): Promise<{
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  avgRating: number;
}> {
  const sql = `
    WITH contractor_stats AS (
      -- Count active jobs for this contractor
      SELECT 
        COUNT(DISTINCT CASE WHEN o.status IN ('accepted', 'in_progress') THEN o.order_id END) as active_jobs,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.order_id END) as completed_jobs,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_revenue
      FROM orders o
      JOIN job_assignments ja ON ja.order_id = o.order_id
      WHERE ja.assigned_contractor = $1
    ),
    rating_stats AS (
      -- Calculate average rating for contractor
      SELECT 
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM ratings r
      WHERE r.contractor_id = $1
      AND r.rating IS NOT NULL
    )
    SELECT 
      COALESCE(cs.active_jobs, 0) as active_jobs,
      COALESCE(cs.completed_jobs, 0) as completed_jobs,
      COALESCE(cs.total_revenue, 0) as total_revenue,
      COALESCE(rs.avg_rating, 0) as avg_rating
    FROM contractor_stats cs
    CROSS JOIN rating_stats rs
  `;

  const result = await query(sql, [contractorId]);
  return result[0] || { activeJobs: 0, completedJobs: 0, totalRevenue: 0, avgRating: 0 };
}

// Get recent activity for dashboard
export async function getRecentActivity(contractorId: string, limit = 10): Promise<any[]> {
  const sql = `
    SELECT 
      al.activity_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.description,
      al.created_at,
      u.user_id,
      u.display_name as user_name
    FROM activity_logs al
    JOIN users u ON al.user_id = u.user_id
    WHERE al.user_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2
  `;

  return await query(sql, [contractorId, limit]);
}

// Get job statistics for dashboard
export async function getJobStats(contractorId: string): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  revenue_this_month: number;
}> {
  const sql = `
    WITH job_counts AS (
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed
      FROM orders o
      JOIN job_assignments ja ON ja.order_id = o.order_id
      WHERE ja.assigned_contractor = $1
    ),
    revenue_stats AS (
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as revenue_this_month
      FROM orders o
      JOIN job_assignments ja ON ja.order_id = o.order_id
      WHERE ja.assigned_contractor = $1
      AND o.status = 'completed'
      AND o.completed_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND o.completed_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    )
    SELECT 
      jc.total,
      jc.pending,
      jc.in_progress,
      jc.completed,
      rs.revenue_this_month
    FROM job_counts jc
    CROSS JOIN revenue_stats rs
  `;

  const result = await query(sql, [contractorId]);
  return result[0] || {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    revenue_this_month: 0
  };
}

// Get performance metrics for dashboard
export async function getPerformanceMetrics(contractorId: string): Promise<{
  avg_rating: number;
  completion_rate: number;
  on_time_delivery: number;
}> {
  const sql = `
    WITH rating_metrics AS (
      SELECT 
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM ratings r
      WHERE r.contractor_id = $1
      AND r.rating IS NOT NULL
    ),
    completion_metrics AS (
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN o.status = 'completed' AND o.completed_date <= o.scheduled_date THEN 1 END) as on_time_jobs
      FROM orders o
      JOIN job_assignments ja ON ja.order_id = o.order_id
      WHERE ja.assigned_contractor = $1
      AND o.status IN ('completed', 'cancelled', 'in_progress')
    )
    SELECT 
      rm.avg_rating,
      CASE 
        WHEN cm.total_jobs > 0 
        THEN (cm.completed_jobs::FLOAT / cm.total_jobs) * 100
        ELSE 0
      END as completion_rate,
      CASE 
        WHEN cm.completed_jobs > 0 
        THEN (cm.on_time_jobs::FLOAT / cm.completed_jobs) * 100
        ELSE 0
      END as on_time_delivery
    FROM rating_metrics rm
    CROSS JOIN completion_metrics cm
  `;

  const result = await query(sql, [contractorId]);
  return result[0] || {
    avg_rating: 0,
    completion_rate: 0,
    on_time_delivery: 0
  };
}