"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * File: users.ts
 *
 * Description: Admin user management routes for creating, editing, and managing all system users
 * Function: Provide comprehensive user management capabilities across all roles
 * Importance: Core admin functionality for user lifecycle management
 * Connects to: User service, organization management, role assignment
 *
 * Notes: Complete CRUD operations for system-wide user management with security audit
 */
const express_1 = require("express");
const requireCaps_1 = require("../../../middleware/requireCaps");
const users_schema_1 = require("../validators/users.schema");
const validation_1 = require("../../../middleware/validation");
const router = (0, express_1.Router)();
// Get all users with filtering and pagination
router.get('/', (0, requireCaps_1.requireCaps)('users:view'), async (req, res) => {
    try {
        const { page = 1, limit = 50, role_code, org_id, status, search } = req.query;
        const pool = require('../../../Database/db/pool');
        let whereConditions = ['su.archived = false'];
        let queryParams = [];
        let paramCount = 0;
        // Add filters
        if (role_code) {
            whereConditions.push(`su.role_code = $${++paramCount}`);
            queryParams.push(role_code);
        }
        if (org_id) {
            whereConditions.push(`su.org_id = $${++paramCount}`);
            queryParams.push(org_id);
        }
        if (status) {
            whereConditions.push(`su.status = $${++paramCount}`);
            queryParams.push(status);
        }
        if (search) {
            whereConditions.push(`(
          su.user_name ILIKE $${++paramCount} OR 
          su.email ILIKE $${paramCount} OR 
          su.first_name ILIKE $${paramCount} OR 
          su.last_name ILIKE $${paramCount}
        )`);
            queryParams.push(`%${search}%`);
        }
        const whereClause = whereConditions.join(' AND ');
        const offset = (Number(page) - 1) * Number(limit);
        // Add pagination params
        queryParams.push(Number(limit), offset);
        const query = `
        SELECT 
          su.user_id,
          su.user_name,
          su.email,
          su.phone,
          su.first_name,
          su.last_name,
          su.role_code,
          su.org_id,
          o.org_name,
          su.manager_id,
          mg.user_name as manager_name,
          su.status,
          su.last_login,
          su.email_verified,
          su.created_at,
          su.updated_at
        FROM system_users su
        LEFT JOIN organizations o ON su.org_id = o.org_id
        LEFT JOIN system_users mg ON su.manager_id = mg.user_id
        WHERE ${whereClause}
        ORDER BY su.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;
        const result = await pool.query(query, queryParams);
        // Get total count for pagination
        const countQuery = `
        SELECT COUNT(*) as total
        FROM system_users su
        WHERE ${whereClause}
      `;
        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: Number(countResult.rows[0].total),
                    pages: Math.ceil(Number(countResult.rows[0].total) / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});
// Get specific user by ID
router.get('/:userId', (0, requireCaps_1.requireCaps)('users:view'), async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = require('../../../Database/db/pool');
        const result = await pool.query(`
        SELECT 
          su.*,
          o.org_name,
          mg.user_name as manager_name,
          COALESCE(
            json_agg(
              json_build_object(
                'assignment_id', ura.assignment_id,
                'role_code', ura.role_code,
                'assigned_at', ura.assigned_at,
                'expires_at', ura.expires_at,
                'is_active', ura.is_active
              )
            ) FILTER (WHERE ura.assignment_id IS NOT NULL), 
            '[]'::json
          ) as role_history
        FROM system_users su
        LEFT JOIN organizations o ON su.org_id = o.org_id
        LEFT JOIN system_users mg ON su.manager_id = mg.user_id
        LEFT JOIN user_role_assignments ura ON su.user_id = ura.user_id
        WHERE su.user_id = $1 AND su.archived = false
        GROUP BY su.user_id, o.org_name, mg.user_name
      `, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
});
// Create new user
router.post('/', (0, requireCaps_1.requireCaps)('users:create'), (0, validation_1.validateRequest)(users_schema_1.userCreationSchema), async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const userData = req.body;
        const pool = require('../../../Database/db/pool');
        // Start transaction
        await pool.query('BEGIN');
        try {
            // Generate user ID
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Create user
            const result = await pool.query(`
          INSERT INTO system_users (
            user_id, user_name, email, phone, first_name, last_name,
            role_code, org_id, manager_id, status, password_hash,
            email_verified, profile_data, preferences, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `, [
                userId,
                userData.user_name,
                userData.email,
                userData.phone || null,
                userData.first_name,
                userData.last_name,
                userData.role_code,
                userData.org_id || null,
                userData.manager_id || null,
                userData.status || 'pending',
                userData.password_hash, // Should be hashed by frontend or service
                userData.email_verified || false,
                JSON.stringify(userData.profile_data || {}),
                JSON.stringify(userData.preferences || {}),
                adminId
            ]);
            // Create role assignment record
            await pool.query(`
          INSERT INTO user_role_assignments (
            assignment_id, user_id, role_code, org_id, assigned_by, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                userData.role_code,
                userData.org_id || null,
                adminId,
                true
            ]);
            // Log admin activity
            await pool.query(`
          INSERT INTO admin_activity_log (log_id, admin_id, action, target_type, target_id, details, result)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
                `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                adminId,
                'CREATE_USER',
                'user',
                userId,
                JSON.stringify({
                    user_name: userData.user_name,
                    email: userData.email,
                    role_code: userData.role_code,
                    org_id: userData.org_id
                }),
                'success'
            ]);
            await pool.query('COMMIT');
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'User created successfully'
            });
        }
        catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('User creation error:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, error: 'Username or email already exists' });
        }
        else {
            res.status(500).json({ success: false, error: 'Failed to create user' });
        }
    }
});
// Update user
router.put('/:userId', (0, requireCaps_1.requireCaps)('users:edit'), (0, validation_1.validateRequest)(users_schema_1.userUpdateSchema), async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user?.userId;
        const updateData = req.body;
        const pool = require('../../../Database/db/pool');
        // Get current user data for audit
        const currentUser = await pool.query('SELECT * FROM system_users WHERE user_id = $1 AND archived = false', [userId]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;
        const allowedFields = [
            'user_name', 'email', 'phone', 'first_name', 'last_name',
            'org_id', 'manager_id', 'status', 'email_verified', 'profile_data', 'preferences'
        ];
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updateFields.push(`${field} = $${++paramCount}`);
                updateValues.push(['profile_data', 'preferences'].includes(field)
                    ? JSON.stringify(updateData[field])
                    : updateData[field]);
            }
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }
        // Add updated_at and updated_by
        updateFields.push(`updated_at = NOW()`, `updated_by = $${++paramCount}`);
        updateValues.push(adminId);
        // Add user ID for WHERE clause
        updateValues.push(userId);
        const query = `
        UPDATE system_users 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${++paramCount} AND archived = false
        RETURNING *
      `;
        const result = await pool.query(query, updateValues);
        // Log admin activity
        await pool.query(`
        INSERT INTO admin_activity_log (log_id, admin_id, action, target_type, target_id, details, result)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
            `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            adminId,
            'UPDATE_USER',
            'user',
            userId,
            JSON.stringify({
                changes: updateData,
                previous: currentUser.rows[0]
            }),
            'success'
        ]);
        res.json({
            success: true,
            data: result.rows[0],
            message: 'User updated successfully'
        });
    }
    catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});
