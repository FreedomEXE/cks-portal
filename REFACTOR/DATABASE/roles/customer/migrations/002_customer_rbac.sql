/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_customer_rbac.sql
 * 
 * Description: Creates permissions, role_permissions, user_permission_overrides for Customer role.
 * Function: Establish RBAC structures and mapping for Customer capabilities.
 * Importance: Enables capability checks and fine-grained access control.
 * Connects to: Backend requireCaps middleware; Customer capability seeds.
 * 
 * Notes: Initial schema and seed per review - customer-focused permissions.
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

-- Seed Customer permissions
INSERT INTO permissions (code, description, category) VALUES
  ('dashboard:view', 'View dashboard', 'dashboard'),
  ('profile:view', 'View profile', 'profile'),
  ('profile:edit', 'Edit profile', 'profile'),
  ('requests:view', 'View service requests', 'requests'),
  ('requests:create', 'Create service requests', 'requests'),
  ('requests:edit', 'Edit service requests', 'requests'),
  ('orders:view', 'View order history', 'orders'),
  ('billing:view', 'View billing information', 'billing'),
  ('support:access', 'Access customer support', 'support')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, perm_code) VALUES
  ('customer', 'dashboard:view'),
  ('customer', 'profile:view'),
  ('customer', 'profile:edit'),
  ('customer', 'requests:view'),
  ('customer', 'requests:create'),
  ('customer', 'requests:edit'),
  ('customer', 'orders:view'),
  ('customer', 'billing:view'),
  ('customer', 'support:access')
ON CONFLICT DO NOTHING;