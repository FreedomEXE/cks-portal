/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: capabilities.sql
 *
 * Description: Manager role capabilities and permission seeds
 * Function: Define and assign ecosystem-level capabilities for manager role
 * Importance: Establishes manager permissions for overseeing contractor ecosystems
 * Connects to: Manager role configuration, RBAC system, ecosystem relationships
 */

-- Insert manager role
INSERT INTO roles (role_code, role_name, description, scope, is_active) VALUES
('manager', 'Manager', 'CKS Network Manager - oversees contractor ecosystems', 'ecosystem', true)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  is_active = EXCLUDED.is_active;

-- Assign manager permissions (subset of admin permissions focused on ecosystem management)
INSERT INTO role_permissions (role_code, perm_code, granted_by) VALUES
-- Dashboard permissions
('manager', 'dashboard:view', 'SYSTEM'),
('manager', 'dashboard:manage', 'SYSTEM'),

-- Profile permissions
('manager', 'profile:view', 'SYSTEM'),
('manager', 'profile:update', 'SYSTEM'),

-- Directory permissions (ecosystem scope)
('manager', 'directory:view', 'SYSTEM'),
('manager', 'directory:create', 'SYSTEM'),
('manager', 'directory:update', 'SYSTEM'),
('manager', 'directory:delete', 'SYSTEM'),

-- Services permissions
('manager', 'services:view', 'SYSTEM'),
('manager', 'services:create', 'SYSTEM'),
('manager', 'services:update', 'SYSTEM'),
('manager', 'services:approve', 'SYSTEM'),

-- Orders permissions
('manager', 'orders:view', 'SYSTEM'),
('manager', 'orders:create', 'SYSTEM'),
('manager', 'orders:update', 'SYSTEM'),
('manager', 'orders:approve', 'SYSTEM'),
('manager', 'orders:monitor', 'SYSTEM'),

-- Reports permissions
('manager', 'reports:view', 'SYSTEM'),
('manager', 'reports:create', 'SYSTEM'),
('manager', 'reports:export', 'SYSTEM'),

-- Support permissions
('manager', 'support:view', 'SYSTEM'),
('manager', 'support:create', 'SYSTEM'),
('manager', 'support:update', 'SYSTEM'),
('manager', 'support:resolve', 'SYSTEM'),

-- Contractor management
('manager', 'contractors:view', 'SYSTEM'),
('manager', 'contractors:create', 'SYSTEM'),
('manager', 'contractors:update', 'SYSTEM'),
('manager', 'contractors:approve', 'SYSTEM'),

-- Customer oversight
('manager', 'customers:view', 'SYSTEM'),

-- Center monitoring
('manager', 'centers:view', 'SYSTEM'),

-- Crew oversight
('manager', 'crew:view', 'SYSTEM'),

-- Warehouse monitoring
('manager', 'warehouses:view', 'SYSTEM'),

-- Assignment management
('manager', 'assignments:view', 'SYSTEM'),
('manager', 'assignments:create', 'SYSTEM'),
('manager', 'assignments:update', 'SYSTEM'),
('manager', 'assignments:approve', 'SYSTEM')

ON CONFLICT (role_code, perm_code) DO NOTHING;