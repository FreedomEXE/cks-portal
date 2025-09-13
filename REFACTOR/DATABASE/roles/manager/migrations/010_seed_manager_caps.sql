/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_manager_caps.sql
 * 
 * Description: Inserts capability codes and assigns to manager role.
 * Function: Seed Manager role with required capabilities for tabs/actions.
 * Importance: Enables capability-gated UI and route access for Manager.
 * Connects to: Auth (computes caps[]), requireCaps middleware, UI requires[].
 * 
 * Notes: Complete Manager capability seeding based on frontend test permissions.
 */

-- Insert Manager-specific capabilities
INSERT INTO permissions (code, description, category) VALUES
  -- Dashboard capabilities
  ('dashboard:view', 'View dashboard and KPIs', 'dashboard'),
  
  -- Profile capabilities  
  ('profile:view', 'View own profile', 'profile'),
  ('profile:edit', 'Edit own profile', 'profile'),
  
  -- Services capabilities
  ('services:manage', 'Manage My Services catalog', 'services'),
  ('services:view', 'View services', 'services'),
  ('services:create', 'Create new services', 'services'),
  ('services:edit', 'Edit services', 'services'),
  ('services:delete', 'Delete services', 'services'),
  
  -- Ecosystem capabilities
  ('ecosystem:view', 'View ecosystem relationships', 'ecosystem'),
  ('ecosystem:manage', 'Manage ecosystem connections', 'ecosystem'),
  
  -- Orders capabilities
  ('orders:view', 'View orders', 'orders'),
  ('orders:create', 'Create new orders', 'orders'),
  ('orders:edit', 'Edit orders', 'orders'),
  ('orders:schedule', 'Schedule orders', 'orders'),
  ('orders:approve', 'Approve orders', 'orders'),
  ('orders:cancel', 'Cancel orders', 'orders'),
  
  -- Reports capabilities
  ('reports:view', 'View reports', 'reports'),
  ('reports:generate', 'Generate reports', 'reports'),
  ('reports:manage', 'Manage report configurations', 'reports'),
  ('reports:export', 'Export reports', 'reports'),
  
  -- Support capabilities
  ('support:access', 'Access support center', 'support'),
  ('support:ticket', 'Create support tickets', 'support'),
  ('support:kb', 'Access knowledge base', 'support')
ON CONFLICT (code) DO NOTHING;

-- Assign all Manager capabilities to manager role
INSERT INTO role_permissions (role_code, perm_code) VALUES
  -- Dashboard
  ('manager', 'dashboard:view'),
  
  -- Profile
  ('manager', 'profile:view'),
  ('manager', 'profile:edit'),
  
  -- Services (full management)
  ('manager', 'services:manage'),
  ('manager', 'services:view'),
  ('manager', 'services:create'),
  ('manager', 'services:edit'),
  ('manager', 'services:delete'),
  
  -- Ecosystem
  ('manager', 'ecosystem:view'),
  ('manager', 'ecosystem:manage'),
  
  -- Orders (full management)
  ('manager', 'orders:view'),
  ('manager', 'orders:create'),
  ('manager', 'orders:edit'),
  ('manager', 'orders:schedule'),
  ('manager', 'orders:approve'),
  ('manager', 'orders:cancel'),
  
  -- Reports (full management)
  ('manager', 'reports:view'),
  ('manager', 'reports:generate'),
  ('manager', 'reports:manage'),
  ('manager', 'reports:export'),
  
  -- Support
  ('manager', 'support:access'),
  ('manager', 'support:ticket'),
  ('manager', 'support:kb')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

-- Log seeding completion
DO $$
BEGIN
  RAISE NOTICE 'Manager capabilities seeded successfully. Total permissions: %', 
    (SELECT COUNT(*) FROM role_permissions WHERE role_code = 'manager');
END $$;

