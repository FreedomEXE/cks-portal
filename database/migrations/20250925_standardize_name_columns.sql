-- Standardize all name columns to use 'name' instead of company_name, contractor_name, etc.
-- This creates consistency across all tables

-- 1. Rename contractors.company_name to name
ALTER TABLE contractors
  RENAME COLUMN company_name TO name;

-- 2. Rename customers.company_name to name
ALTER TABLE customers
  RENAME COLUMN company_name TO name;

-- 3. Centers already uses 'name' - no change needed

-- 4. Crew already uses 'name' - no change needed

-- 5. Check if warehouses needs update (might have warehouse_name)
-- First check what column exists
DO $$
BEGIN
  -- If warehouse_name exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouses'
    AND column_name = 'warehouse_name'
  ) THEN
    ALTER TABLE warehouses RENAME COLUMN warehouse_name TO name;
  END IF;
END $$;

-- 6. Check if managers table exists and needs update
DO $$
BEGIN
  -- If manager_name exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'managers'
    AND column_name = 'manager_name'
  ) THEN
    ALTER TABLE managers RENAME COLUMN manager_name TO name;
  END IF;
END $$;

-- 7. Add indexes on the new name columns for better performance
CREATE INDEX IF NOT EXISTS idx_contractors_name ON contractors(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_centers_name ON centers(name);
CREATE INDEX IF NOT EXISTS idx_crew_name ON crew(name);
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);

-- 8. Verify the changes
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('contractors', 'customers', 'centers', 'crew', 'warehouses', 'managers')
  AND (column_name = 'name'
    OR column_name LIKE '%_name'
    OR column_name LIKE 'company_%'
    OR column_name LIKE 'contractor_%'
    OR column_name LIKE 'customer_%'
    OR column_name LIKE 'warehouse_%'
    OR column_name LIKE 'manager_%')
ORDER BY table_name, column_name;