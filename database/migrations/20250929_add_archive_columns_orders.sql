-- +migrate Up
-- Add archive/soft-delete columns to orders table and extend archived_entities view

-- Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON orders(archived_at) WHERE archived_at IS NOT NULL;

-- Ensure view includes all entity types, including orders
CREATE OR REPLACE VIEW archived_entities AS
SELECT
  'manager' as entity_type,
  manager_id as entity_id,
  name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM managers
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'contractor' as entity_type,
  contractor_id as entity_id,
  name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM contractors
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'customer' as entity_type,
  customer_id as entity_id,
  name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM customers
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'center' as entity_type,
  center_id as entity_id,
  name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM centers
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'crew' as entity_type,
  crew_id as entity_id,
  name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM crew
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'warehouse' as entity_type,
  warehouse_id as entity_id,
  name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM warehouses
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'service' as entity_type,
  service_id as entity_id,
  service_name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM services
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'product' as entity_type,
  product_id as entity_id,
  product_name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM products
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'order' as entity_type,
  order_id as entity_id,
  order_id as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM orders
WHERE archived_at IS NOT NULL;

-- +migrate Down
-- (No down migration provided; columns are additive and view replacement is idempotent)
