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
import pool from '../db/pool';

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
    
    // For admin, return sample crew profile
    if (role === 'admin') {
      const sampleProfile = {
        crew_id: 'CRW-001',
        name: 'Sample Crew Member',
        role: 'Supervisor',
        status: 'Active',
        assigned_center: 'CEN-001',
        phone: '416-555-0123',
        email: 'crew@cks.com',
        skills: ['cleaning', 'maintenance'],
        certification_level: 'Level 2',
        hire_date: '2024-01-15',
        manager: 'MGR-001'
      };
      
      return res.json({
        success: true,
        data: sampleProfile
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
    
    // Sample daily tasks
    const sampleTasks = [
      {
        id: 'task-001',
        title: 'Morning Facility Inspection',
        area: 'Main Entrance',
        priority: 'High',
        status: 'Pending',
        estimated_time: '30 minutes',
        due_time: '09:00 AM',
        description: 'Complete visual inspection of main entrance area'
      },
      {
        id: 'task-002', 
        title: 'Equipment Maintenance Check',
        area: 'Equipment Room',
        priority: 'Medium',
        status: 'In Progress',
        estimated_time: '45 minutes',
        due_time: '11:00 AM',
        description: 'Check all cleaning equipment for proper operation'
      },
      {
        id: 'task-003',
        title: 'Afternoon Cleaning Round',
        area: 'Common Areas',
        priority: 'High',
        status: 'Pending',
        estimated_time: '2 hours',
        due_time: '02:00 PM',
        description: 'Complete cleaning of all common areas'
      }
    ];
    
    res.json({
      success: true,
      data: sampleTasks,
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
    
    // Sample training modules
    const sampleTraining = [
      {
        id: 'training-001',
        title: 'Safety Protocol Updates',
        type: 'Safety',
        status: 'Required',
        due_date: '2025-09-01',
        duration: '30 minutes',
        description: 'Updated safety protocols for facility operations'
      },
      {
        id: 'training-002',
        title: 'New Equipment Training',
        type: 'Equipment', 
        status: 'Optional',
        due_date: '2025-09-15',
        duration: '1 hour',
        description: 'Training on new cleaning equipment'
      },
      {
        id: 'training-003',
        title: 'Customer Service Excellence',
        type: 'Procedure',
        status: 'Completed',
        due_date: '2025-08-15',
        duration: '45 minutes',
        description: 'Customer interaction best practices'
      }
    ];
    
    res.json({
      success: true,
      data: sampleTraining,
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
    
    // Sample crew member details
    const memberDetails = {
      crew_id: userId,
      name: 'Sample Crew Member',
      position: 'Field Technician',
      department: 'Operations',
      assigned_center: 'CEN-001',
      shift: 'Day Shift (8AM - 5PM)',
      supervisor: 'MGR-001',
      start_date: '2024-01-15',
      certifications: ['Safety Level 2', 'Equipment Operation'],
      contact: {
        phone: '416-555-0123',
        email: 'crew@cks.com'
      }
    };
    
    res.json({
      success: true,
      data: memberDetails
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
    const items = [
      { id: 'news-001', title: 'Safety training reminder - complete by Friday', date: '2025-08-10' },
      { id: 'news-002', title: 'New time tracking system goes live Monday', date: '2025-08-05' },
      { id: 'news-003', title: 'Employee appreciation event next week', date: '2025-08-01' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
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
    const data = [
      { id: 'msg-001', from: 'Manager', subject: 'Shift update', snippet: 'Your shift starts at 6AM tomorrow', date: '2025-08-10', unread: true, priority: 'normal' },
      { id: 'msg-002', from: 'Admin', subject: 'Policy change', snippet: 'Please review the updated safety policy', date: '2025-08-09', unread: true, priority: 'high' },
      { id: 'msg-003', from: 'Center', subject: 'Supplies restock', snippet: 'Restocking scheduled for Friday', date: '2025-08-08', unread: false, priority: 'low' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Crew inbox endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch crew inbox', error_code: 'server_error' });
  }
});

export default router;
