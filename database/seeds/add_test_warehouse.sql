-- Add test warehouse for development
INSERT INTO warehouses (warehouse_id, name, status, created_at, updated_at)
VALUES ('WHS-001', 'Central Distribution Warehouse', 'active', NOW(), NOW())
ON CONFLICT (warehouse_id) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Add some test products for the warehouse inventory
INSERT INTO products (product_id, warehouse_id, name, stock_level, reorder_point, created_at, updated_at)
VALUES
  ('PRD-001', 'WHS-001', 'Industrial Floor Scrubber', 3, 2, NOW(), NOW()),
  ('PRD-002', 'WHS-001', 'Commercial Vacuum Cleaner', 1, 2, NOW(), NOW()),
  ('PRD-003', 'WHS-001', 'Cleaning Solution (5 gal)', 48, 20, NOW(), NOW()),
  ('PRD-004', 'WHS-001', 'Microfiber Cloths (50 pack)', 15, 25, NOW(), NOW())
ON CONFLICT (product_id) DO UPDATE
SET
  warehouse_id = EXCLUDED.warehouse_id,
  name = EXCLUDED.name,
  stock_level = EXCLUDED.stock_level,
  reorder_point = EXCLUDED.reorder_point,
  updated_at = NOW();