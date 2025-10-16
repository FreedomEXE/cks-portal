-- ============================================================================
-- SQL Smart Backfill Script: "Who Did What" Display Format Fix
-- ============================================================================
-- Purpose: Update old cancelled/rejected orders to store "CODE - Name" format
-- Strategy: When only role is stored, infer the code from creator_id since
--           users can typically only cancel/reject their own orders
-- ============================================================================

-- ============================================================================
-- PART 1: Smart Backfill for Cancelled Orders
-- ============================================================================

-- Step 1: View cancelled orders that need backfill
SELECT
    order_id,
    status,
    creator_id,
    creator_role,
    metadata->>'cancelledBy' as cancelled_by_old,
    metadata->>'cancelledByDisplay' as cancelled_by_display,
    CASE
        WHEN metadata->>'cancelledBy' = 'crew' AND creator_role = 'crew' THEN creator_id
        WHEN metadata->>'cancelledBy' = 'center' AND creator_role = 'center' THEN creator_id
        WHEN metadata->>'cancelledBy' = 'customer' AND creator_role = 'customer' THEN creator_id
        WHEN metadata->>'cancelledBy' = 'manager' AND creator_role = 'manager' THEN creator_id
        ELSE NULL
    END as inferred_code
FROM orders
WHERE status = 'cancelled'
  AND metadata->>'cancelledBy' IS NOT NULL
  AND metadata->>'cancelledByDisplay' IS NULL
ORDER BY created_at DESC;

-- Step 2: Backfill CREW cancellations (using creator_id when cancelledBy = 'crew')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(creator_id)
        ),
        '{cancelledByName}',
        to_jsonb(crew.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb(creator_id || ' - ' || crew.name)
)
FROM crew
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = 'crew'
  AND orders.creator_role = 'crew'
  AND orders.creator_id = crew.crew_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 3: Backfill CENTER cancellations (using creator_id when cancelledBy = 'center')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(creator_id)
        ),
        '{cancelledByName}',
        to_jsonb(centers.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb(creator_id || ' - ' || centers.name)
)
FROM centers
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = 'center'
  AND orders.creator_role = 'center'
  AND orders.creator_id = centers.center_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 4: Backfill CUSTOMER cancellations (using creator_id when cancelledBy = 'customer')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(creator_id)
        ),
        '{cancelledByName}',
        to_jsonb(customers.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb(creator_id || ' - ' || customers.name)
)
FROM customers
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = 'customer'
  AND orders.creator_role = 'customer'
  AND orders.creator_id = customers.customer_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 5: Backfill MANAGER cancellations (using creator_id when cancelledBy = 'manager')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{cancelledByCode}',
            to_jsonb(creator_id)
        ),
        '{cancelledByName}',
        to_jsonb(managers.name)
    ),
    '{cancelledByDisplay}',
    to_jsonb(creator_id || ' - ' || managers.name)
)
FROM managers
WHERE orders.status = 'cancelled'
  AND orders.metadata->>'cancelledBy' = 'manager'
  AND orders.creator_role = 'manager'
  AND orders.creator_id = managers.manager_id
  AND orders.metadata->>'cancelledByDisplay' IS NULL;

-- Step 6: Handle cancelled orders where role/creator don't match (keep as role only)
-- This is for edge cases where someone other than creator cancelled
UPDATE orders
SET metadata = jsonb_set(
    metadata,
    '{cancelledByDisplay}',
    to_jsonb(metadata->>'cancelledBy')
)
WHERE status = 'cancelled'
  AND metadata->>'cancelledBy' IS NOT NULL
  AND metadata->>'cancelledByDisplay' IS NULL
  AND (
    (metadata->>'cancelledBy' = 'crew' AND creator_role != 'crew') OR
    (metadata->>'cancelledBy' = 'center' AND creator_role != 'center') OR
    (metadata->>'cancelledBy' = 'customer' AND creator_role != 'customer') OR
    (metadata->>'cancelledBy' = 'manager' AND creator_role != 'manager') OR
    metadata->>'cancelledBy' NOT IN ('crew', 'center', 'customer', 'manager')
  );

