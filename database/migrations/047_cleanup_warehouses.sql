-- Clean up warehouse data
-- 1. Update all orders from WAR-001 to WHS-004
UPDATE orders
SET assigned_warehouse = 'WHS-004'
WHERE assigned_warehouse = 'WAR-001';

-- 2. Delete the dummy warehouse
DELETE FROM warehouses
WHERE warehouse_id = 'WAR-001';