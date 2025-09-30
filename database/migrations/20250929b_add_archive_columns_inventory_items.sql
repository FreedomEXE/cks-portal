-- +migrate Up
-- Add archive columns to inventory_items and update archived_entities view to source products from inventory_items

-- inventory_items may not exist in all environments; guard with IF EXISTS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'inventory_items' AND table_schema = 'public'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
    ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
    ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS archive_reason TEXT;
    ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;
    ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP;
    ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);

    CREATE INDEX IF NOT EXISTS idx_inventory_items_archived_at ON inventory_items(archived_at) WHERE archived_at IS NOT NULL;
  END IF;
END $$;

-- Rebuild the archived_entities view to pull products from inventory_items
CREATE OR REPLACE VIEW archived_entities AS
SELECT 'manager'    AS entity_type, manager_id    AS entity_id, name          AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM managers    WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'contractor' AS entity_type, contractor_id AS entity_id, name          AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM contractors WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'customer'   AS entity_type, customer_id   AS entity_id, name          AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM customers   WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'center'     AS entity_type, center_id     AS entity_id, name          AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM centers     WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'crew'       AS entity_type, crew_id       AS entity_id, name          AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM crew        WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'warehouse'  AS entity_type, warehouse_id  AS entity_id, name          AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM warehouses  WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'service'    AS entity_type, service_id    AS entity_id, service_name  AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM services    WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'product'    AS entity_type, item_id       AS entity_id, item_name     AS name, archived_at, archived_by, archive_reason, deletion_scheduled FROM inventory_items WHERE archived_at IS NOT NULL;

-- +migrate Down
-- No down migration; additive changes
