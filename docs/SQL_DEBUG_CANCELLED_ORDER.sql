-- Debug query to see what data we have for this order
SELECT
    order_id,
    status,
    creator_id,
    creator_role,
    metadata
FROM orders
WHERE order_id = 'CRW-006-PO-107';

-- Check if there's an actorCode stored anywhere in metadata
SELECT
    order_id,
    metadata->>'cancelledBy' as cancelled_by,
    metadata->>'cancelledByCode' as cancelled_by_code,
    metadata->>'actorCode' as actor_code,
    metadata
FROM orders
WHERE order_id = 'CRW-006-PO-107';

-- See all cancelled orders and what's in their cancelledBy field
SELECT
    order_id,
    status,
    creator_id,
    metadata->>'cancelledBy' as cancelled_by,
    metadata->>'cancelledByDisplay' as cancelled_by_display,
    CASE
        WHEN metadata->>'cancelledBy' LIKE 'CRW-%' THEN 'CODE'
        WHEN metadata->>'cancelledBy' LIKE 'CEN-%' THEN 'CODE'
        WHEN metadata->>'cancelledBy' LIKE 'CUS-%' THEN 'CODE'
        WHEN metadata->>'cancelledBy' LIKE 'MGR-%' THEN 'CODE'
        ELSE 'ROLE_ONLY'
    END as data_type
FROM orders
WHERE status = 'cancelled'
ORDER BY created_at DESC;
