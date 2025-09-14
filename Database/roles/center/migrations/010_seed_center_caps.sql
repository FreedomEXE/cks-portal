/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_center_caps.sql
 * 
 * Description: Inserts capability codes and assigns to center role.
 * Function: Seed Center role with required capabilities for tabs/actions.
 * Importance: Enables capability-gated UI and route access for Center.
 * Connects to: Auth (computes caps[]), requireCaps middleware, UI requires[].
 * 
 * Notes: Complete Center capability seeding based on center-specific features.
 */

-- Insert Center-specific capabilities
INSERT INTO permissions (code, description, category) VALUES
  -- Dashboard capabilities
  ('dashboard:view', 'View center dashboard and facility overview', 'dashboard'),
  
  -- Profile capabilities  
  ('profile:view', 'View center profile and facility information', 'profile'),
  ('profile:edit', 'Edit center profile and facility details', 'profile'),
  
  -- Services capabilities
  ('services:manage', 'Manage facility services and providers', 'services'),
  ('services:view', 'View scheduled services and providers', 'services'),
  ('services:create', 'Create new service requests', 'services'),
  ('services:edit', 'Edit service configurations', 'services'),
  ('services:schedule', 'Schedule facility services', 'services'),
  ('services:track', 'Track service completion and quality', 'services'),
  
  -- Ecosystem capabilities
  ('ecosystem:view', 'View ecosystem partners and connections', 'ecosystem'),
  
  -- Orders capabilities
  ('orders:view', 'View facility service orders', 'orders'),
  ('orders:create', 'Create new service orders', 'orders'),
  ('orders:edit', 'Edit order details', 'orders'),
  ('orders:track', 'Track order progress', 'orders'),
  
  -- Reports capabilities
  ('reports:view', 'View facility reports and analytics', 'reports'),
  ('reports:generate', 'Generate custom facility reports', 'reports'),
  ('reports:export', 'Export facility data and reports', 'reports'),
  
  -- Support capabilities
  ('support:access', 'Access facility support center', 'support'),
  ('support:ticket', 'Create facility support tickets', 'support'),
  ('support:kb', 'Access facility knowledge base', 'support'),
  
  -- Facility capabilities (center-specific)
  ('facility:view', 'View facility information and areas', 'facility'),
  ('facility:manage', 'Manage facility areas and configurations', 'facility'),
  ('facility:operations', 'Manage daily facility operations', 'facility'),
  
  -- Maintenance capabilities
  ('maintenance:view', 'View maintenance requests and schedules', 'maintenance'),
  ('maintenance:create', 'Create maintenance requests', 'maintenance'),
  ('maintenance:manage', 'Manage maintenance requests and work orders', 'maintenance'),
  ('maintenance:approve', 'Approve maintenance requests', 'maintenance'),
  ('maintenance:schedule', 'Schedule maintenance activities', 'maintenance'),
  
  -- Visitor capabilities
  ('visitors:view', 'View visitor logs and current visitors', 'visitors'),
  ('visitors:checkin', 'Check in visitors to the facility', 'visitors'),
  ('visitors:checkout', 'Check out visitors from the facility', 'visitors'),
  ('visitors:track', 'Track visitor movement and access', 'visitors'),
  ('visitors:manage', 'Manage visitor access and permissions', 'visitors'),
  
  -- Equipment capabilities
  ('equipment:view', 'View equipment inventory and status', 'equipment'),
  ('equipment:manage', 'Manage equipment records and maintenance', 'equipment'),
  ('equipment:track', 'Track equipment usage and performance', 'equipment'),
  
  -- Operations capabilities
  ('operations:view', 'View daily operations data', 'operations'),
  ('operations:manage', 'Manage daily operations and metrics', 'operations'),
  ('operations:report', 'Generate operations reports', 'operations'),
  
  -- Security capabilities
  ('security:view', 'View security logs and incidents', 'security'),
  ('security:manage', 'Manage security protocols and access', 'security'),
  ('security:alerts', 'Receive and manage security alerts', 'security'),
  
  -- Energy capabilities
  ('energy:view', 'View energy usage and efficiency data', 'energy'),
  ('energy:manage', 'Manage energy consumption and settings', 'energy'),
  
  -- Compliance capabilities
  ('compliance:view', 'View compliance status and requirements', 'compliance'),
  ('compliance:manage', 'Manage compliance documentation', 'compliance')
ON CONFLICT (code) DO NOTHING;

-- Assign all Center capabilities to center role
INSERT INTO role_permissions (role_code, perm_code) VALUES
  -- Core frontend test permissions
  ('center', 'dashboard:view'),
  ('center', 'profile:view'),
  ('center', 'services:manage'),
  ('center', 'ecosystem:view'),
  ('center', 'orders:view'),
  ('center', 'reports:view'),
  ('center', 'support:access'),
  ('center', 'facility:manage'),
  ('center', 'maintenance:view'),
  ('center', 'visitors:track'),
  
  -- Extended profile capabilities
  ('center', 'profile:edit'),
  
  -- Extended services capabilities
  ('center', 'services:view'),
  ('center', 'services:create'),
  ('center', 'services:edit'),
  ('center', 'services:schedule'),
  ('center', 'services:track'),
  
  -- Extended orders capabilities
  ('center', 'orders:create'),
  ('center', 'orders:edit'),
  ('center', 'orders:track'),
  
  -- Extended reports capabilities
  ('center', 'reports:generate'),
  ('center', 'reports:export'),
  
  -- Extended support capabilities
  ('center', 'support:ticket'),
  ('center', 'support:kb'),
  
  -- Extended facility capabilities
  ('center', 'facility:view'),
  ('center', 'facility:operations'),
  
  -- Extended maintenance capabilities
  ('center', 'maintenance:create'),
  ('center', 'maintenance:manage'),
  ('center', 'maintenance:approve'),
  ('center', 'maintenance:schedule'),
  
  -- Extended visitor capabilities
  ('center', 'visitors:view'),
  ('center', 'visitors:checkin'),
  ('center', 'visitors:checkout'),
  ('center', 'visitors:manage'),
  
  -- Equipment management
  ('center', 'equipment:view'),
  ('center', 'equipment:manage'),
  ('center', 'equipment:track'),
  
  -- Operations management
  ('center', 'operations:view'),
  ('center', 'operations:manage'),
  ('center', 'operations:report'),
  
  -- Security management
  ('center', 'security:view'),
  ('center', 'security:manage'),
  ('center', 'security:alerts'),
  
  -- Energy management
  ('center', 'energy:view'),
  ('center', 'energy:manage'),
  
  -- Compliance management
  ('center', 'compliance:view'),
  ('center', 'compliance:manage')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

-- Log seeding completion
DO $$
BEGIN
  RAISE NOTICE 'Center capabilities seeded successfully. Total permissions: %', 
    (SELECT COUNT(*) FROM role_permissions WHERE role_code = 'center');
END $$;