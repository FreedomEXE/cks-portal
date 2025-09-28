-- Verify which entities have cks_manager fields and which don't

-- 1. Check contractors
SELECT
  'contractors' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'contractors'
  AND column_name IN ('contractor_id', 'cks_manager', 'status');

-- 2. Check customers
SELECT
  'customers' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('customer_id', 'cks_manager', 'status');

-- 3. Check centers
SELECT
  'centers' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'centers'
  AND column_name IN ('center_id', 'cks_manager', 'status');

-- 4. Check crew
SELECT
  'crew' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'crew'
  AND column_name IN ('crew_id', 'cks_manager', 'status', 'assigned_center');

-- 5. Check warehouses - they DON'T have cks_manager
SELECT
  'warehouses' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'warehouses'
  AND column_name IN ('warehouse_id', 'manager_id', 'cks_manager', 'status');

-- 6. Check managers - they ARE managers, don't get assigned to anyone
SELECT
  'managers' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'managers'
  AND column_name IN ('manager_id', 'status');