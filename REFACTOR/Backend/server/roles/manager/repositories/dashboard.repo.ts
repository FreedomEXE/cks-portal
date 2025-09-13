/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.repo.ts
 * 
 * Description: DB queries for manager dashboard KPIs and metrics
 * Function: Aggregate data across entities for dashboard display
 * Importance: Powers Manager dashboard insights and overview
 * Connects to: dashboard.service.ts
 * 
 * Notes: Specialized queries for dashboard data aggregation
 */

import { query } from '../../../db/connection';

// Get entity counts for dashboard KPIs
export async function getEntityCounts(managerId: string): Promise<{
  contractors: number;
  customers: number;
  centers: number;
  crew: number;
}> {
  const sql = `
    WITH manager_stats AS (
      -- Count contractors managed by this manager
      SELECT 
        COUNT(DISTINCT contractors.contractor_id) as contractors
      FROM contractors
      WHERE contractors.cks_manager = $1
      AND contractors.status = 'active'
    ),
    customer_stats AS (
      -- Count customers managed by this manager
      SELECT 
        COUNT(DISTINCT customers.customer_id) as customers
      FROM customers
      WHERE customers.cks_manager = $1
      AND customers.status = 'active'
    ),
    center_stats AS (
      -- Count centers managed by this manager
      SELECT 
        COUNT(DISTINCT centers.center_id) as centers
      FROM centers
      WHERE centers.cks_manager = $1
      AND centers.status = 'active'
    ),
    crew_stats AS (
      -- Count crew members (job assignments for this manager's orders)
      SELECT 
        COUNT(DISTINCT ja.assigned_user) as crew
      FROM job_assignments ja
      JOIN service_jobs sj ON ja.job_id = sj.job_id
      JOIN orders o ON sj.order_id = o.order_id
      LEFT JOIN customers cu ON o.customer_id = cu.customer_id
      LEFT JOIN centers c ON o.center_id = c.center_id
      WHERE (cu.cks_manager = $1 OR c.cks_manager = $1)
      AND ja.status IN ('assigned', 'confirmed', 'completed')
    )
    SELECT 
      COALESCE(ms.contractors, 0) as contractors,
      COALESCE(cs.customers, 0) as customers,
      COALESCE(ct.centers, 0) as centers,
      COALESCE(cr.crew, 0) as crew
    FROM manager_stats ms
    CROSS JOIN customer_stats cs
    CROSS JOIN center_stats ct  
    CROSS JOIN crew_stats cr
  `;

  const result = await query(sql, [managerId]);
  return result[0] || { contractors: 0, customers: 0, centers: 0, crew: 0 };
}

// Get recent activity for dashboard
export async function getRecentActivity(managerId: string, limit = 10): Promise<any[]> {
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
    WHERE al.user_id IN (
      -- Activities by users in this manager's scope
      SELECT DISTINCT u2.user_id 
      FROM users u2
      WHERE u2.role_code IN ('contractor', 'customer', 'center', 'crew')
      -- Add more scope filtering as needed
    )
    OR al.user_id = $1  -- Manager's own activities
    ORDER BY al.created_at DESC
    LIMIT $2
  `;

  return await query(sql, [managerId, limit]);
}

// Get order statistics for dashboard
export async function getOrderStats(managerId: string): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  revenue_this_month: number;
}> {
  const sql = `
    WITH order_counts AS (
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed
      FROM orders o
      LEFT JOIN customers cu ON o.customer_id = cu.customer_id
      LEFT JOIN centers c ON o.center_id = c.center_id
      WHERE (cu.cks_manager = $1 OR c.cks_manager = $1)
    ),
    revenue_stats AS (
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as revenue_this_month
      FROM orders o
      LEFT JOIN customers cu ON o.customer_id = cu.customer_id
      LEFT JOIN centers c ON o.center_id = c.center_id
      WHERE (cu.cks_manager = $1 OR c.cks_manager = $1)
      AND o.status = 'completed'
      AND o.completed_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND o.completed_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    )
    SELECT 
      oc.total,
      oc.pending,
      oc.in_progress,
      oc.completed,
      rs.revenue_this_month
    FROM order_counts oc
    CROSS JOIN revenue_stats rs
  `;

  const result = await query(sql, [managerId]);
  return result[0] || {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    revenue_this_month: 0
  };
}

// Get performance metrics for dashboard
export async function getPerformanceMetrics(managerId: string): Promise<{
  avg_completion_time: number; // in days
  customer_satisfaction: number; // percentage
  on_time_delivery: number; // percentage
}> {
  const sql = `
    WITH completion_times AS (
      SELECT 
        AVG(
          EXTRACT(DAY FROM (o.completed_date - o.scheduled_date))
        ) as avg_completion_time
      FROM orders o
      LEFT JOIN customers cu ON o.customer_id = cu.customer_id
      LEFT JOIN centers c ON o.center_id = c.center_id
      WHERE (cu.cks_manager = $1 OR c.cks_manager = $1)
      AND o.status = 'completed'
      AND o.completed_date IS NOT NULL
      AND o.scheduled_date IS NOT NULL
    ),
    delivery_metrics AS (
      SELECT 
        COUNT(*) as total_completed,
        COUNT(CASE WHEN o.completed_date <= o.scheduled_date THEN 1 END) as on_time
      FROM orders o
      LEFT JOIN customers cu ON o.customer_id = cu.customer_id
      LEFT JOIN centers c ON o.center_id = c.center_id
      WHERE (cu.cks_manager = $1 OR c.cks_manager = $1)
      AND o.status = 'completed'
      AND o.completed_date IS NOT NULL
      AND o.scheduled_date IS NOT NULL
    )
    SELECT 
      COALESCE(ct.avg_completion_time, 0) as avg_completion_time,
      85.0 as customer_satisfaction, -- Placeholder - would come from surveys/ratings
      CASE 
        WHEN dm.total_completed > 0 
        THEN (dm.on_time::FLOAT / dm.total_completed) * 100
        ELSE 0
      END as on_time_delivery
    FROM completion_times ct
    CROSS JOIN delivery_metrics dm
  `;

  const result = await query(sql, [managerId]);
  return result[0] || {
    avg_completion_time: 0,
    customer_satisfaction: 85,
    on_time_delivery: 0
  };
}