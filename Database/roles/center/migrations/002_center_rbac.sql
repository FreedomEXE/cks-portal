/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_center_rbac.sql
 * 
 * Description: Creates permissions, role_permissions, user_permission_overrides for Center role.
 * Function: Establish RBAC structures and mapping for Center capabilities.
 * Importance: Enables capability checks and fine-grained access control.
 * Connects to: Backend requireCaps middleware; Center capability seeds.
 * 
 * Notes: Initial schema and seed per review - center-focused permissions.
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

-- Seed Center permissions
INSERT INTO permissions (code, description, category) VALUES
  ('dashboard:view', 'View dashboard', 'dashboard'),
  ('profile:view', 'View profile', 'profile'),
  ('profile:edit', 'Edit profile', 'profile'),
  ('facility:view', 'View facility information', 'facility'),
  ('facility:manage', 'Manage facility operations', 'facility'),
  ('visitors:track', 'Track visitor access', 'visitors'),
  ('operations:view', 'View operations data', 'operations'),
  ('reports:view', 'View center reports', 'reports')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, perm_code) VALUES
  ('center', 'dashboard:view'),
  ('center', 'profile:view'),
  ('center', 'profile:edit'),
  ('center', 'facility:view'),
  ('center', 'facility:manage'),
  ('center', 'visitors:track'),
  ('center', 'operations:view'),
  ('center', 'reports:view')
ON CONFLICT DO NOTHING;