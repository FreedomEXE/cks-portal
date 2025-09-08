/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * activity.ts
 * 
 * Description: System activity/audit log API for admin monitoring
 * Function: Track and retrieve system-wide activities and events
 * Importance: Critical - Provides admin visibility into system operations
 */

import express, { Request, Response } from 'express';
import pool from '../../../Database/db/pool';

// Fallback logger implementation
const logger = {
  error: (...args: any[]) => console.error(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  debug: (...args: any[]) => console.debug(...args),
};

const router = express.Router();

// GET /api/activity - Get recent system activity for admin dashboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 25, offset = 0, type } = req.query;
    
    // Ensure table exists
    await ensureActivityTable();
    
    // Hide user-targeted/personalized activity types from the admin feed by default
    // Admin feed should focus on audit-style events (e.g., user_created, assignment_made, deletes/archives)
    let whereClause = "WHERE activity_type NOT IN ('user_welcome','welcome_message','manager_assigned','contractor_assigned','center_assigned','crew_assigned')";
    const params: any[] = [];
    let paramIndex = 1;
    
    if (type) {
      whereClause += ` AND activity_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        activity_id,
        activity_type,
        actor_id,
        actor_role,
        target_id,
        target_type,
        description,
        metadata,
        created_at
      FROM system_activity
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM system_activity ${whereClause}`;
    
    const [activities, total] = await Promise.all([
      pool.query(query, [...params, Number(limit), Number(offset)]),
      pool.query(countQuery, params)
    ]);
    
    res.json({
      success: true,
      data: activities.rows,
      total: Number(total.rows[0].count),
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      pageSize: Number(limit)
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch system activity');
    res.status(500).json({ success: false, error: 'Failed to fetch system activity' });
  }
});

// POST /api/activity - Log new system activity (internal use)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      activity_type,
      actor_id,
      actor_role,
      target_id,
      target_type,
      description,
      metadata
    } = req.body;
    
    if (!activity_type || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: activity_type, description' 
      });
    }
    
    await pool.query(`
      INSERT INTO system_activity (
        activity_type, actor_id, actor_role, target_id, target_type, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [activity_type, actor_id, actor_role, target_id, target_type, description, metadata]);
    
    res.status(201).json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to log system activity');
    res.status(500).json({ success: false, error: 'Failed to log system activity' });
  }
});

// GET /api/activity/stats - Get activity statistics for admin dashboard
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Ensure table exists
    await ensureActivityTable();
    const statsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN activity_type LIKE '%_created' THEN 1 END) as creations,
        COUNT(CASE WHEN activity_type LIKE 'user_%' THEN 1 END) as user_activities,
        COUNT(CASE WHEN activity_type LIKE 'support_%' THEN 1 END) as support_activities
      FROM system_activity
    `;
    
    const typeStatsQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY activity_type
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const [stats, typeStats] = await Promise.all([
      pool.query(statsQuery),
      pool.query(typeStatsQuery)
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        by_type: typeStats.rows
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch activity stats');
    res.status(500).json({ success: false, error: 'Failed to fetch activity stats' });
  }
});

// Create system_activity table if it doesn't exist
async function ensureActivityTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_activity (
        activity_id SERIAL PRIMARY KEY,
        activity_type VARCHAR(50) NOT NULL,
        actor_id VARCHAR(60),
        actor_role VARCHAR(20),
        target_id VARCHAR(60),
        target_type VARCHAR(20),
        description TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Drop any existing check constraints that might be too restrictive
    await pool.query(`
      ALTER TABLE system_activity 
      DROP CONSTRAINT IF EXISTS system_activity_activity_type_check
    `).catch(() => {
      // Ignore if constraint doesn't exist
    });
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_system_activity_type ON system_activity(activity_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_system_activity_created_at ON system_activity(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_system_activity_actor ON system_activity(actor_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_system_activity_target ON system_activity(target_id, target_type)`);
  } catch (error) {
    logger.error({ error }, 'Failed to ensure system_activity table exists');
  }
}

// Utility function to log activity (can be imported by other modules)
export async function logActivity(
  activity_type: string,
  description: string,
  actor_id?: string,
  actor_role?: string,
  target_id?: string,
  target_type?: string,
  metadata?: any
) {
  console.log('=== LOGGING ACTIVITY ===');
  console.log({ 
    activity_type, 
    description, 
    actor_id, 
    actor_role, 
    target_id, 
    target_type, 
    metadata 
  });
  
  try {
    // Ensure table exists
    await ensureActivityTable();
    
    const result = await pool.query(`
      INSERT INTO system_activity (
        activity_type, actor_id, actor_role, target_id, target_type, description, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [activity_type, actor_id, actor_role, target_id, target_type, description, JSON.stringify(metadata)]);
    
    console.log('✅ Activity logged successfully:', result.rows[0]);
    logger.info({ activity_type, target_id, actor_id }, 'Activity logged successfully');
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    logger.error({ error, activity_type, description, actor_id, target_id }, 'Failed to log activity');
    // Log detailed error info for debugging
    if (error instanceof Error) {
      logger.error(`Activity logging error details: ${error.message}`);
      console.error(`Activity logging error details: ${error.message}`);
    }
    throw error; // Re-throw to make errors visible
  }
}

export default router;
