/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_admin_caps.sql
 * 
 * Description: Seeds admin capabilities and default roles for system administration.
 * Function: Initialize admin permission system with comprehensive capabilities.
 * Importance: Foundation for admin access control and security model.
 * Connects to: Admin RBAC system, auth middleware, capability verification.
 * 
 * Notes: Complete admin capability set for user, org, role, and system management.
 */

-- Insert admin capabilities
INSERT INTO admin_capabilities (capability_id, capability_name, description, category, is_system_critical) VALUES
-- User Management Capabilities
('users:create', 'Create Users', 'Create new users across all roles', 'users', true),
('users:view', 'View Users', 'View user details and listings', 'users', true),
('users:edit', 'Edit Users', 'Modify user information and settings', 'users', true),
('users:delete', 'Delete Users', 'Delete or archive users', 'users', true),
('users:assign_role', 'Assign User Roles', 'Assign and modify user roles', 'users', true),
('users:reset_password', 'Reset User Passwords', 'Reset passwords for users', 'users', false),
('users:impersonate', 'Impersonate Users', 'Login as other users for support', 'users', false),
('users:manage_sessions', 'Manage User Sessions', 'View and terminate user sessions', 'users', false),

-- Organization Management Capabilities
('organizations:create', 'Create Organizations', 'Create new organizations', 'organizations', true),
('organizations:view', 'View Organizations', 'View organization details', 'organizations', true),
('organizations:edit', 'Edit Organizations', 'Modify organization settings', 'organizations', true),
('organizations:delete', 'Delete Organizations', 'Delete or archive organizations', 'organizations', true),
('organizations:assign_users', 'Assign Users to Organizations', 'Manage user-organization relationships', 'organizations', true),
('organizations:manage_hierarchy', 'Manage Organization Hierarchy', 'Modify parent-child org relationships', 'organizations', true),

-- Role Management Capabilities
('roles:create', 'Create Roles', 'Create new user roles', 'roles', true),
('roles:view', 'View Roles', 'View role configurations', 'roles', true),
('roles:edit', 'Edit Roles', 'Modify role permissions and settings', 'roles', true),
('roles:delete', 'Delete Roles', 'Delete or archive roles', 'roles', true),
('roles:assign', 'Assign Roles', 'Assign roles to users', 'roles', true),
('roles:manage_permissions', 'Manage Role Permissions', 'Configure role-specific permissions', 'roles', true),

-- System Configuration Capabilities
('system:config', 'System Configuration', 'Modify system-wide settings', 'system', true),
('system:monitor', 'System Monitoring', 'View system health and metrics', 'system', false),
('system:backup', 'System Backup', 'Perform and manage system backups', 'system', true),
('system:maintenance', 'System Maintenance', 'Perform maintenance operations', 'system', true),
('system:notifications', 'System Notifications', 'Manage system-wide notifications', 'system', false),
('system:integrations', 'System Integrations', 'Configure external integrations', 'system', false),

-- Audit and Compliance Capabilities
('audit:view', 'View Audit Logs', 'Access system audit logs', 'audit', false),
('audit:export', 'Export Audit Data', 'Export audit logs and reports', 'audit', false),
('audit:manage', 'Manage Audit Settings', 'Configure audit retention and settings', 'audit', true),
('audit:compliance', 'Compliance Management', 'Manage compliance requirements', 'audit', true),

-- Reporting Capabilities
('reports:system', 'System Reports', 'Generate system-wide reports', 'reports', false),
('reports:users', 'User Reports', 'Generate user activity and statistics reports', 'reports', false),
('reports:organizations', 'Organization Reports', 'Generate organizational reports', 'reports', false),
('reports:security', 'Security Reports', 'Generate security and access reports', 'reports', false),
('reports:custom', 'Custom Reports', 'Create and manage custom reports', 'reports', false),

-- Security Capabilities
('security:view_events', 'View Security Events', 'Access security event logs', 'security', false),
('security:manage_policies', 'Manage Security Policies', 'Configure security policies', 'security', true),
('security:incident_response', 'Security Incident Response', 'Respond to security incidents', 'security', false),
('security:threat_management', 'Threat Management', 'Manage security threats and alerts', 'security', false),