// Assign role to user
router.post('/:userId/roles', (0, requireCaps_1.requireCaps)('users:assign_role'), (0, validation_1.validateRequest)(users_schema_1.roleAssignmentSchema), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role_code, org_id, expires_at, notes } = req.body;
        const adminId = req.user?.userId;
        const pool = require('../../../Database/db/pool');
        // Verify user exists
        const userCheck = await pool.query('SELECT user_id FROM system_users WHERE user_id = $1 AND archived = false', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Deactivate existing role assignments for this user
        await pool.query('UPDATE user_role_assignments SET is_active = false WHERE user_id = $1', [userId]);
        // Create new role assignment
        const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const result = await pool.query(`
        INSERT INTO user_role_assignments (
          assignment_id, user_id, role_code, org_id, assigned_by, 
          expires_at, is_active, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
            assignmentId,
            userId,
            role_code,
            org_id || null,
            adminId,
            expires_at || null,
            true,
            notes || null
        ]);
        // Update user's primary role
        await pool.query('UPDATE system_users SET role_code = $1, org_id = $2, updated_by = $3 WHERE user_id = $4', [role_code, org_id || null, adminId, userId]);
        // Log admin activity
        await pool.query(`
        INSERT INTO admin_activity_log (log_id, admin_id, action, target_type, target_id, details, result)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
            `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            adminId,
            'ASSIGN_ROLE',
            'user',
            userId,
            JSON.stringify({
                role_code,
                org_id,
                expires_at,
                notes
            }),
            'success'
        ]);
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Role assigned successfully'
        });
    }
    catch (error) {
        console.error('Role assignment error:', error);
        res.status(500).json({ success: false, error: 'Failed to assign role' });
    }
});
// Delete/Archive user
router.delete('/:userId', (0, requireCaps_1.requireCaps)('users:delete'), async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user?.userId;
        const pool = require('../../../Database/db/pool');
        // Get user data for audit
        const userData = await pool.query('SELECT * FROM system_users WHERE user_id = $1 AND archived = false', [userId]);
        if (userData.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Archive user instead of deleting
        await pool.query(`
        UPDATE system_users 
        SET archived = true, updated_at = NOW(), updated_by = $1, status = 'archived'
        WHERE user_id = $2
      `, [adminId, userId]);
        // Deactivate role assignments
        await pool.query('UPDATE user_role_assignments SET is_active = false WHERE user_id = $1', [userId]);
        // Log admin activity
        await pool.query(`
        INSERT INTO admin_activity_log (log_id, admin_id, action, target_type, target_id, details, result)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
            `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            adminId,
            'DELETE_USER',
            'user',
            userId,
            JSON.stringify({
                archived_user: userData.rows[0]
            }),
            'success'
        ]);
        res.json({
            success: true,
            message: 'User archived successfully'
        });
    }
    catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ success: false, error: 'Failed to archive user' });
    }
});
// Reset user password
router.post('/:userId/reset-password', (0, requireCaps_1.requireCaps)('users:reset_password'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { new_password_hash } = req.body;
        const adminId = req.user?.userId;
        const pool = require('../../../Database/db/pool');
        if (!new_password_hash) {
            return res.status(400).json({ success: false, error: 'New password hash required' });
        }
        // Update password
        const result = await pool.query(`
        UPDATE system_users 
        SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_by = $2
        WHERE user_id = $3 AND archived = false
        RETURNING user_id, user_name, email
      `, [new_password_hash, adminId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Log admin activity (don't include password hash in details)
        await pool.query(`
        INSERT INTO admin_activity_log (log_id, admin_id, action, target_type, target_id, details, result)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
            `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            adminId,
            'RESET_PASSWORD',
            'user',
            userId,
            JSON.stringify({
                target_user: result.rows[0].user_name,
                target_email: result.rows[0].email
            }),
            'success'
        ]);
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ success: false, error: 'Failed to reset password' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map