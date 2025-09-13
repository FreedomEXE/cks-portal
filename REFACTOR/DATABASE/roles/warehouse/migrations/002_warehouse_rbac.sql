/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_warehouse_rbac.sql
 * 
 * Description: Creates permissions, role_permissions, user_permission_overrides for Warehouse role.
 * Function: Establish RBAC structures and mapping for Warehouse capabilities.
 * Importance: Enables capability checks and fine-grained access control.
 * Connects to: Backend requireCaps middleware; Warehouse capability seeds.
 * 
 * Notes: Initial schema and seed per review - warehouse-focused permissions.
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

-- Seed Warehouse permissions
INSERT INTO permissions (code, description, category) VALUES
  ('dashboard:view', 'View dashboard', 'dashboard'),
  ('profile:view', 'View profile', 'profile'),
  ('profile:edit', 'Edit profile', 'profile'),
  ('inventory:view', 'View inventory', 'inventory'),
  ('inventory:manage', 'Manage inventory levels', 'inventory'),
  ('deliveries:view', 'View delivery schedules', 'deliveries'),
  ('deliveries:manage', 'Manage deliveries', 'deliveries'),
  ('stock:track', 'Track stock movements', 'stock'),
  ('reports:view', 'View warehouse reports', 'reports')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, perm_code) VALUES
  ('warehouse', 'dashboard:view'),
  ('warehouse', 'profile:view'),
  ('warehouse', 'profile:edit'),
  ('warehouse', 'inventory:view'),
  ('warehouse', 'inventory:manage'),
  ('warehouse', 'deliveries:view'),
  ('warehouse', 'deliveries:manage'),
  ('warehouse', 'stock:track'),
  ('warehouse', 'reports:view')
ON CONFLICT DO NOTHING;