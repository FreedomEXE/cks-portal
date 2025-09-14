/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_seed_warehouse_caps.sql
 * 
 * Description: Inserts capability codes and assigns to warehouse role.
 * Function: Seed Warehouse role with required capabilities for tabs/actions.
 * Importance: Enables capability-gated UI and route access for Warehouse.
 * Connects to: Auth (computes caps[]), requireCaps middleware, UI requires[].
 * 
 * Notes: Complete Warehouse capability seeding based on warehouse-specific features.
 */

-- Insert Warehouse-specific capabilities
INSERT INTO permissions (code, description, category) VALUES
  -- Dashboard capabilities
  ('dashboard:view', 'View warehouse dashboard and metrics', 'dashboard'),
  
  -- Profile capabilities  
  ('profile:view', 'View warehouse profile and facility info', 'profile'),
  ('profile:edit', 'Edit warehouse profile and settings', 'profile'),
  
  -- Services capabilities
  ('services:manage', 'Manage warehouse services and operations', 'services'),
  ('services:view', 'View warehouse service requests', 'services'),
  ('services:create', 'Create service requests', 'services'),
  ('services:edit', 'Edit service configurations', 'services'),
  
  -- Inventory capabilities
  ('inventory:manage', 'Manage inventory items and stock levels', 'inventory'),
  ('inventory:view', 'View inventory items and stock levels', 'inventory'),
  ('inventory:create', 'Add new inventory items', 'inventory'),
  ('inventory:edit', 'Edit inventory item details', 'inventory'),
  ('inventory:adjust', 'Adjust inventory quantities', 'inventory'),
  ('inventory:count', 'Perform inventory counts', 'inventory'),
  ('inventory:transfer', 'Transfer inventory between locations', 'inventory'),
  
  -- Orders capabilities
  ('orders:process', 'Process warehouse orders', 'orders'),
  ('orders:view', 'View order details and status', 'orders'),
  ('orders:create', 'Create new orders', 'orders'),
  ('orders:edit', 'Edit order information', 'orders'),
  ('orders:track', 'Track order progress', 'orders'),
  ('orders:complete', 'Complete order processing', 'orders'),
  
  -- Delivery capabilities
  ('delivery:track', 'Track delivery progress and status', 'delivery'),
  ('delivery:schedule', 'Schedule deliveries', 'delivery'),
  ('delivery:manage', 'Manage delivery operations', 'delivery'),
  ('delivery:confirm', 'Confirm delivery completion', 'delivery'),
  
  -- Support capabilities
  ('support:access', 'Access warehouse support center', 'support'),
  ('support:ticket', 'Create support tickets', 'support'),
  ('support:kb', 'Access knowledge base', 'support'),
  
  -- Reports capabilities
  ('reports:generate', 'Generate inventory and activity reports', 'reports'),
  ('reports:view', 'View warehouse reports', 'reports'),
  ('reports:export', 'Export warehouse data', 'reports'),
  
  -- Stock capabilities (warehouse-specific)
  ('stock:receive', 'Receive stock and update quantities', 'stock'),
  ('stock:ship', 'Ship stock and update quantities', 'stock'),
  ('stock:track', 'Track stock movements and history', 'stock'),
  ('stock:reserve', 'Reserve stock for orders', 'stock'),
  
  -- Cycle Count capabilities
  ('cycle_counts:view', 'View cycle count schedules', 'cycle_counts'),
  ('cycle_counts:create', 'Create cycle count tasks', 'cycle_counts'),
  ('cycle_counts:perform', 'Perform cycle counts', 'cycle_counts'),
  ('cycle_counts:approve', 'Approve cycle count results', 'cycle_counts'),
  
  -- Location capabilities
  ('locations:view', 'View storage locations', 'locations'),
  ('locations:manage', 'Manage storage locations and layout', 'locations'),
  
  -- Suppliers capabilities
  ('suppliers:view', 'View supplier information', 'suppliers'),
  ('suppliers:manage', 'Manage supplier relationships', 'suppliers'),
  
  -- Quality capabilities
  ('quality:inspect', 'Perform quality inspections', 'quality'),
  ('quality:report', 'Report quality issues', 'quality'),
  
  -- Safety capabilities
  ('safety:access', 'Access safety protocols', 'safety'),
  ('safety:report', 'Report safety incidents', 'safety')
ON CONFLICT (code) DO NOTHING;

-- Assign all Warehouse capabilities to warehouse role
INSERT INTO role_permissions (role_code, perm_code) VALUES
  -- Core frontend test permissions
  ('warehouse', 'dashboard:view'),
  ('warehouse', 'profile:view'),
  ('warehouse', 'services:manage'),
  ('warehouse', 'inventory:manage'),
  ('warehouse', 'orders:process'),
  ('warehouse', 'delivery:track'),
  ('warehouse', 'support:access'),
  ('warehouse', 'reports:generate'),
  
  -- Extended profile capabilities
  ('warehouse', 'profile:edit'),
  
  -- Extended services capabilities
  ('warehouse', 'services:view'),
  ('warehouse', 'services:create'),
  ('warehouse', 'services:edit'),
  
  -- Extended inventory capabilities
  ('warehouse', 'inventory:view'),
  ('warehouse', 'inventory:create'),
  ('warehouse', 'inventory:edit'),
  ('warehouse', 'inventory:adjust'),
  ('warehouse', 'inventory:count'),
  ('warehouse', 'inventory:transfer'),
  
  -- Extended orders capabilities
  ('warehouse', 'orders:view'),
  ('warehouse', 'orders:create'),
  ('warehouse', 'orders:edit'),
  ('warehouse', 'orders:track'),
  ('warehouse', 'orders:complete'),
  
  -- Extended delivery capabilities
  ('warehouse', 'delivery:schedule'),
  ('warehouse', 'delivery:manage'),
  ('warehouse', 'delivery:confirm'),
  
  -- Extended support capabilities
  ('warehouse', 'support:ticket'),
  ('warehouse', 'support:kb'),
  
  -- Extended reports capabilities
  ('warehouse', 'reports:view'),
  ('warehouse', 'reports:export'),
  
  -- Stock management (warehouse-specific)
  ('warehouse', 'stock:receive'),
  ('warehouse', 'stock:ship'),
  ('warehouse', 'stock:track'),
  ('warehouse', 'stock:reserve'),
  
  -- Cycle Counts management
  ('warehouse', 'cycle_counts:view'),
  ('warehouse', 'cycle_counts:create'),
  ('warehouse', 'cycle_counts:perform'),
  ('warehouse', 'cycle_counts:approve'),
  
  -- Locations management
  ('warehouse', 'locations:view'),
  ('warehouse', 'locations:manage'),
  
  -- Suppliers management
  ('warehouse', 'suppliers:view'),
  ('warehouse', 'suppliers:manage'),
  
  -- Quality control
  ('warehouse', 'quality:inspect'),
  ('warehouse', 'quality:report'),
  
  -- Safety protocols
  ('warehouse', 'safety:access'),
  ('warehouse', 'safety:report')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(perm_code);

-- Log seeding completion
DO $$
BEGIN
  RAISE NOTICE 'Warehouse capabilities seeded successfully. Total permissions: %', 
    (SELECT COUNT(*) FROM role_permissions WHERE role_code = 'warehouse');
END $$;