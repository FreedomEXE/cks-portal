/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 002_contractor_rbac.sql
 * 
 * Description: Creates permissions, role_permissions, user_permission_overrides for Contractor role.
 * Function: Establish RBAC structures and mapping for Contractor capabilities.
 * Importance: Enables capability checks and fine-grained access control.
 * Connects to: Backend requireCaps middleware; Contractor capability seeds.
 * 
 * Notes: Initial schema and seed per review - contractor-focused permissions.
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

-- Seed Contractor permissions
INSERT INTO permissions (code, description, category) VALUES
  ('dashboard:view', 'View dashboard', 'dashboard'),
  ('profile:view', 'View profile', 'profile'),
  ('profile:edit', 'Edit profile', 'profile'),
  ('jobs:view', 'View assigned jobs', 'jobs'),
  ('jobs:accept', 'Accept job assignments', 'jobs'),
  ('jobs:complete', 'Mark jobs as complete', 'jobs'),
  ('schedule:view', 'View work schedule', 'schedule'),
  ('reports:view', 'View work reports', 'reports')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, perm_code) VALUES
  ('contractor', 'dashboard:view'),
  ('contractor', 'profile:view'),
  ('contractor', 'profile:edit'),
  ('contractor', 'jobs:view'),
  ('contractor', 'jobs:accept'),
  ('contractor', 'jobs:complete'),
  ('contractor', 'schedule:view'),
  ('contractor', 'reports:view')
ON CONFLICT DO NOTHING;