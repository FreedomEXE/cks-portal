-- ============================================================================
-- SQL Backfill Script: "Who Did What" Display Format Fix
-- ============================================================================
-- Purpose: Update old cancelled/rejected orders to store "CODE - Name" format
-- in metadata.cancelledByDisplay and metadata.rejectedByDisplay
--
-- Run these queries in Beekeeper Studio one by one
-- ============================================================================

-- ============================================================================
-- PART 1: Backfill Cancelled Orders (cancelledByDisplay)
-- ============================================================================

-- Step 1: View cancelled orders that need backfill
-- (Orders with cancelledBy but no cancelledByDisplay)
SELECT
    order_id,
    status,
    metadata->>'cancelledBy' as cancelled_by_old,
    metadata->>'cancelledByDisplay' as cancelled_by_display
FROM orders
WHERE status = 'cancelled'
  AND metadata->>'cancelledBy' IS NOT NULL
  AND metadata->>'cancelledByDisplay' IS NULL
ORDER BY created_at DESC;

-- Step 2: Backfill for CREW cancellations
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(metadata->>'cancelledBy')
        ),
        '{cancelledByName}',
        to_jsonb(crew.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb((metadata->>'cancelledBy') || ' - ' || crew.name)
)
FROM crew
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = crew.crew_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 3: Backfill for CENTER cancellations
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(metadata->>'cancelledBy')
        ),
        '{cancelledByName}',
        to_jsonb(centers.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb((metadata->>'cancelledBy') || ' - ' || centers.name)
)
FROM centers
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = centers.center_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 4: Backfill for CUSTOMER cancellations
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(metadata->>'cancelledBy')
        ),
        '{cancelledByName}',
        to_jsonb(customers.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb((metadata->>'cancelledBy') || ' - ' || customers.name)
)
FROM customers
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = customers.customer_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 5: Backfill for MANAGER cancellations
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(metadata->>'cancelledBy')
        ),
        '{cancelledByName}',
        to_jsonb(managers.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb((metadata->>'cancelledBy') || ' - ' || managers.name)
)
FROM managers
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = managers.manager_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 6: Handle cancelled orders where cancelledBy is a role (fallback)
-- These will stay as role names since we don't have a code to look up
UPDATE orders
SET metadata = jsonb_set(
    metadata,
    '{cancelledByDisplay}',
    to_jsonb(metadata->>'cancelledBy')
)
WHERE status = 'cancelled'
  AND metadata->>'cancelledBy' IS NOT NULL
  AND metadata->>'cancelledByDisplay' IS NULL
  -- Only update if cancelledBy doesn't match any code pattern
  AND metadata->>'cancelledBy' NOT LIKE 'CRW-%'
  AND metadata->>'cancelledBy' NOT LIKE 'CEN-%'
  AND metadata->>'cancelledBy' NOT LIKE 'CUS-%'
  AND metadata->>'cancelledBy' NOT LIKE 'MGR-%';

-- ============================================================================
-- PART 2: Backfill Rejected Orders (rejectedByDisplay)
-- ============================================================================

-- Step 7: View rejected orders that need backfill
SELECT
    order_id,
    status,
    metadata->>'rejectedBy' as rejected_by_old,
    metadata->>'rejectedByDisplay' as rejected_by_display
FROM orders
WHERE status = 'rejected'
  AND metadata->>'rejectedBy' IS NOT NULL
  AND metadata->>'rejectedByDisplay' IS NULL
ORDER BY created_at DESC;

-- Step 8: Backfill for CREW rejections
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(metadata->>'rejectedBy')
        ),
        '{rejectedByName}',
        to_jsonb(crew.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb((metadata->>'rejectedBy') || ' - ' || crew.name)
)
FROM crew
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = crew.crew_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 9: Backfill for CENTER rejections
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(metadata->>'rejectedBy')
        ),
        '{rejectedByName}',
        to_jsonb(centers.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb((metadata->>'rejectedBy') || ' - ' || centers.name)
)
FROM centers
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = centers.center_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 10: Backfill for CUSTOMER rejections
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(metadata->>'rejectedBy')
        ),
        '{rejectedByName}',
        to_jsonb(customers.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb((metadata->>'rejectedBy') || ' - ' || customers.name)
)
FROM customers
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = customers.customer_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 11: Backfill for MANAGER rejections
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(metadata->>'rejectedBy')
        ),
        '{rejectedByName}',
        to_jsonb(managers.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb((metadata->>'rejectedBy') || ' - ' || managers.name)
)
FROM managers
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = managers.manager_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 12: Handle rejected orders where rejectedBy is a role (fallback)
UPDATE orders
SET metadata = jsonb_set(
    metadata,
    '{rejectedByDisplay}',
    to_jsonb(metadata->>'rejectedBy')
)
WHERE status = 'rejected'
  AND metadata->>'rejectedBy' IS NOT NULL
  AND metadata->>'rejectedByDisplay' IS NULL
  AND metadata->>'rejectedBy' NOT LIKE 'CRW-%'
  AND metadata->>'rejectedBy' NOT LIKE 'CEN-%'
  AND metadata->>'rejectedBy' NOT LIKE 'CUS-%'
  AND metadata->>'rejectedBy' NOT LIKE 'MGR-%';

-- ============================================================================
-- VERIFICATION: Check results after backfill
-- ============================================================================

-- Verify cancelled orders
SELECT
    order_id,
    status,
    metadata->>'cancelledBy' as cancelled_by,
    metadata->>'cancelledByCode' as cancelled_by_code,
    metadata->>'cancelledByName' as cancelled_by_name,
    metadata->>'cancelledByDisplay' as cancelled_by_display
FROM orders
WHERE status = 'cancelled'
  AND metadata->>'cancelledBy' IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Verify rejected orders
SELECT
    order_id,
    status,
    metadata->>'rejectedBy' as rejected_by,
    metadata->>'rejectedByCode' as rejected_by_code,
    metadata->>'rejectedByName' as rejected_by_name,
    metadata->>'rejectedByDisplay' as rejected_by_display
FROM orders
WHERE status = 'rejected'
  AND metadata->>'rejectedBy' IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Count orders that still need fixing (should be 0 after backfill)
SELECT
    'cancelled' as order_type,
    COUNT(*) as needs_fixing
FROM orders
WHERE status = 'cancelled'
  AND metadata->>'cancelledBy' IS NOT NULL
  AND metadata->>'cancelledByDisplay' IS NULL
UNION ALL
SELECT
    'rejected' as order_type,
    COUNT(*) as needs_fixing
FROM orders
WHERE status = 'rejected'
  AND metadata->>'rejectedBy' IS NOT NULL
  AND metadata->>'rejectedByDisplay' IS NULL;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run Step 1 and Step 7 first to see how many orders need backfill
-- 2. Run the UPDATE queries (Steps 2-6 and 8-12) to perform the backfill
-- 3. Run the VERIFICATION queries at the end to confirm all orders are fixed
-- 4. The backfill is safe - it only updates orders that need fixing
-- 5. All future cancelled/rejected orders will automatically have correct format
-- ============================================================================