-- ============================================================================
-- PART 2: Smart Backfill for Rejected Orders
-- ============================================================================

-- Step 7: View rejected orders that need backfill
SELECT
    order_id,
    status,
    creator_id,
    creator_role,
    metadata->>'rejectedBy' as rejected_by_old,
    metadata->>'rejectedByDisplay' as rejected_by_display,
    CASE
        WHEN metadata->>'rejectedBy' = 'crew' AND creator_role = 'crew' THEN creator_id
        WHEN metadata->>'rejectedBy' = 'center' AND creator_role = 'center' THEN creator_id
        WHEN metadata->>'rejectedBy' = 'customer' AND creator_role = 'customer' THEN creator_id
        WHEN metadata->>'rejectedBy' = 'manager' AND creator_role = 'manager' THEN creator_id
        WHEN metadata->>'rejectedBy' = 'warehouse' THEN 'WAR-001'
        ELSE NULL
    END as inferred_code
FROM orders
WHERE status = 'rejected'
  AND metadata->>'rejectedBy' IS NOT NULL
  AND metadata->>'rejectedByDisplay' IS NULL
ORDER BY created_at DESC;

-- Step 8: Backfill CREW rejections (using creator_id when rejectedBy = 'crew')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(creator_id)
        ),
        '{rejectedByName}',
        to_jsonb(crew.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb(creator_id || ' - ' || crew.name)
)
FROM crew
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = 'crew'
  AND orders.creator_role = 'crew'
  AND orders.creator_id = crew.crew_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 9: Backfill CENTER rejections (using creator_id when rejectedBy = 'center')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(creator_id)
        ),
        '{rejectedByName}',
        to_jsonb(centers.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb(creator_id || ' - ' || centers.name)
)
FROM centers
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = 'center'
  AND orders.creator_role = 'center'
  AND orders.creator_id = centers.center_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 10: Backfill CUSTOMER rejections (using creator_id when rejectedBy = 'customer')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(creator_id)
        ),
        '{rejectedByName}',
        to_jsonb(customers.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb(creator_id || ' - ' || customers.name)
)
FROM customers
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = 'customer'
  AND orders.creator_role = 'customer'
  AND orders.creator_id = customers.customer_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 11: Backfill MANAGER rejections (using creator_id when rejectedBy = 'manager')
UPDATE orders
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            metadata,
            '{rejectedByCode}',
            to_jsonb(creator_id)
        ),
        '{rejectedByName}',
        to_jsonb(managers.name)
    ),
    '{rejectedByDisplay}',
    to_jsonb(creator_id || ' - ' || managers.name)
)
FROM managers
WHERE orders.status = 'rejected'
  AND orders.metadata->>'rejectedBy' = 'manager'
  AND orders.creator_role = 'manager'
  AND orders.creator_id = managers.manager_id
  AND orders.metadata->>'rejectedByDisplay' IS NULL;

-- Step 12: Handle rejected orders where role/creator don't match (keep as role only)
UPDATE orders
SET metadata = jsonb_set(
    metadata,
    '{rejectedByDisplay}',
    to_jsonb(metadata->>'rejectedBy')
)
WHERE status = 'rejected'
  AND metadata->>'rejectedBy' IS NOT NULL
  AND metadata->>'rejectedByDisplay' IS NULL;

-- ============================================================================
-- VERIFICATION: Check results after backfill
-- ============================================================================

-- Verify cancelled orders
SELECT
    order_id,
    status,
    creator_id,
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
    creator_id,
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
-- 1. This "smart" backfill infers the code from creator_id when:
--    - cancelledBy/rejectedBy matches creator_role
--    - This works because users typically cancel/reject their own orders
-- 2. For edge cases where role/creator don't match, we keep the role name
-- 3. Run Step 1 and Step 7 first to see the inference logic
-- 4. Run the UPDATE queries (Steps 2-6 and 8-12) to perform the backfill
-- 5. Run the VERIFICATION queries at the end to confirm all orders are fixed
-- 6. All future cancelled/rejected orders will automatically have correct format
-- ============================================================================
