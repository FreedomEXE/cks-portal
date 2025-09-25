-- IMPORTANT: Run this SQL in Beekeeper to standardize all name columns
-- This will rename all *_name columns to just 'name' for consistency

-- 1. Add missing columns first (if they don't exist)
ALTER TABLE crew
  ADD COLUMN IF NOT EXISTS assigned_center TEXT;

ALTER TABLE crew
  ADD COLUMN IF NOT EXISTS cks_manager TEXT;

-- 2. Rename company_name to name in contractors table
ALTER TABLE contractors
  RENAME COLUMN company_name TO name;

-- 3. Rename company_name to name in customers table
ALTER TABLE customers
  RENAME COLUMN company_name TO name;

-- 4. Check and rename warehouse_name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouses'
    AND column_name = 'warehouse_name'
  ) THEN
    ALTER TABLE warehouses RENAME COLUMN warehouse_name TO name;
  END IF;
END $$;

-- 5. Check and rename manager_name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'managers'
    AND column_name = 'manager_name'
  ) THEN
    ALTER TABLE managers RENAME COLUMN manager_name TO name;
  END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contractors_name ON contractors(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_centers_name ON centers(name);
CREATE INDEX IF NOT EXISTS idx_crew_name ON crew(name);
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);
CREATE INDEX IF NOT EXISTS idx_crew_assigned_center ON crew(assigned_center);
CREATE INDEX IF NOT EXISTS idx_crew_cks_manager ON crew(cks_manager);

-- 7. Now cascade managers from CON-003 to all its children
-- Get the manager from CON-003 and cascade to all children
WITH contractor_manager AS (
  SELECT cks_manager
  FROM contractors
  WHERE contractor_id = 'CON-003'
  AND cks_manager IS NOT NULL
)
UPDATE customers
SET cks_manager = (SELECT cks_manager FROM contractor_manager),
    updated_at = NOW()
WHERE contractor_id = 'CON-003'
  AND (cks_manager IS NULL OR cks_manager != (SELECT cks_manager FROM contractor_manager));

-- Update centers
WITH contractor_manager AS (
  SELECT cks_manager
  FROM contractors
  WHERE contractor_id = 'CON-003'
  AND cks_manager IS NOT NULL
)
UPDATE centers
SET cks_manager = (SELECT cks_manager FROM contractor_manager),
    updated_at = NOW()
WHERE (contractor_id = 'CON-003' OR customer_id IN (
    SELECT customer_id FROM customers WHERE contractor_id = 'CON-003'
  ))
  AND (cks_manager IS NULL OR cks_manager != (SELECT cks_manager FROM contractor_manager));

-- Update crew
WITH contractor_manager AS (
  SELECT cks_manager
  FROM contractors
  WHERE contractor_id = 'CON-003'
  AND cks_manager IS NOT NULL
)
UPDATE crew
SET cks_manager = (SELECT cks_manager FROM contractor_manager),
    updated_at = NOW()
WHERE assigned_center IN (
    SELECT center_id FROM centers
    WHERE contractor_id = 'CON-003' OR customer_id IN (
      SELECT customer_id FROM customers WHERE contractor_id = 'CON-003'
    )
  )
  AND (cks_manager IS NULL OR cks_manager != (SELECT cks_manager FROM contractor_manager));

-- 8. Verify the changes - check all entities in CON-003's hierarchy
SELECT
  'Contractor' as entity_type,
  contractor_id as entity_id,
  name,
  cks_manager,
  status
FROM contractors
WHERE contractor_id = 'CON-003'

UNION ALL

SELECT
  'Customer' as entity_type,
  customer_id as entity_id,
  name,
  cks_manager,
  status
FROM customers
WHERE contractor_id = 'CON-003'

UNION ALL

SELECT
  'Center' as entity_type,
  center_id as entity_id,
  name,
  cks_manager,
  status
FROM centers
WHERE contractor_id = 'CON-003' OR customer_id IN (
  SELECT customer_id FROM customers WHERE contractor_id = 'CON-003'
)

UNION ALL

SELECT
  'Crew' as entity_type,
  crew_id as entity_id,
  name,
  cks_manager,
  status
FROM crew
WHERE assigned_center IN (
  SELECT center_id FROM centers
  WHERE contractor_id = 'CON-003' OR customer_id IN (
    SELECT customer_id FROM customers WHERE contractor_id = 'CON-003'
  )
)
ORDER BY entity_type, entity_id;