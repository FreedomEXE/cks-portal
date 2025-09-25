-- Drop warehouse_name column if it exists (we'll use name instead)
DO $$
BEGIN
  -- First copy ALL data from warehouse_name to name (overwrite nulls)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'warehouses' AND column_name = 'warehouse_name') THEN
    UPDATE warehouses
    SET name = warehouse_name
    WHERE warehouse_name IS NOT NULL;

    -- Now drop the warehouse_name column
    ALTER TABLE warehouses DROP COLUMN IF EXISTS warehouse_name;
  END IF;
END $$;

-- Update all warehouse statuses from 'operational' to 'active'
UPDATE warehouses
SET status = 'active',
    updated_at = NOW()
WHERE status = 'operational';

-- Verify the update
SELECT warehouse_id, name, status, updated_at
FROM warehouses
ORDER BY warehouse_id;