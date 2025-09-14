/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_crew_caps.sql
 * 
 * Description: Inserts capability codes and assigns to crew role.
 * Function: Seed Crew role with required capabilities for tabs/actions.
 * Importance: Enables capability-gated UI and route access for Crew.
 * Connects to: Auth (computes caps[]), requireCaps middleware, UI requires[].
 * 
 * Notes: Complete Crew capability seeding based on crew-specific features.
 */

-- Insert Crew-specific capabilities
INSERT INTO permissions (code, description, category) VALUES
  -- Dashboard capabilities
  ('dashboard:view', 'View crew dashboard and task overview', 'dashboard'),
  
  -- Profile capabilities  
  ('profile:view', 'View own crew profile', 'profile'),
  ('profile:edit', 'Edit own crew profile', 'profile'),
  
  -- Services capabilities
  ('services:view', 'View available services and assignments', 'services'),
  ('services:manage', 'Manage service assignments', 'services'),
  
  -- Ecosystem capabilities
  ('ecosystem:view', 'View team connections and hierarchy', 'ecosystem'),
  
  -- Orders capabilities
  ('orders:view', 'View work orders and assignments', 'orders'),
  ('orders:start', 'Start order execution', 'orders'),
  ('orders:complete', 'Complete order tasks', 'orders'),
  ('orders:update', 'Update order progress', 'orders'),
  
  -- Reports capabilities
  ('reports:view', 'View work reports and performance', 'reports'),
  ('reports:submit', 'Submit work completion reports', 'reports'),
  ('reports:generate', 'Generate task reports', 'reports'),
  
  -- Support capabilities
  ('support:access', 'Access crew support center', 'support'),
  ('support:ticket', 'Create support tickets', 'support'),
  ('support:kb', 'Access knowledge base', 'support'),
  
  -- Task capabilities (crew-specific)
  ('tasks:view', 'View assigned tasks', 'tasks'),
  ('tasks:start', 'Start task execution', 'tasks'),
  ('tasks:update', 'Update task progress and status', 'tasks'),
  ('tasks:complete', 'Mark tasks as completed', 'tasks'),
  ('tasks:manage', 'Manage task assignments and progress', 'tasks'),
  ('tasks:notes', 'Add notes to tasks', 'tasks'),
  
  -- Schedule capabilities
  ('schedule:view', 'View work schedule', 'schedule'),
  ('schedule:checkin', 'Check in for scheduled shifts', 'schedule'),
  ('schedule:checkout', 'Check out from shifts', 'schedule'),
  
  -- Equipment capabilities
  ('equipment:view', 'View available equipment', 'equipment'),
  ('equipment:use', 'Use equipment for tasks', 'equipment'),
  ('equipment:checkout', 'Check out equipment', 'equipment'),
  ('equipment:checkin', 'Check in equipment', 'equipment'),
  ('equipment:report', 'Report equipment issues', 'equipment'),
  
  -- Time tracking capabilities
  ('time:track', 'Track work time and hours', 'time'),
  ('time:view', 'View time logs and history', 'time'),
  ('time:submit', 'Submit time entries for approval', 'time'),
  
  -- Communication capabilities
  ('messages:view', 'View messages from supervisors', 'messages'),
  ('messages:send', 'Send messages to supervisors', 'messages'),
  
  -- Training capabilities
  ('training:view', 'View training materials', 'training'),
  ('training:complete', 'Complete training modules', 'training'),
  
  -- Safety capabilities
  ('safety:report', 'Report safety incidents', 'safety'),
  ('safety:view', 'View safety protocols', 'safety')
ON CONFLICT (code) DO NOTHING;

-- Assign all Crew capabilities to crew role
INSERT INTO role_permissions (role_code, perm_code) VALUES
  -- Core frontend test permissions
  ('crew', 'dashboard:view'),
  ('crew', 'profile:view'),
  ('crew', 'services:view'),
  ('crew', 'ecosystem:view'),
  ('crew', 'orders:view'),
  ('crew', 'reports:view'),
  ('crew', 'support:access'),
  ('crew', 'tasks:manage'),
  ('crew', 'schedule:view'),
  ('crew', 'equipment:use'),
  
  -- Extended profile capabilities
  ('crew', 'profile:edit'),
  
  -- Extended services capabilities
  ('crew', 'services:manage'),
  
  -- Extended orders capabilities
  ('crew', 'orders:start'),
  ('crew', 'orders:complete'),
  ('crew', 'orders:update'),
  
  -- Extended reports capabilities
  ('crew', 'reports:submit'),
  ('crew', 'reports:generate'),
  
  -- Extended support capabilities
  ('crew', 'support:ticket'),
  ('crew', 'support:kb'),
  
  -- Extended task capabilities
  ('crew', 'tasks:view'),
  ('crew', 'tasks:start'),
  ('crew', 'tasks:update'),
  ('crew', 'tasks:complete'),
  ('crew', 'tasks:notes'),
  
  -- Extended schedule capabilities
  ('crew', 'schedule:checkin'),
  ('crew', 'schedule:checkout'),
  
  -- Extended equipment capabilities
  ('crew', 'equipment:view'),
  ('crew', 'equipment:checkout'),
  ('crew', 'equipment:checkin'),
  ('crew', 'equipment:report'),
  
  -- Time tracking
  ('crew', 'time:track'),
  ('crew', 'time:view'),
  ('crew', 'time:submit'),
  
  -- Communication
  ('crew', 'messages:view'),
  ('crew', 'messages:send'),
  
  -- Training
  ('crew', 'training:view'),
  ('crew', 'training:complete'),
  
  -- Safety
  ('crew', 'safety:report'),
  ('crew', 'safety:view')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

-- Log seeding completion
DO $$
BEGIN
  RAISE NOTICE 'Crew capabilities seeded successfully. Total permissions: %', 
    (SELECT COUNT(*) FROM role_permissions WHERE role_code = 'crew');
END $$;