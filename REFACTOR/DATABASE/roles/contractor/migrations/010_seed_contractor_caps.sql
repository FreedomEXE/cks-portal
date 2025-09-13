/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_contractor_caps.sql
 * 
 * Description: Inserts capability codes and assigns to contractor role.
 * Function: Seed Contractor role with required capabilities for tabs/actions.
 * Importance: Enables capability-gated UI and route access for Contractor.
 * Connects to: Auth (computes caps[]), requireCaps middleware, UI requires[].
 * 
 * Notes: Complete Contractor capability seeding based on contractor-specific features.
 */

-- Insert Contractor-specific capabilities
INSERT INTO permissions (code, description, category) VALUES
  -- Dashboard capabilities
  ('dashboard:view', 'View contractor dashboard and KPIs', 'dashboard'),
  
  -- Profile capabilities  
  ('profile:view', 'View own profile', 'profile'),
  ('profile:edit', 'Edit own profile', 'profile'),
  
  -- Services capabilities
  ('services:manage', 'Manage offered services', 'services'),
  ('services:view', 'View available services', 'services'),
  ('services:create', 'Create new services', 'services'),
  ('services:edit', 'Edit services', 'services'),
  ('services:delete', 'Delete services', 'services'),
  
  -- Ecosystem capabilities
  ('ecosystem:view', 'View ecosystem relationships and connections', 'ecosystem'),
  
  -- Orders capabilities
  ('orders:view', 'View orders and assignments', 'orders'),
  ('orders:approve', 'Approve order completion and quality', 'orders'),
  ('orders:create', 'Create new orders', 'orders'),
  ('orders:edit', 'Edit order details', 'orders'),
  ('orders:start', 'Start order execution', 'orders'),
  ('orders:complete', 'Mark orders as completed', 'orders'),
  
  -- Reports capabilities
  ('reports:view', 'View performance and completion reports', 'reports'),
  ('reports:generate', 'Generate contractor reports', 'reports'),
  ('reports:export', 'Export report data', 'reports'),
  
  -- Support capabilities
  ('support:access', 'Access contractor support center', 'support'),
  ('support:ticket', 'Create support tickets', 'support'),
  ('support:kb', 'Access knowledge base', 'support'),
  
  -- Job Management capabilities
  ('jobs:view', 'View assigned jobs', 'jobs'),
  ('jobs:accept', 'Accept job assignments', 'jobs'),
  ('jobs:decline', 'Decline job assignments', 'jobs'),
  ('jobs:start', 'Start job execution', 'jobs'),
  ('jobs:complete', 'Mark jobs as completed', 'jobs'),
  ('jobs:update', 'Update job progress and details', 'jobs'),
  
  -- Schedule capabilities
  ('schedule:view', 'View work schedule', 'schedule'),
  ('schedule:manage', 'Manage availability schedule', 'schedule'),
  ('schedule:update', 'Update schedule availability', 'schedule'),
  
  -- Equipment capabilities
  ('equipment:view', 'View equipment inventory', 'equipment'),
  ('equipment:manage', 'Manage equipment records', 'equipment'),
  ('equipment:maintenance', 'Log equipment maintenance', 'equipment'),
  
  -- Performance capabilities
  ('performance:view', 'View performance metrics', 'performance'),
  ('performance:reports', 'Access performance reports', 'performance'),
  
  -- Payment capabilities
  ('payments:view', 'View payment history', 'payments'),
  ('payments:track', 'Track payment status', 'payments'),
  
  -- Training capabilities
  ('training:access', 'Access training materials', 'training'),
  ('training:complete', 'Complete training modules', 'training')
ON CONFLICT (code) DO NOTHING;

-- Assign all Contractor capabilities to contractor role
INSERT INTO role_permissions (role_code, perm_code) VALUES
  -- Core frontend test permissions
  ('contractor', 'dashboard:view'),
  ('contractor', 'profile:view'),
  ('contractor', 'services:manage'),
  ('contractor', 'ecosystem:view'),
  ('contractor', 'orders:view'),
  ('contractor', 'orders:approve'),
  ('contractor', 'reports:view'),
  ('contractor', 'support:access'),
  
  -- Extended services capabilities
  ('contractor', 'services:view'),
  ('contractor', 'services:create'),
  ('contractor', 'services:edit'),
  ('contractor', 'services:delete'),
  
  -- Extended profile capabilities
  ('contractor', 'profile:edit'),
  
  -- Extended orders capabilities
  ('contractor', 'orders:create'),
  ('contractor', 'orders:edit'),
  ('contractor', 'orders:start'),
  ('contractor', 'orders:complete'),
  
  -- Extended reports capabilities
  ('contractor', 'reports:generate'),
  ('contractor', 'reports:export'),
  
  -- Extended support capabilities
  ('contractor', 'support:ticket'),
  ('contractor', 'support:kb'),
  
  -- Job Management (contractor-specific)
  ('contractor', 'jobs:view'),
  ('contractor', 'jobs:accept'),
  ('contractor', 'jobs:decline'),
  ('contractor', 'jobs:start'),
  ('contractor', 'jobs:complete'),
  ('contractor', 'jobs:update'),
  
  -- Schedule management
  ('contractor', 'schedule:view'),
  ('contractor', 'schedule:manage'),
  ('contractor', 'schedule:update'),
  
  -- Equipment management
  ('contractor', 'equipment:view'),
  ('contractor', 'equipment:manage'),
  ('contractor', 'equipment:maintenance'),
  
  -- Performance tracking
  ('contractor', 'performance:view'),
  ('contractor', 'performance:reports'),
  
  -- Payment tracking
  ('contractor', 'payments:view'),
  ('contractor', 'payments:track'),
  
  -- Training
  ('contractor', 'training:access'),
  ('contractor', 'training:complete')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

-- Log seeding completion
DO $$
BEGIN
  RAISE NOTICE 'Contractor capabilities seeded successfully. Total permissions: %', 
    (SELECT COUNT(*) FROM role_permissions WHERE role_code = 'contractor');
END $$;