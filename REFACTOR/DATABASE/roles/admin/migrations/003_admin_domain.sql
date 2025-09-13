/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_admin_domain.sql
 * 
 * Description: Creates admin domain-specific tables for system configuration and management.
 * Function: Define system-wide configuration, organization management, and audit structures.
 * Importance: Core admin functionality for system oversight and configuration.
 * Connects to: Admin services, system monitoring, organization management.
 * 
 * Notes: Admin domain includes system config, user/org management, and audit capabilities.
 */

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  config_key TEXT PRIMARY KEY,
  config_value JSONB,
  description TEXT,
  category TEXT, -- 'security', 'ui', 'notifications', 'integrations', 'limits'
  is_sensitive BOOLEAN DEFAULT FALSE,
  is_readonly BOOLEAN DEFAULT FALSE,
  validation_schema JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  FOREIGN KEY (updated_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- System-wide organizations management
CREATE TABLE IF NOT EXISTS organizations (
  org_id TEXT PRIMARY KEY,
  org_name TEXT NOT NULL,
  org_code TEXT UNIQUE,
  parent_org_id TEXT,
  org_type TEXT, -- 'corporate', 'branch', 'division', 'team'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB,
  settings JSONB,
  billing_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  archived BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (parent_org_id) REFERENCES organizations(org_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- System-wide user management (all users across all roles)
CREATE TABLE IF NOT EXISTS system_users (
  user_id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  role_code TEXT NOT NULL,
  org_id TEXT,
  manager_id TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'pending'
  last_login TIMESTAMPTZ,
  password_hash TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  profile_data JSONB,
  preferences JSONB,
  template_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  archived BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES system_users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- User role assignments and history
CREATE TABLE IF NOT EXISTS user_role_assignments (
  assignment_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_code TEXT NOT NULL,
  org_id TEXT,
  assigned_by TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES system_users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- System notifications and alerts
CREATE TABLE IF NOT EXISTS system_notifications (
  notification_id TEXT PRIMARY KEY,
  notification_type TEXT NOT NULL, -- 'system', 'security', 'maintenance', 'user'
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  target_audience TEXT, -- 'all_users', 'admins', 'role:manager', 'org:123'
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  FOREIGN KEY (created_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- System monitoring and health checks
CREATE TABLE IF NOT EXISTS system_health (
  health_id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time INTEGER, -- in milliseconds
  error_count INTEGER DEFAULT 0,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System backup and maintenance logs
CREATE TABLE IF NOT EXISTS system_maintenance (
  maintenance_id TEXT PRIMARY KEY,
  maintenance_type TEXT NOT NULL, -- 'backup', 'cleanup', 'migration', 'update'
  description TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'failed'
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  result_data JSONB,
  performed_by TEXT,
  FOREIGN KEY (performed_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_system_users_role_code ON system_users(role_code);
CREATE INDEX IF NOT EXISTS idx_system_users_org_id ON system_users(org_id);
CREATE INDEX IF NOT EXISTS idx_system_users_manager_id ON system_users(manager_id);
CREATE INDEX IF NOT EXISTS idx_system_users_status ON system_users(status);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role_code);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON system_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_maintenance_type ON system_maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_system_maintenance_status ON system_maintenance(status);