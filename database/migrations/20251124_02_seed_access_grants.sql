INSERT INTO access_codes (
  code,
  target_role,
  tier,
  status,
  max_redemptions,
  redeemed_count,
  scope_role,
  scope_code,
  cascade,
  created_by_role,
  created_by_code,
  notes
)
VALUES
  ('CKS-SEED-MANAGER', 'manager', 'standard', 'active', 100000, 0, NULL, NULL, false, 'system', 'seed', 'Seed free access'),
  ('CKS-SEED-CONTRACTOR', 'contractor', 'standard', 'active', 100000, 0, NULL, NULL, false, 'system', 'seed', 'Seed free access'),
  ('CKS-SEED-CUSTOMER', 'customer', 'standard', 'active', 100000, 0, NULL, NULL, false, 'system', 'seed', 'Seed free access'),
  ('CKS-SEED-CENTER', 'center', 'standard', 'active', 100000, 0, NULL, NULL, false, 'system', 'seed', 'Seed free access'),
  ('CKS-SEED-CREW', 'crew', 'standard', 'active', 100000, 0, NULL, NULL, false, 'system', 'seed', 'Seed free access'),
  ('CKS-SEED-WAREHOUSE', 'warehouse', 'standard', 'active', 100000, 0, NULL, NULL, false, 'system', 'seed', 'Seed free access')
ON CONFLICT (code) DO NOTHING;

INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code
)
SELECT
  UPPER(manager_id),
  'manager',
  'standard',
  'active',
  'CKS-SEED-MANAGER',
  false,
  'system',
  'seed'
FROM managers
WHERE manager_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM access_grants
    WHERE UPPER(cks_code) = UPPER(manager_id)
      AND role = 'manager'
      AND status = 'active'
  );

INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code
)
SELECT
  UPPER(contractor_id),
  'contractor',
  'standard',
  'active',
  'CKS-SEED-CONTRACTOR',
  false,
  'system',
  'seed'
FROM contractors
WHERE contractor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM access_grants
    WHERE UPPER(cks_code) = UPPER(contractor_id)
      AND role = 'contractor'
      AND status = 'active'
  );

INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code
)
SELECT
  UPPER(customer_id),
  'customer',
  'standard',
  'active',
  'CKS-SEED-CUSTOMER',
  false,
  'system',
  'seed'
FROM customers
WHERE customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM access_grants
    WHERE UPPER(cks_code) = UPPER(customer_id)
      AND role = 'customer'
      AND status = 'active'
  );

INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code
)
SELECT
  UPPER(center_id),
  'center',
  'standard',
  'active',
  'CKS-SEED-CENTER',
  false,
  'system',
  'seed'
FROM centers
WHERE center_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM access_grants
    WHERE UPPER(cks_code) = UPPER(center_id)
      AND role = 'center'
      AND status = 'active'
  );

INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code
)
SELECT
  UPPER(crew_id),
  'crew',
  'standard',
  'active',
  'CKS-SEED-CREW',
  false,
  'system',
  'seed'
FROM crew
WHERE crew_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM access_grants
    WHERE UPPER(cks_code) = UPPER(crew_id)
      AND role = 'crew'
      AND status = 'active'
  );

INSERT INTO access_grants (
  cks_code,
  role,
  tier,
  status,
  source_code,
  cascade,
  granted_by_role,
  granted_by_code
)
SELECT
  UPPER(warehouse_id),
  'warehouse',
  'standard',
  'active',
  'CKS-SEED-WAREHOUSE',
  false,
  'system',
  'seed'
FROM warehouses
WHERE warehouse_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM access_grants
    WHERE UPPER(cks_code) = UPPER(warehouse_id)
      AND role = 'warehouse'
      AND status = 'active'
  );
