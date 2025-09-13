/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: capabilities.sql
 *
 * Description: Admin role capabilities and permission seeds
 * Function: Define and assign all capabilities for admin role
 * Importance: Establishes admin as super-user with comprehensive system access
 * Connects to: Admin role configuration, RBAC system, capability definitions
 */

-- Insert admin role
INSERT INTO roles (role_code, role_name, description, scope, is_active) VALUES
('admin', 'System Administrator', 'CKS System Administrator - global system oversight and management', 'global', true)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  is_active = EXCLUDED.is_active;

-- Define all permissions/capabilities in the system
INSERT INTO permissions (perm_code, perm_name, description, domain, action, resource, is_active) VALUES
-- Dashboard permissions
('dashboard:view', 'View Dashboard', 'View dashboard KPIs and metrics', 'dashboard', 'view', 'kpis', true),
('dashboard:manage', 'Manage Dashboard', 'Manage dashboard settings and clear activity', 'dashboard', 'manage', 'settings', true),
('dashboard:admin', 'Administer Dashboard', 'Full dashboard administration', 'dashboard', 'admin', 'all', true),

-- Profile permissions
('profile:view', 'View Profile', 'View user profile information', 'profile', 'view', 'info', true),
('profile:update', 'Update Profile', 'Update user profile information', 'profile', 'update', 'info', true),
('profile:admin', 'Administer Profiles', 'Full profile administration', 'profile', 'admin', 'all', true),

-- Directory permissions
('directory:view', 'View Directory', 'View directory entities', 'directory', 'view', 'entities', true),
('directory:create', 'Create Directory Entries', 'Create new directory entities', 'directory', 'create', 'entities', true),
('directory:update', 'Update Directory Entries', 'Update directory entities', 'directory', 'update', 'entities', true),
('directory:delete', 'Delete Directory Entries', 'Delete directory entities', 'directory', 'delete', 'entities', true),
('directory:archive', 'Archive Directory Entries', 'Archive directory entities', 'directory', 'archive', 'entities', true),
('directory:admin', 'Administer Directory', 'Full directory administration', 'directory', 'admin', 'all', true),

-- User management permissions
('users:view', 'View Users', 'View user accounts', 'users', 'view', 'accounts', true),
('users:create', 'Create Users', 'Create new user accounts', 'users', 'create', 'accounts', true),
('users:update', 'Update Users', 'Update user accounts', 'users', 'update', 'accounts', true),
('users:delete', 'Delete Users', 'Delete user accounts', 'users', 'delete', 'accounts', true),
('users:archive', 'Archive Users', 'Archive user accounts', 'users', 'archive', 'accounts', true),
('users:impersonate', 'Impersonate Users', 'Impersonate other users', 'users', 'impersonate', 'accounts', true),

-- Services permissions
('services:view', 'View Services', 'View service catalog and offerings', 'services', 'view', 'catalog', true),
('services:create', 'Create Services', 'Create new services', 'services', 'create', 'catalog', true),
('services:update', 'Update Services', 'Update service information', 'services', 'update', 'catalog', true),
('services:delete', 'Delete Services', 'Delete services', 'services', 'delete', 'catalog', true),
('services:approve', 'Approve Services', 'Approve service offerings', 'services', 'approve', 'catalog', true),
('services:admin', 'Administer Services', 'Full service administration', 'services', 'admin', 'all', true),

-- Orders permissions
('orders:view', 'View Orders', 'View orders and work requests', 'orders', 'view', 'requests', true),
('orders:create', 'Create Orders', 'Create new orders', 'orders', 'create', 'requests', true),
('orders:update', 'Update Orders', 'Update order information', 'orders', 'update', 'requests', true),
('orders:delete', 'Delete Orders', 'Delete orders', 'orders', 'delete', 'requests', true),
('orders:approve', 'Approve Orders', 'Approve orders and quotes', 'orders', 'approve', 'requests', true),
('orders:monitor', 'Monitor Orders', 'Monitor order status and progress', 'orders', 'monitor', 'progress', true),
('orders:admin', 'Administer Orders', 'Full order administration', 'orders', 'admin', 'all', true),

