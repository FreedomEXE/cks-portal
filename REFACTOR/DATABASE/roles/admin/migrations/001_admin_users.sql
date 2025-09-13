/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 001_admin_users.sql
 * 
 * Description: Creates admin user structure with system-wide access capabilities.
 * Function: Define base admin user tables for system administration.
 * Importance: Core identity management for system administrators.
 * Connects to: Backend auth middleware, admin routes, user management system.
 * 
 * Notes: Admin users have system-wide privileges for user and organization management.
 */

-- Admin users table with enhanced privileges
CREATE TABLE IF NOT EXISTS admin_users (
  admin_id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  role_code TEXT NOT NULL DEFAULT 'admin',
  template_version TEXT DEFAULT 'v1',
  is_super_admin BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  password_hash TEXT NOT NULL,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  account_locked BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Admin sessions for enhanced security tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE
);

-- Admin activity log for security auditing
CREATE TABLE IF NOT EXISTS admin_activity_log (
  log_id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'organization', 'role', 'system'
  target_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  result TEXT, -- 'success', 'failure', 'unauthorized'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_code ON admin_users(role_code);
CREATE INDEX IF NOT EXISTS idx_admin_users_archived ON admin_users(archived);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);