/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_admin_rbac.sql
 * 
 * Description: Creates admin role-based access control system with system-wide permissions.
 * Function: Define permission structure for admin users across all system resources.
 * Importance: Security foundation for admin access control and capability management.
 * Connects to: Auth middleware, capability verification, admin routes.
 * 
 * Notes: Admin RBAC provides granular control over system administration functions.
 */

-- Admin capabilities (system-wide permissions)
CREATE TABLE IF NOT EXISTS admin_capabilities (
  capability_id TEXT PRIMARY KEY,
  capability_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- 'users', 'organizations', 'roles', 'system', 'audit', 'reports'
  is_system_critical BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin roles (different from user roles - these are admin privilege levels)
CREATE TABLE IF NOT EXISTS admin_roles (
  admin_role_id TEXT PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  can_manage_admins BOOLEAN DEFAULT FALSE,
  can_manage_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin role capabilities mapping
CREATE TABLE IF NOT EXISTS admin_role_capabilities (
  admin_role_id TEXT,
  capability_id TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  PRIMARY KEY (admin_role_id, capability_id),
  FOREIGN KEY (admin_role_id) REFERENCES admin_roles(admin_role_id) ON DELETE CASCADE,
  FOREIGN KEY (capability_id) REFERENCES admin_capabilities(capability_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Admin user role assignments
CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_id TEXT,
  admin_role_id TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (admin_id, admin_role_id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_role_id) REFERENCES admin_roles(admin_role_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Direct capability grants (for specific permissions outside of roles)
CREATE TABLE IF NOT EXISTS admin_user_capabilities (
  admin_id TEXT,
  capability_id TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  PRIMARY KEY (admin_id, capability_id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE,
  FOREIGN KEY (capability_id) REFERENCES admin_capabilities(capability_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Permission cache for performance (denormalized view of all admin permissions)
CREATE TABLE IF NOT EXISTS admin_permission_cache (
  admin_id TEXT,
  capability_id TEXT,
  source_type TEXT, -- 'role', 'direct'
  source_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (admin_id, capability_id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE,
  FOREIGN KEY (capability_id) REFERENCES admin_capabilities(capability_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_role_capabilities_role ON admin_role_capabilities(admin_role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_capabilities_capability ON admin_role_capabilities(capability_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_admin ON admin_user_roles(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role ON admin_user_roles(admin_role_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_active ON admin_user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_user_capabilities_admin ON admin_user_capabilities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_capabilities_capability ON admin_user_capabilities(capability_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_capabilities_active ON admin_user_capabilities(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_permission_cache_admin ON admin_permission_cache(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_permission_cache_capability ON admin_permission_cache(capability_id);
CREATE INDEX IF NOT EXISTS idx_admin_permission_cache_active ON admin_permission_cache(is_active);