-- Reports permissions
('reports:view', 'View Reports', 'View reports and analytics', 'reports', 'view', 'analytics', true),
('reports:create', 'Create Reports', 'Create custom reports', 'reports', 'create', 'analytics', true),
('reports:update', 'Update Reports', 'Update report configurations', 'reports', 'update', 'analytics', true),
('reports:delete', 'Delete Reports', 'Delete reports', 'reports', 'delete', 'analytics', true),
('reports:export', 'Export Reports', 'Export report data', 'reports', 'export', 'data', true),
('reports:admin', 'Administer Reports', 'Full reports administration', 'reports', 'admin', 'all', true),

-- Support permissions
('support:view', 'View Support', 'View support tickets and knowledge base', 'support', 'view', 'tickets', true),
('support:create', 'Create Support', 'Create support tickets', 'support', 'create', 'tickets', true),
('support:update', 'Update Support', 'Update support tickets', 'support', 'update', 'tickets', true),
('support:delete', 'Delete Support', 'Delete support tickets', 'support', 'delete', 'tickets', true),
('support:resolve', 'Resolve Support', 'Resolve support tickets', 'support', 'resolve', 'tickets', true),
('support:admin', 'Administer Support', 'Full support administration', 'support', 'admin', 'all', true),

-- Assignment permissions
('assignments:view', 'View Assignments', 'View job assignments', 'assignments', 'view', 'jobs', true),
('assignments:create', 'Create Assignments', 'Create job assignments', 'assignments', 'create', 'jobs', true),
('assignments:update', 'Update Assignments', 'Update job assignments', 'assignments', 'update', 'jobs', true),
('assignments:delete', 'Delete Assignments', 'Delete job assignments', 'assignments', 'delete', 'jobs', true),
('assignments:approve', 'Approve Assignments', 'Approve job assignments', 'assignments', 'approve', 'jobs', true),
('assignments:admin', 'Administer Assignments', 'Full assignment administration', 'assignments', 'admin', 'all', true),

-- Archive permissions
('archive:view', 'View Archive', 'View archived data', 'archive', 'view', 'data', true),
('archive:restore', 'Restore Archive', 'Restore archived data', 'archive', 'restore', 'data', true),
('archive:purge', 'Purge Archive', 'Permanently delete archived data', 'archive', 'purge', 'data', true),
('archive:admin', 'Administer Archive', 'Full archive administration', 'archive', 'admin', 'all', true),

-- System permissions
('system:config', 'System Configuration', 'Modify system configuration', 'system', 'config', 'settings', true),
('system:maintenance', 'System Maintenance', 'Perform system maintenance', 'system', 'maintenance', 'operations', true),
('system:backup', 'System Backup', 'Perform system backups', 'system', 'backup', 'data', true),
('system:audit', 'System Audit', 'Access system audit logs', 'system', 'audit', 'logs', true),
('system:monitoring', 'System Monitoring', 'Monitor system health and performance', 'system', 'monitoring', 'health', true),
('system:emergency_access', 'Emergency Access', 'Emergency system access override', 'system', 'emergency', 'override', true),

-- Permission management
('permissions:view', 'View Permissions', 'View role permissions', 'permissions', 'view', 'roles', true),
('permissions:create', 'Create Permissions', 'Create new permissions', 'permissions', 'create', 'roles', true),
('permissions:update', 'Update Permissions', 'Update permission assignments', 'permissions', 'update', 'roles', true),
('permissions:delete', 'Delete Permissions', 'Delete permissions', 'permissions', 'delete', 'roles', true),
('permissions:assign', 'Assign Permissions', 'Assign permissions to users/roles', 'permissions', 'assign', 'roles', true),
('permissions:admin', 'Administer Permissions', 'Full permission administration', 'permissions', 'admin', 'all', true),

