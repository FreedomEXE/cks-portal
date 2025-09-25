-- Sample inventory data for warehouse testing
-- This adds sample products to the products table for warehouses

-- Delete existing sample data if any
DELETE FROM products WHERE product_id LIKE 'PRD-SAMPLE-%';

-- Insert sample active inventory items for warehouses
INSERT INTO products (
  product_id,
  name,
  description,
  sku,
  category,
  warehouse_id,
  stock_level,
  reorder_point,
  max_stock_level,
  unit_of_measure,
  unit_cost,
  selling_price,
  status,
  created_at
) VALUES
  ('PRD-SAMPLE-001', 'Industrial Cleaning Solution', 'Heavy-duty cleaning solution for industrial use', 'CLN-001', 'Materials', 'WH-00000001', 45, 20, 100, 'gallon', 25.99, 39.99, 'active', NOW()),
  ('PRD-SAMPLE-002', 'Floor Buffer Machine', 'Professional floor buffing equipment', 'EQP-001', 'Equipment', 'WH-00000001', 8, 5, 20, 'unit', 899.99, 1299.99, 'active', NOW()),
  ('PRD-SAMPLE-003', 'Microfiber Mop Heads', 'Replacement microfiber mop heads', 'MOP-001', 'Materials', 'WH-00000001', 150, 50, 300, 'unit', 8.99, 14.99, 'active', NOW()),
  ('PRD-SAMPLE-004', 'Safety Gloves - Large', 'Heavy-duty safety gloves size large', 'SAF-001L', 'Products', 'WH-00000001', 200, 100, 500, 'pair', 3.99, 7.99, 'active', NOW()),
  ('PRD-SAMPLE-005', 'Vacuum HEPA Filter', 'Replacement HEPA filters for industrial vacuums', 'FLT-001', 'Products', 'WH-00000001', 35, 20, 100, 'unit', 19.99, 34.99, 'active', NOW()),
  ('PRD-SAMPLE-006', 'Window Cleaning Kit', 'Professional window cleaning kit', 'WIN-001', 'Equipment', 'WH-00000001', 12, 10, 30, 'kit', 45.99, 79.99, 'active', NOW()),
  ('PRD-SAMPLE-007', 'Disinfectant Spray', 'Hospital-grade disinfectant spray', 'DIS-001', 'Materials', 'WH-00000001', 18, 25, 100, 'case', 89.99, 129.99, 'active', NOW()),
  ('PRD-SAMPLE-008', 'Trash Bags - Heavy Duty', 'Heavy duty trash bags 55 gallon', 'TRB-001', 'Products', 'WH-00000001', 500, 200, 1000, 'roll', 12.99, 19.99, 'active', NOW()),
  ('PRD-SAMPLE-009', 'Carpet Shampoo', 'Professional carpet cleaning shampoo', 'CRP-001', 'Materials', 'WH-00000001', 5, 10, 50, 'gallon', 29.99, 49.99, 'active', NOW()),
  ('PRD-SAMPLE-010', 'Pressure Washer', 'Industrial pressure washing equipment', 'PWR-001', 'Equipment', 'WH-00000001', 3, 2, 10, 'unit', 1299.99, 1899.99, 'active', NOW());

-- Insert sample archived inventory items for warehouses
INSERT INTO products (
  product_id,
  name,
  description,
  category,
  warehouse_id,
  stock_level,
  reorder_point,
  status,
  archived_at,
  archived_by,
  archive_reason,
  created_at
) VALUES
  ('PRD-SAMPLE-011', 'Old Floor Wax', 'Discontinued floor wax product', 'Materials', 'WH-00000001', 0, 0, 'archived', NOW() - INTERVAL '30 days', 'SYSTEM', 'Product discontinued by manufacturer', NOW() - INTERVAL '180 days'),
  ('PRD-SAMPLE-012', 'Legacy Vacuum Model', 'Old vacuum cleaner model', 'Equipment', 'WH-00000001', 0, 0, 'archived', NOW() - INTERVAL '60 days', 'SYSTEM', 'Replaced with newer model', NOW() - INTERVAL '365 days'),
  ('PRD-SAMPLE-013', 'Expired Cleaning Wipes', 'Cleaning wipes past expiration', 'Products', 'WH-00000001', 0, 0, 'archived', NOW() - INTERVAL '7 days', 'SYSTEM', 'Product expired', NOW() - INTERVAL '90 days');

-- Also add sample products for other warehouses if they exist
INSERT INTO products (
  product_id,
  name,
  category,
  warehouse_id,
  stock_level,
  reorder_point,
  max_stock_level,
  status,
  created_at
)
SELECT
  'PRD-SAMPLE-W2-' || LPAD(row_number()::text, 3, '0'),
  'Sample Product ' || row_number(),
  CASE
    WHEN row_number() % 3 = 0 THEN 'Equipment'
    WHEN row_number() % 3 = 1 THEN 'Products'
    ELSE 'Materials'
  END,
  warehouse_id,
  (random() * 100)::int,
  (random() * 20 + 10)::int,
  (random() * 200 + 50)::int,
  'active',
  NOW()
FROM warehouses
WHERE warehouse_id != 'WH-00000001'
LIMIT 5;