-- Admin Management Capabilities (for super admins)
('admin:create', 'Create Administrators', 'Create new admin users', 'admin', true),
('admin:view', 'View Administrators', 'View admin user details', 'admin', true),
('admin:edit', 'Edit Administrators', 'Modify admin user information', 'admin', true),
('admin:delete', 'Delete Administrators', 'Delete or archive admin users', 'admin', true),
('admin:manage_roles', 'Manage Admin Roles', 'Assign and modify admin roles', 'admin', true)
ON CONFLICT (capability_id) DO NOTHING;

-- Insert default admin roles
INSERT INTO admin_roles (admin_role_id, role_name, description, is_default, can_manage_admins, can_manage_system) VALUES
('super_admin', 'Super Administrator', 'Full system access including admin management', false, true, true),
('system_admin', 'System Administrator', 'Full system management without admin user management', false, false, true),
('user_admin', 'User Administrator', 'User and organization management only', true, false, false),
('security_admin', 'Security Administrator', 'Security, audit, and compliance management', false, false, false),
('read_only_admin', 'Read-Only Administrator', 'View-only access to system data', false, false, false)
ON CONFLICT (admin_role_id) DO NOTHING;

-- Assign capabilities to Super Administrator role (all capabilities)
INSERT INTO admin_role_capabilities (admin_role_id, capability_id)
SELECT 'super_admin', capability_id 
FROM admin_capabilities
ON CONFLICT (admin_role_id, capability_id) DO NOTHING;

-- Assign capabilities to System Administrator role (all except admin management)
INSERT INTO admin_role_capabilities (admin_role_id, capability_id)
SELECT 'system_admin', capability_id 
FROM admin_capabilities 
WHERE category != 'admin'
ON CONFLICT (admin_role_id, capability_id) DO NOTHING;

-- Assign capabilities to User Administrator role
INSERT INTO admin_role_capabilities (admin_role_id, capability_id) VALUES
('user_admin', 'users:create'),
('user_admin', 'users:view'),
('user_admin', 'users:edit'),
('user_admin', 'users:delete'),
('user_admin', 'users:assign_role'),
('user_admin', 'users:reset_password'),
('user_admin', 'organizations:create'),
('user_admin', 'organizations:view'),
('user_admin', 'organizations:edit'),
('user_admin', 'organizations:delete'),
('user_admin', 'organizations:assign_users'),
('user_admin', 'organizations:manage_hierarchy'),
('user_admin', 'roles:view'),
('user_admin', 'roles:assign'),
('user_admin', 'reports:users'),
('user_admin', 'reports:organizations')
ON CONFLICT (admin_role_id, capability_id) DO NOTHING;

-- Assign capabilities to Security Administrator role
INSERT INTO admin_role_capabilities (admin_role_id, capability_id) VALUES
('security_admin', 'audit:view'),
('security_admin', 'audit:export'),
('security_admin', 'audit:manage'),
('security_admin', 'audit:compliance'),
('security_admin', 'security:view_events'),
('security_admin', 'security:manage_policies'),
('security_admin', 'security:incident_response'),
('security_admin', 'security:threat_management'),
('security_admin', 'users:view'),
('security_admin', 'users:manage_sessions'),
('security_admin', 'reports:security'),
('security_admin', 'reports:system'),
('security_admin', 'system:monitor')
ON CONFLICT (admin_role_id, capability_id) DO NOTHING;

-- Assign capabilities to Read-Only Administrator role
INSERT INTO admin_role_capabilities (admin_role_id, capability_id) VALUES
('read_only_admin', 'users:view'),
('read_only_admin', 'organizations:view'),
('read_only_admin', 'roles:view'),
('read_only_admin', 'system:monitor'),
('read_only_admin', 'audit:view'),
('read_only_admin', 'reports:system'),
('read_only_admin', 'reports:users'),
('read_only_admin', 'reports:organizations'),
('read_only_admin', 'security:view_events')
ON CONFLICT (admin_role_id, capability_id) DO NOTHING;