"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserService = void 0;
/**
 * File: users.service.ts
 *
 * Description: Admin user management service layer
 * Function: Business logic for comprehensive user management operations
 * Importance: Core service for system-wide user lifecycle management
 * Connects to: User repository, authentication, audit logging
 *
 * Notes: Complete user management service with security and audit integration
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
class AdminUserService {
    constructor(pool) {
        this.pool = pool;
    }
    async createUser(userData, adminId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Generate user ID
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Hash password if provided
            let hashedPassword = null;
            if (userData.password) {
                hashedPassword = await bcrypt_1.default.hash(userData.password, 12);
            }
            // Create user
            const userResult = await client.query(`
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
                hashedPassword,
                userData.email_verified || false,
                JSON.stringify(userData.profile_data || {}),
                JSON.stringify(userData.preferences || {}),
                adminId
            ]);
            // Create role assignment
            await client.query(`
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
            await client.query('COMMIT');
            return userResult.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async validateUserData(userData) {
        // Check if username exists
        const usernameExists = await this.pool.query('SELECT user_id FROM system_users WHERE user_name = $1 AND archived = false', [userData.user_name]);
        if (usernameExists.rows.length > 0) {
            throw new Error('Username already exists');
        }
        // Check if email exists
        const emailExists = await this.pool.query('SELECT user_id FROM system_users WHERE email = $1 AND archived = false', [userData.email]);
        if (emailExists.rows.length > 0) {
            throw new Error('Email already exists');
        }
        // Validate organization exists if provided
        if (userData.org_id) {
            const orgExists = await this.pool.query('SELECT org_id FROM organizations WHERE org_id = $1 AND archived = false', [userData.org_id]);
            if (orgExists.rows.length === 0) {
                throw new Error('Organization not found');
            }
        }
        // Validate manager exists if provided
        if (userData.manager_id) {
            const managerExists = await this.pool.query('SELECT user_id FROM system_users WHERE user_id = $1 AND archived = false', [userData.manager_id]);
            if (managerExists.rows.length === 0) {
                throw new Error('Manager not found');
            }
        }
        return true;
    }
    async resetUserPassword(userId, newPassword, adminId) {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 12);
        const result = await this.pool.query(`
      UPDATE system_users 
      SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_by = $2
      WHERE user_id = $3 AND archived = false
      RETURNING user_id, user_name, email
    `, [hashedPassword, adminId, userId]);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        return result.rows[0];
    }
    async deactivateUser(userId, adminId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Update user status
            const userResult = await client.query(`
        UPDATE system_users 
        SET status = 'inactive', updated_at = NOW(), updated_by = $1
        WHERE user_id = $2 AND archived = false
        RETURNING *
      `, [adminId, userId]);
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
            // Deactivate role assignments
            await client.query('UPDATE user_role_assignments SET is_active = false WHERE user_id = $1', [userId]);
            // Terminate active sessions
            await client.query('UPDATE user_sessions SET expires_at = NOW() WHERE user_id = $1', [userId]);
            await client.query('COMMIT');
            return userResult.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getUsersByOrganization(orgId) {
        const result = await this.pool.query(`
      SELECT 
        su.*,
        ura.role_code as current_role,
        ura.assigned_at as role_assigned_at
      FROM system_users su
      LEFT JOIN user_role_assignments ura ON su.user_id = ura.user_id AND ura.is_active = true
      WHERE su.org_id = $1 AND su.archived = false
      ORDER BY su.user_name
    `, [orgId]);
        return result.rows;
    }
    async getUserActivity(userId, days = 30) {
        const result = await this.pool.query(`
      SELECT 
        activity_type,
        activity_description,
        page_url,
        api_endpoint,
        created_at
      FROM user_activity_log
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
      LIMIT 100
    `, [userId]);
        return result.rows;
    }
}
exports.AdminUserService = AdminUserService;
//# sourceMappingURL=users.service.js.map