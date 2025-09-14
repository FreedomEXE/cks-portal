/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * metrics.ts
 * 
 * Description: Admin dashboard metrics API for real system statistics
 * Function: Provide actual counts and metrics from database instead of mock data
 * Importance: Critical - Gives admin real visibility into system status
 */

import express, { Request, Response } from 'express';
import pool from '../../../Database/db/pool';
import { logger } from '../src/core/logger';

const router = express.Router();

// GET /api/metrics - Get admin dashboard metrics
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get total users count from all user tables (excluding archived)
    const usersQuery = `
      SELECT 
        (SELECT COUNT(*) FROM managers WHERE archived_at IS NULL) +
        (SELECT COUNT(*) FROM contractors WHERE archived_at IS NULL) +
        (SELECT COUNT(*) FROM customers WHERE archived_at IS NULL) +
        (SELECT COUNT(*) FROM centers WHERE archived_at IS NULL) +
        (SELECT COUNT(*) FROM crew WHERE archived_at IS NULL) as total_users
    `;
    
    // Get support tickets metrics
    const supportQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_today
      FROM support_tickets
    `;
    
    // Get system activity metrics
    const activityQuery = `
      SELECT 
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as activities_today,
        COUNT(CASE WHEN activity_type = 'user_created' THEN 1 END) as users_created_total
      FROM system_activity
    `;
    
    // Get days online from earliest user creation or system activity
    const daysOnlineQuery = `
      SELECT 
        COALESCE(
          GREATEST(
            DATE_PART('day', NOW() - (SELECT MIN(created_at) FROM system_activity WHERE activity_type = 'user_created')),
            DATE_PART('day', NOW() - (SELECT MIN(start_date::timestamp) FROM managers WHERE start_date IS NOT NULL)),
            0
          ), 
          0
        ) as days_online
    `;
    
    const [usersResult, supportResult, activityResult, daysResult] = await Promise.all([
      pool.query(usersQuery).catch(() => ({ rows: [{ total_users: 0 }] })),
      pool.query(supportQuery).catch(() => ({ rows: [{ total_tickets: 0, open_tickets: 0, investigating_tickets: 0, high_priority_tickets: 0, tickets_today: 0 }] })),
      pool.query(activityQuery).catch(() => ({ rows: [{ activities_today: 0, users_created_total: 0 }] })),
      pool.query(daysOnlineQuery).catch(() => ({ rows: [{ days_online: 0 }] }))
    ]);
    
    const metrics = {
      users: {
        total: Number(usersResult.rows[0]?.total_users || 0),
        created_today: Number(activityResult.rows[0]?.users_created_total || 0)
      },
      support_tickets: {
        total: Number(supportResult.rows[0]?.total_tickets || 0),
        open: Number(supportResult.rows[0]?.open_tickets || 0),
        investigating: Number(supportResult.rows[0]?.investigating_tickets || 0),
        high_priority: Number(supportResult.rows[0]?.high_priority_tickets || 0),
        today: Number(supportResult.rows[0]?.tickets_today || 0),
        unread: Number(supportResult.rows[0]?.open_tickets || 0) + Number(supportResult.rows[0]?.investigating_tickets || 0) // Open + investigating = unread/needing attention
      },
      system: {
        days_online: Math.max(0, Math.floor(Number(daysResult.rows[0]?.days_online || 0))),
        activities_today: Number(activityResult.rows[0]?.activities_today || 0)
      }
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch admin metrics');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch metrics',
      data: {
        users: { total: 0, created_today: 0 },
        support_tickets: { total: 0, open: 0, investigating: 0, high_priority: 0, today: 0, unread: 0 },
        system: { days_online: 0, activities_today: 0 }
      }
    });
  }
});

export default router;