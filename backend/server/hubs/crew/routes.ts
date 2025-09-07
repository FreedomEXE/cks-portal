/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * crew.ts
 * 
 * Description: Crew-specific API endpoints for operational tasks
 * Function: Provides crew-specific data endpoints for daily operations
 * Importance: Critical - Supports crew hub functionality with operational data
 * Connects to: Database pool, crew authentication, task management
 * 
 * Notes: These endpoints support the crew hub's operational workflow.
 *        Includes tasks, training, profile, and member-specific data.
 *        Uses crew-specific authentication and filtering.
 */

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';

const router = express.Router();

/**
 * Get user role from user ID prefix
 */
function getUserRole(userId: string): string | null {
  const upperUserId = userId.toUpperCase();
  
  if (
    upperUserId === 'FREEDOM_EXE' ||
    upperUserId === 'FREEDOMEXE' ||
    upperUserId.includes('ADMIN')
  ) {
    return 'admin';
  }
  
  if (upperUserId.startsWith('MGR-')) return 'manager';
  if (upperUserId.startsWith('CUS-')) return 'customer';
  if (upperUserId.startsWith('CON-')) return 'contractor';
  if (upperUserId.startsWith('CEN-')) return 'center';
  if (upperUserId.startsWith('CRW-')) return 'crew';
  
  return null;
}

/**
 * GET /api/crew/profile
 * Returns crew member profile data
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
    const role = getUserRole(userId);
    
    if (!userId) {
      return res.status(401).json({ error: 'No user ID provided' });
    }
    
    // For admin, return empty template crew profile
    if (role === 'admin') {
      const templateProfile = {
        crew_id: userId || 'CRW-000',
        name: 'Not Set',
        role: 'Not Set',
        status: 'Not Set',
        assigned_center: 'Not Assigned',
        phone: 'Not Set',
        email: 'Not Set',
        skills: [],
        certification_level: 'Not Set',
        hire_date: 'Not Set',
        manager: 'Not Assigned'
      };
      
      return res.json({
        success: true,
        data: templateProfile
      });
    }
    
    // For crew members, get their specific profile
    if (role === 'crew') {
      const query = `
        SELECT crew_id, name, status, role, address, phone, email, assigned_center
        FROM crew 
        WHERE UPPER(crew_id) = UPPER($1)
        ORDER BY name ASC
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Crew member not found' });
      }
      
      return res.json({
        success: true,
        data: result.rows[0]
      });
    }
    
    // Other roles don't have crew profiles
    return res.status(403).json({ error: 'Not authorized to view crew profiles' });
    
  } catch (error) {
    console.error('Crew profile endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch crew profile' });
  }
});

/**
 * GET /api/crew/tasks
 * Returns daily tasks for crew member
 */
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    const code = String(req.query.code || '');
    const date = String(req.query.date || 'today');
    
    // Empty template tasks - will be populated when tasks are assigned
    const templateTasks = [];
    
    res.json({
      success: true,
      data: templateTasks,
      date: date,
      crew_code: code || userId
    });
    
  } catch (error) {
    console.error('Crew tasks endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch crew tasks' });
  }
});

/**
 * GET /api/crew/training
 * Returns training modules for crew member
 */
router.get('/training', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    const code = String(req.query.code || '');
    
    // Empty template training - will be populated when training is assigned
    const templateTraining = [];
    
    res.json({
      success: true,
      data: templateTraining,
      crew_code: code || userId
    });
    
  } catch (error) {
    console.error('Crew training endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch crew training' });
  }
});

/**
 * GET /api/crew/me
 * Returns current crew member info
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!userId) {
      return res.status(401).json({ error: 'No user ID provided' });
    }
    
    // Return basic crew member info
    const memberInfo = {
      crew_id: userId,
      role: role || 'crew',
      status: 'active',
      last_login: new Date().toISOString(),
      permissions: ['view_tasks', 'update_tasks', 'view_training']
    };
    
    res.json({
      success: true,
      data: memberInfo
    });
    
  } catch (error) {
    console.error('Crew me endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch crew info' });
  }
});

/**
 * GET /api/crew/member
 * Returns crew member details
 */
router.get('/member', async (req: Request, res: Response) => {
  try {
    const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
    const role = getUserRole(userId);
    
    // Empty template member details - will be populated when crew is created
    const templateMemberDetails = {
      crew_id: userId || 'CRW-000',
      name: 'Not Set',
      position: 'Not Set',
      department: 'Not Set',
      assigned_center: 'Not Assigned',
      shift: 'Not Set',
      supervisor: 'Not Assigned',
      start_date: 'Not Set',
      certifications: [],
      contact: {
        phone: 'Not Set',
        email: 'Not Set'
      }
    };
    
    res.json({
      success: true,
      data: templateMemberDetails
    });
    
  } catch (error) {
    console.error('Crew member endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch crew member details' });
  }
});

/**
 * GET /api/crew/news
 * Returns recent news items for crew
 */
router.get('/news', async (req: Request, res: Response) => {
  try {
    const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
    const limit = Number(req.query.limit || 3);
    // Empty template news - will be populated with actual company news
    const items = [];
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('Crew news endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch crew news', error_code: 'server_error' });
  }
});

/**
 * GET /api/crew/inbox
 * Returns recent messages for crew
 */
router.get('/inbox', async (req: Request, res: Response) => {
  try {
    const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
    const limit = Number(req.query.limit || 5);
    // Empty template inbox - will be populated with actual messages
    const data = [];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Crew inbox endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch crew inbox', error_code: 'server_error' });
  }
});

// GET /api/crew/activity - Get activity feed for this crew member
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '').trim() || getUserId(req);
    if (!code) return res.status(400).json({ success: false, error: 'code required' });

    const activities = await pool.query(
      `SELECT 
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
      WHERE 
        (target_id = $1 AND target_type = 'crew') OR
        (actor_id = $1 AND actor_role = 'crew') OR
        (activity_type LIKE 'task_%' AND metadata->>'crew_id' = $1) OR
        (activity_type LIKE 'training_%' AND metadata->>'crew_id' = $1) OR
        (activity_type LIKE 'schedule_%' AND metadata->>'crew_id' = $1)
      ORDER BY created_at DESC
      LIMIT 50`,
      [code]
    );

    return res.json({ success: true, data: activities.rows });
  } catch (error) {
    console.error('Crew activity endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity', error_code: 'server_error' });
  }
});

export default router;