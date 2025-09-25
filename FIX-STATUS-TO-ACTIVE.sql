-- Change status from 'assigned' to 'active' for all entities with managers
-- This matches the manager behavior where status is 'active' not 'assigned'

-- 1. Update contractors status to 'active' when they have a manager
UPDATE contractors
SET status = 'active',
    updated_at = NOW()
WHERE cks_manager IS NOT NULL
  AND cks_manager != ''
  AND (status = 'assigned' OR status IS NULL OR status = 'unassigned');

-- 2. Update customers status to 'active' when they have a manager
UPDATE customers
SET status = 'active',
    updated_at = NOW()
WHERE cks_manager IS NOT NULL
  AND cks_manager != ''
  AND (status = 'assigned' OR status IS NULL OR status = 'unassigned');

-- 3. Update centers status to 'active' when they have a manager
UPDATE centers
SET status = 'active',
    updated_at = NOW()
WHERE cks_manager IS NOT NULL
  AND cks_manager != ''
  AND (status = 'assigned' OR status IS NULL OR status = 'unassigned');

-- 4. Update crew status to 'active' when they have a manager
UPDATE crew
SET status = 'active',
    updated_at = NOW()
WHERE cks_manager IS NOT NULL
  AND cks_manager != ''
  AND (status = 'assigned' OR status IS NULL OR status = 'unassigned');

-- 5. Warehouses should always be 'active' once created
-- Warehouses are standalone entities that never get assigned to anyone
UPDATE warehouses
SET status = 'active',
    updated_at = NOW()
WHERE status IS NULL OR status = 'unassigned' OR status = '';

-- 6. Verify the changes for CON-003 hierarchy
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

-- 7. Show counts of active entities with managers
SELECT 'Active Entities with Managers' as report;
SELECT
  'Contractors' as entity_type,
  COUNT(*) as count
FROM contractors
WHERE cks_manager IS NOT NULL AND status = 'active'
UNION ALL
SELECT 'Customers', COUNT(*)
FROM customers
WHERE cks_manager IS NOT NULL AND status = 'active'
UNION ALL
SELECT 'Centers', COUNT(*)
FROM centers
WHERE cks_manager IS NOT NULL AND status = 'active'
UNION ALL
SELECT 'Crew', COUNT(*)
FROM crew
WHERE cks_manager IS NOT NULL AND status = 'active'
UNION ALL
SELECT 'Warehouses', COUNT(*)
FROM warehouses
WHERE status = 'active';