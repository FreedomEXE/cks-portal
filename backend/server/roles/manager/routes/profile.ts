/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: profile.ts
 * 
 * Description: Manager profile management endpoints - read and update profile data
 * Function: Handle manager profile operations (GET/PATCH)
 * Importance: Enables managers to view and update their profile information
 * Connects to: users table, profile validation, activity logging
 * 
 * Notes: Complete CRUD operations for manager profile data
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import pool from '../../../../Database/db/pool';

const router = Router();

// GET /api/manager/profile - Get manager profile
router.get('/',
  requireCaps('profile:view'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const result = await pool.query(
        `SELECT user_id, user_name, email, role_code, template_version, created_at
         FROM users 
         WHERE user_id = $1`,
        [managerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      const profile = result.rows[0];
      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load profile' });
    }
  }
);

// PATCH /api/manager/profile - Update manager profile
router.patch('/',
  requireCaps('profile:edit'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const { user_name, email } = req.body;
      
      // Validate input
      if (!user_name && !email) {
        return res.status(400).json({ 
          success: false, 
          error: 'At least one field (user_name, email) must be provided' 
        });
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (user_name) {
        updates.push(`user_name = $${paramIndex++}`);
        values.push(user_name);
      }
      if (email) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      
      values.push(managerId);
      const whereIndex = paramIndex;

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE user_id = $${whereIndex}
        RETURNING user_id, user_name, email, role_code, template_version
      `;

      const result = await pool.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      // Log the profile update
      await pool.query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          managerId,
          'manager',
          'profile_update',
          'profile',
          'Manager updated profile',
          'user',
          managerId,
          JSON.stringify({ updated_fields: Object.keys(req.body) }),
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      const updatedProfile = result.rows[0];
      res.json({ success: true, data: updatedProfile, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

export default router;