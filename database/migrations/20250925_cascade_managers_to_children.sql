-- Cascade cks_manager from contractors to all their children
-- This migration ensures all entities inherit the correct manager from their parent in the hierarchy

-- 1. Update customers to inherit manager from their contractor
UPDATE customers c
SET cks_manager = con.cks_manager,
    updated_at = NOW()
FROM contractors con
WHERE c.contractor_id = con.contractor_id
  AND con.cks_manager IS NOT NULL
  AND (c.cks_manager IS NULL OR c.cks_manager != con.cks_manager);

-- 2. Update centers to inherit manager from their contractor
UPDATE centers cen
SET cks_manager = con.cks_manager,
    updated_at = NOW()
FROM contractors con
WHERE cen.contractor_id = con.contractor_id
  AND con.cks_manager IS NOT NULL
  AND (cen.cks_manager IS NULL OR cen.cks_manager != con.cks_manager);

-- 3. Update centers that don't have contractor_id but have customer_id
-- to inherit manager from their customer's contractor
UPDATE centers cen
SET cks_manager = con.cks_manager,
    contractor_id = cus.contractor_id,
    updated_at = NOW()
FROM customers cus
JOIN contractors con ON cus.contractor_id = con.contractor_id
WHERE cen.customer_id = cus.customer_id
  AND con.cks_manager IS NOT NULL
  AND (cen.cks_manager IS NULL OR cen.cks_manager != con.cks_manager);

-- 4. Update crew to inherit manager from their assigned center
UPDATE crew cr
SET cks_manager = cen.cks_manager,
    updated_at = NOW()
FROM centers cen
WHERE cr.assigned_center = cen.center_id
  AND cen.cks_manager IS NOT NULL
  AND (cr.cks_manager IS NULL OR cr.cks_manager != cen.cks_manager);

-- 5. Log the results
DO $$
DECLARE
  customers_updated INTEGER;
  centers_updated INTEGER;
  crew_updated INTEGER;
BEGIN
  GET DIAGNOSTICS customers_updated = ROW_COUNT;

  SELECT COUNT(*) INTO centers_updated
  FROM centers
  WHERE cks_manager IS NOT NULL;

  SELECT COUNT(*) INTO crew_updated
  FROM crew
  WHERE cks_manager IS NOT NULL;

  RAISE NOTICE 'Manager cascade complete: % customers, % centers, % crew members updated',
    customers_updated, centers_updated, crew_updated;
END $$;