-- Entity-specific permissions
('contractors:view', 'View Contractors', 'View contractor information', 'contractors', 'view', 'entities', true),
('contractors:create', 'Create Contractors', 'Create contractor accounts', 'contractors', 'create', 'entities', true),
('contractors:update', 'Update Contractors', 'Update contractor information', 'contractors', 'update', 'entities', true),
('contractors:delete', 'Delete Contractors', 'Delete contractor accounts', 'contractors', 'delete', 'entities', true),
('contractors:approve', 'Approve Contractors', 'Approve contractor applications', 'contractors', 'approve', 'entities', true),
('contractors:admin', 'Administer Contractors', 'Full contractor administration', 'contractors', 'admin', 'all', true),

('customers:view', 'View Customers', 'View customer information', 'customers', 'view', 'entities', true),
('customers:create', 'Create Customers', 'Create customer accounts', 'customers', 'create', 'entities', true),
('customers:update', 'Update Customers', 'Update customer information', 'customers', 'update', 'entities', true),
('customers:delete', 'Delete Customers', 'Delete customer accounts', 'customers', 'delete', 'entities', true),
('customers:admin', 'Administer Customers', 'Full customer administration', 'customers', 'admin', 'all', true),

('centers:view', 'View Centers', 'View center information', 'centers', 'view', 'entities', true),
('centers:create', 'Create Centers', 'Create center records', 'centers', 'create', 'entities', true),
('centers:update', 'Update Centers', 'Update center information', 'centers', 'update', 'entities', true),
('centers:delete', 'Delete Centers', 'Delete center records', 'centers', 'delete', 'entities', true),
('centers:admin', 'Administer Centers', 'Full center administration', 'centers', 'admin', 'all', true),

('crew:view', 'View Crew', 'View crew information', 'crew', 'view', 'entities', true),
('crew:create', 'Create Crew', 'Create crew records', 'crew', 'create', 'entities', true),
('crew:update', 'Update Crew', 'Update crew information', 'crew', 'update', 'entities', true),
('crew:delete', 'Delete Crew', 'Delete crew records', 'crew', 'delete', 'entities', true),
('crew:admin', 'Administer Crew', 'Full crew administration', 'crew', 'admin', 'all', true),

('warehouses:view', 'View Warehouses', 'View warehouse information', 'warehouses', 'view', 'entities', true),
('warehouses:create', 'Create Warehouses', 'Create warehouse records', 'warehouses', 'create', 'entities', true),
('warehouses:update', 'Update Warehouses', 'Update warehouse information', 'warehouses', 'update', 'entities', true),
('warehouses:delete', 'Delete Warehouses', 'Delete warehouse records', 'warehouses', 'delete', 'entities', true),
('warehouses:admin', 'Administer Warehouses', 'Full warehouse administration', 'warehouses', 'admin', 'all', true),

('managers:view', 'View Managers', 'View manager information', 'managers', 'view', 'entities', true),
('managers:create', 'Create Managers', 'Create manager accounts', 'managers', 'create', 'entities', true),
('managers:update', 'Update Managers', 'Update manager information', 'managers', 'update', 'entities', true),
('managers:delete', 'Delete Managers', 'Delete manager accounts', 'managers', 'delete', 'entities', true),
('managers:admin', 'Administer Managers', 'Full manager administration', 'managers', 'admin', 'all', true)

ON CONFLICT (perm_code) DO UPDATE SET
  perm_name = EXCLUDED.perm_name,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  action = EXCLUDED.action,
  resource = EXCLUDED.resource,
  is_active = EXCLUDED.is_active;

-- Assign ALL permissions to admin role
INSERT INTO role_permissions (role_code, perm_code, granted_by)
SELECT 'admin', perm_code, 'SYSTEM'
FROM permissions
WHERE is_active = true
ON CONFLICT (role_code, perm_code) DO NOTHING;