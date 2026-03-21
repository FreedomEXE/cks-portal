-- Seed active access grants for live MVP accounts that are missing them.
-- This keeps existing production users from seeing the access-code banner
-- until subscriptions are actually launched.

WITH live_accounts AS (
  SELECT 'manager' AS role, manager_id AS cks_code
  FROM managers
  WHERE archived_at IS NULL AND manager_id NOT LIKE '%-TEST' AND manager_id NOT LIKE '%-900'

  UNION ALL

  SELECT 'contractor', contractor_id
  FROM contractors
  WHERE archived_at IS NULL AND contractor_id NOT LIKE '%-TEST' AND contractor_id NOT LIKE '%-900'

  UNION ALL

  SELECT 'customer', customer_id
  FROM customers
  WHERE archived_at IS NULL AND customer_id NOT LIKE '%-TEST' AND customer_id NOT LIKE '%-900'

  UNION ALL

  SELECT 'center', center_id
  FROM centers
  WHERE archived_at IS NULL AND center_id NOT LIKE '%-TEST' AND center_id NOT LIKE '%-900'

  UNION ALL

  SELECT 'crew', crew_id
  FROM crew
  WHERE archived_at IS NULL AND crew_id NOT LIKE '%-TEST' AND crew_id NOT LIKE '%-900'

  UNION ALL

  SELECT 'warehouse', warehouse_id
  FROM warehouses
  WHERE archived_at IS NULL AND warehouse_id NOT LIKE '%-TEST' AND warehouse_id NOT LIKE '%-900'
)
INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code,
  granted_at
)
SELECT
  la.cks_code,
  la.role,
  'standard',
  'active',
  'CKS-SEED-' || UPPER(la.role),
  FALSE,
  'system',
  'seed',
  NOW()
FROM live_accounts la
LEFT JOIN access_grants ag
  ON UPPER(ag.cks_code) = UPPER(la.cks_code)
 AND LOWER(ag.role) = LOWER(la.role)
 AND ag.status = 'active'
WHERE ag.grant_id IS NULL;
