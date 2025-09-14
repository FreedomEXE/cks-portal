/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 001_users.sql
 *
 * Description: Core user and profile tables - shared across all roles
 * Function: Single source of truth for user identity and authentication
 * Importance: Foundation for authentication, authorization, and user management
 * Connects to: All role-based features, authentication middleware, RLS policies
 */

-- Main users table (consolidated from all role-specific versions)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,  -- Format: ADM-001, MGR-001, CON-001, etc.
  user_name TEXT NOT NULL,
  email CITEXT UNIQUE,       -- Case-insensitive email
  phone TEXT,
  role_code TEXT NOT NULL CHECK (role_code IN ('admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse')),
  template_version TEXT DEFAULT 'v1',

  -- Profile information
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',

  -- Security
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- User sessions for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  notifications JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  dashboard_config JSONB DEFAULT '{}',
  ui_preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys for programmatic access
CREATE TABLE IF NOT EXISTS user_api_keys (
  key_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_code ON users(role_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role_code, status);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_revoked ON user_api_keys(revoked);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Helper function to extract role prefix from user ID
CREATE OR REPLACE FUNCTION get_user_role_from_id(user_id TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN user_id ~ '^ADM-' THEN 'admin'
    WHEN user_id ~ '^MGR-' THEN 'manager'
    WHEN user_id ~ '^CON-' THEN 'contractor'
    WHEN user_id ~ '^CUS-' THEN 'customer'
    WHEN user_id ~ '^CEN-' THEN 'center'
    WHEN user_id ~ '^CRW-' THEN 'crew'
    WHEN user_id ~ '^WHS-' THEN 'warehouse'
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;