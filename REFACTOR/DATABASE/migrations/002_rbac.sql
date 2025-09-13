/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_rbac.sql
 *
 * Description: Role-Based Access Control system - roles, permissions, and assignments
 * Function: Centralized capability and permission management across all roles
 * Importance: Foundation for authorization and security throughout the system
 * Connects to: Authentication middleware, role configurations, RLS policies
 */

-- Roles table - defines available roles in the system
CREATE TABLE IF NOT EXISTS roles (
  role_code TEXT PRIMARY KEY CHECK (role_code IN ('admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse')),
  role_name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'ecosystem', 'entity')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions/capabilities table - defines granular permissions
CREATE TABLE IF NOT EXISTS permissions (
  perm_code TEXT PRIMARY KEY,
  perm_name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL, -- e.g., 'dashboard', 'profile', 'orders', 'users'
  action TEXT NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', 'admin'
  resource TEXT,        -- e.g., 'kpis', 'activity', 'contractors'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions mapping - which permissions each role has by default
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT REFERENCES roles(role_code) ON DELETE CASCADE,
  perm_code TEXT REFERENCES permissions(perm_code) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  PRIMARY KEY (role_code, perm_code)
);

-- User permission overrides - individual user permission overrides
CREATE TABLE IF NOT EXISTS user_permission_overrides (
  user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  perm_code TEXT REFERENCES permissions(perm_code) ON DELETE CASCADE,
  allow BOOLEAN NOT NULL, -- TRUE = grant permission, FALSE = revoke permission
  reason TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, perm_code)
);

-- Role hierarchy (for future use - managers can act on behalf of contractors, etc.)
CREATE TABLE IF NOT EXISTS role_hierarchy (
  parent_role TEXT REFERENCES roles(role_code),
  child_role TEXT REFERENCES roles(role_code),
  can_impersonate BOOLEAN DEFAULT FALSE,
  can_manage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parent_role, child_role)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_domain ON permissions(domain);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_domain_action ON permissions(domain, action);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

CREATE INDEX IF NOT EXISTS idx_user_overrides_user ON user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_overrides_perm ON user_permission_overrides(perm_code);
CREATE INDEX IF NOT EXISTS idx_user_overrides_expires ON user_permission_overrides(expires_at);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_hierarchy ENABLE ROW LEVEL SECURITY;

-- Function to compute user capabilities
CREATE OR REPLACE FUNCTION get_user_capabilities(target_user_id TEXT)
RETURNS TEXT[] AS $$
DECLARE
  user_role TEXT;
  base_caps TEXT[];
  override_caps TEXT[];
  final_caps TEXT[];
BEGIN
  -- Get user's role
  SELECT role_code INTO user_role FROM users WHERE user_id = target_user_id;

  IF user_role IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- Get base role permissions
  SELECT ARRAY_AGG(perm_code) INTO base_caps
  FROM role_permissions
  WHERE role_code = user_role;

  -- Initialize final_caps with base_caps
  final_caps := COALESCE(base_caps, ARRAY[]::TEXT[]);

  -- Apply user-specific overrides
  FOR override_caps IN
    SELECT ARRAY[perm_code, allow::TEXT]
    FROM user_permission_overrides
    WHERE user_id = target_user_id
      AND (expires_at IS NULL OR expires_at > NOW())
  LOOP
    IF override_caps[2] = 'true' THEN
      -- Grant permission
      IF NOT (override_caps[1] = ANY(final_caps)) THEN
        final_caps := array_append(final_caps, override_caps[1]);
      END IF;
    ELSE
      -- Revoke permission
      final_caps := array_remove(final_caps, override_caps[1]);
    END IF;
  END LOOP;

  RETURN final_caps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific capability
CREATE OR REPLACE FUNCTION user_has_capability(target_user_id TEXT, capability TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN capability = ANY(get_user_capabilities(target_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user capabilities (for RLS policies)
CREATE OR REPLACE FUNCTION current_user_capabilities()
RETURNS TEXT[] AS $$
BEGIN
  RETURN get_user_capabilities(current_setting('app.current_user_id', true));
EXCEPTION
  WHEN OTHERS THEN
    RETURN ARRAY[]::TEXT[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has capability (for RLS policies)
CREATE OR REPLACE FUNCTION current_user_has_capability(capability TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN capability = ANY(current_user_capabilities());
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();