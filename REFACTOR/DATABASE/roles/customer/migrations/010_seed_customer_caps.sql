/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_customer_caps.sql
 * 
 * Description: Inserts capability codes and assigns to customer role.
 * Function: Seed Customer role with required capabilities for tabs/actions.
 * Importance: Enables capability-gated UI and route access for Customer.
 * Connects to: Auth (computes caps[]), requireCaps middleware, UI requires[].
 * 
 * Notes: Complete Customer capability seeding based on customer-specific features.
 */

-- Insert Customer-specific capabilities
INSERT INTO permissions (code, description, category) VALUES
  -- Dashboard capabilities
  ('dashboard:view', 'View customer dashboard and service overview', 'dashboard'),
  
  -- Profile capabilities  
  ('profile:view', 'View own company profile', 'profile'),
  ('profile:edit', 'Edit company profile information', 'profile'),
  
  -- Services capabilities
  ('services:request', 'Request new services', 'services'),
  ('services:view', 'View available services', 'services'),
  ('services:manage', 'Manage service requests', 'services'),
  
  -- Ecosystem capabilities
  ('ecosystem:view', 'View ecosystem connections and partners', 'ecosystem'),
  
  -- Orders capabilities
  ('orders:view', 'View order history and current orders', 'orders'),
  ('orders:modify', 'Modify order details and scheduling', 'orders'),
  ('orders:create', 'Create new orders', 'orders'),
  ('orders:edit', 'Edit order information', 'orders'),
  ('orders:cancel', 'Cancel orders', 'orders'),
  ('orders:track', 'Track order progress and status', 'orders'),
  
  -- Reports capabilities
  ('reports:submit', 'Submit service feedback and quality reports', 'reports'),
  ('reports:view', 'View service reports and analytics', 'reports'),
  ('reports:export', 'Export service data and reports', 'reports'),
  
  -- Support capabilities
  ('support:access', 'Access customer support center', 'support'),
  ('support:ticket', 'Create and manage support tickets', 'support'),
  ('support:kb', 'Access knowledge base and help articles', 'support'),
  ('support:chat', 'Access live chat support', 'support'),
  
  -- Service Request capabilities
  ('requests:view', 'View service requests', 'requests'),
  ('requests:create', 'Create new service requests', 'requests'),
  ('requests:edit', 'Edit pending service requests', 'requests'),
  ('requests:cancel', 'Cancel service requests', 'requests'),
  ('requests:track', 'Track request status and progress', 'requests'),
  
  -- Billing capabilities
  ('billing:view', 'View invoices and billing history', 'billing'),
  ('billing:download', 'Download invoices and receipts', 'billing'),
  ('billing:payment', 'Make payments and view payment history', 'billing'),
  ('billing:disputes', 'Dispute billing charges', 'billing'),
  
  -- Feedback capabilities
  ('feedback:view', 'View submitted feedback', 'feedback'),
  ('feedback:submit', 'Submit service feedback and ratings', 'feedback'),
  ('feedback:manage', 'Manage feedback history', 'feedback'),
  
  -- Communication capabilities
  ('messages:view', 'View messages from CKS team', 'messages'),
  ('messages:send', 'Send messages to service team', 'messages'),
  ('notifications:manage', 'Manage notification preferences', 'notifications'),
  
  -- Locations capabilities
  ('locations:view', 'View service locations', 'locations'),
  ('locations:manage', 'Add and edit service locations', 'locations'),
  ('locations:schedule', 'Set location-specific service preferences', 'locations'),
  
  -- Preferences capabilities
  ('preferences:view', 'View account preferences', 'preferences'),
  ('preferences:edit', 'Edit service and communication preferences', 'preferences'),
  ('preferences:contractors', 'Set contractor preferences', 'preferences'),
  
  -- Emergency capabilities
  ('emergency:request', 'Request emergency services', 'emergency'),
  ('emergency:contact', 'Access emergency contact information', 'emergency')
ON CONFLICT (code) DO NOTHING;

-- Assign all Customer capabilities to customer role
INSERT INTO role_permissions (role_code, perm_code) VALUES
  -- Core frontend test permissions
  ('customer', 'dashboard:view'),
  ('customer', 'profile:view'),
  ('customer', 'services:request'),
  ('customer', 'ecosystem:view'),
  ('customer', 'orders:view'),
  ('customer', 'orders:modify'),
  ('customer', 'reports:submit'),
  ('customer', 'reports:view'),
  ('customer', 'support:access'),
  
  -- Extended profile capabilities
  ('customer', 'profile:edit'),
  
  -- Extended services capabilities
  ('customer', 'services:view'),
  ('customer', 'services:manage'),
  
  -- Extended orders capabilities
  ('customer', 'orders:create'),
  ('customer', 'orders:edit'),
  ('customer', 'orders:cancel'),
  ('customer', 'orders:track'),
  
  -- Extended reports capabilities
  ('customer', 'reports:export'),
  
  -- Extended support capabilities
  ('customer', 'support:ticket'),
  ('customer', 'support:kb'),
  ('customer', 'support:chat'),
  
  -- Service Requests (customer-specific)
  ('customer', 'requests:view'),
  ('customer', 'requests:create'),
  ('customer', 'requests:edit'),
  ('customer', 'requests:cancel'),
  ('customer', 'requests:track'),
  
  -- Billing (customer-specific)
  ('customer', 'billing:view'),
  ('customer', 'billing:download'),
  ('customer', 'billing:payment'),
  ('customer', 'billing:disputes'),
  
  -- Feedback management
  ('customer', 'feedback:view'),
  ('customer', 'feedback:submit'),
  ('customer', 'feedback:manage'),
  
  -- Communication
  ('customer', 'messages:view'),
  ('customer', 'messages:send'),
  ('customer', 'notifications:manage'),
  
  -- Locations management
  ('customer', 'locations:view'),
  ('customer', 'locations:manage'),
  ('customer', 'locations:schedule'),
  
  -- Preferences management
  ('customer', 'preferences:view'),
  ('customer', 'preferences:edit'),
  ('customer', 'preferences:contractors'),
  
  -- Emergency services
  ('customer', 'emergency:request'),
  ('customer', 'emergency:contact')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

-- Log seeding completion
DO $$
BEGIN
  RAISE NOTICE 'Customer capabilities seeded successfully. Total permissions: %', 
    (SELECT COUNT(*) FROM role_permissions WHERE role_code = 'customer');
END $$;