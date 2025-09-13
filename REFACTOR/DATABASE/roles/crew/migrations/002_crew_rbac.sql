/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_crew_rbac.sql
 * 
 * Description: Creates permissions, role_permissions, user_permission_overrides for Crew role.
 * Function: Establish RBAC structures and mapping for Crew capabilities.
 * Importance: Enables capability checks and fine-grained access control.
 * Connects to: Backend requireCaps middleware; Crew capability seeds.
 * 
 * Notes: Initial schema and seed per review - crew-focused permissions.
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

-- Seed Crew permissions
INSERT INTO permissions (code, description, category) VALUES
  ('dashboard:view', 'View dashboard', 'dashboard'),
  ('profile:view', 'View profile', 'profile'),
  ('profile:edit', 'Edit profile', 'profile'),
  ('tasks:view', 'View assigned tasks', 'tasks'),
  ('tasks:update', 'Update task status', 'tasks'),
  ('schedule:view', 'View work schedule', 'schedule'),
  ('equipment:view', 'View equipment usage', 'equipment'),
  ('time:track', 'Track work time', 'time')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, perm_code) VALUES
  ('crew', 'dashboard:view'),
  ('crew', 'profile:view'),
  ('crew', 'profile:edit'),
  ('crew', 'tasks:view'),
  ('crew', 'tasks:update'),
  ('crew', 'schedule:view'),
  ('crew', 'equipment:view'),
  ('crew', 'time:track')
ON CONFLICT DO NOTHING;