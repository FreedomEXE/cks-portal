-- CKS Portal test user bootstrap for Clerk-linked accounts
--
-- Usage example:
--   psql "$DATABASE_URL" -v admin_clerk_id='user_admin' -v manager_clerk_id='user_manager' -v contractor_clerk_id='user_contractor' -v customer_clerk_id='user_customer' -v center_clerk_id='user_center' -v crew_clerk_id='user_crew' -v warehouse_clerk_id='user_warehouse' -f scripts/setup-test-users.sql
--
-- Provide only the variables you want to seed; missing variables are skipped.
-- Re-running the script is safe and keeps the IDs stable so you can log in or
-- impersonate predictable accounts across sessions.

\echo '--- CKS Portal test user setup starting ---'

BEGIN;

-- Ensure identity sequences exist (matches identity/customIdGenerator.ts)
CREATE SEQUENCE IF NOT EXISTS manager_id_seq AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE;
CREATE SEQUENCE IF NOT EXISTS contractor_id_seq AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE;
CREATE SEQUENCE IF NOT EXISTS customer_id_seq AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE;
CREATE SEQUENCE IF NOT EXISTS center_id_seq AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE;
CREATE SEQUENCE IF NOT EXISTS crew_id_seq AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE;
CREATE SEQUENCE IF NOT EXISTS warehouse_id_seq AS BIGINT START WITH 1 INCREMENT BY 1 OWNED BY NONE;

-- Admin test account
\if :{?admin_clerk_id}
  UPDATE admin_users
  SET clerk_user_id = :'admin_clerk_id'
  WHERE cks_code = 'ADM-900';

  INSERT INTO admin_users (
    clerk_user_id,
    cks_code,
    role,
    status,
    full_name,
    email,
    territory,
    phone,
    address,
    reports_to,
    created_at,
    updated_at
  ) VALUES (
    :'admin_clerk_id',
    'ADM-900',
    'admin',
    'active',
    'Clerk Test Admin',
    'admin+clerk_test@ckscontracting.ca',
    'National',
    '555-0100',
    '100 Admin Ave, Ottawa, ON',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (cks_code) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    territory = EXCLUDED.territory,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = NOW();
\else
  \echo 'Skipping admin_users insert (admin_clerk_id not provided)'
\endif

-- Manager test account
\if :{?manager_clerk_id}
  UPDATE managers
  SET clerk_user_id = NULL
  WHERE clerk_user_id = :'manager_clerk_id' AND manager_id <> 'MGR-900';

  INSERT INTO managers (
    manager_id,
    clerk_user_id,
    name,
    email,
    phone,
    territory,
    role,
    reports_to,
    address,
    status,
    created_at,
    updated_at
  ) VALUES (
    'MGR-900',
    :'manager_clerk_id',
    'Operations Manager Test',
    'manager+clerk_test@ckscontracting.ca',
    '555-0101',
    'Prairies',
    'Operations Manager',
    'CEO',
    '200 Manager Way, Winnipeg, MB',
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (manager_id) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    territory = EXCLUDED.territory,
    role = EXCLUDED.role,
    reports_to = EXCLUDED.reports_to,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    updated_at = NOW();
\else
  \echo 'Skipping managers insert (manager_clerk_id not provided)'
\endif

-- Contractor test account (linked to MGR-900)
\if :{?contractor_clerk_id}
  UPDATE contractors
  SET clerk_user_id = NULL
  WHERE clerk_user_id = :'contractor_clerk_id' AND contractor_id <> 'CON-900';

  INSERT INTO contractors (
    contractor_id,
    clerk_user_id,
    name,
    contact_person,
    email,
    phone,
    address,
    status,
    cks_manager,
    created_at,
    updated_at
  ) VALUES (
    'CON-900',
    :'contractor_clerk_id',
    'Prairie Contractors Ltd.',
    'Casey Contractor',
    'contractor+clerk_test@ckscontracting.ca',
    '555-0102',
    '300 Contractor Rd, Regina, SK',
    'active',
    'MGR-900',
    NOW(),
    NOW()
  )
  ON CONFLICT (contractor_id) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    name = EXCLUDED.name,
    contact_person = EXCLUDED.contact_person,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    cks_manager = EXCLUDED.cks_manager,
    updated_at = NOW();
\else
  \echo 'Skipping contractors insert (contractor_clerk_id not provided)'
\endif

-- Customer test account
\if :{?customer_clerk_id}
  UPDATE customers
  SET clerk_user_id = NULL
  WHERE clerk_user_id = :'customer_clerk_id' AND customer_id <> 'CUS-900';

  INSERT INTO customers (
    customer_id,
    clerk_user_id,
    name,
    main_contact,
    email,
    phone,
    address,
    status,
    contractor_id,
    cks_manager,
    created_at,
    updated_at
  ) VALUES (
    'CUS-900',
    :'customer_clerk_id',
    'Sunrise Retail Group',
    'Colleen Customer',
    'customer+clerk_test@ckscontracting.ca',
    '555-0103',
    '400 Customer Blvd, Saskatoon, SK',
    'active',
    'CON-900',
    'MGR-900',
    NOW(),
    NOW()
  )
  ON CONFLICT (customer_id) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    name = EXCLUDED.name,
    main_contact = EXCLUDED.main_contact,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    contractor_id = EXCLUDED.contractor_id,
    cks_manager = EXCLUDED.cks_manager,
    updated_at = NOW();
\else
  \echo 'Skipping customers insert (customer_clerk_id not provided)'
\endif

-- Center test account
\if :{?center_clerk_id}
  UPDATE centers
  SET clerk_user_id = NULL
  WHERE clerk_user_id = :'center_clerk_id' AND center_id <> 'CEN-900';

  INSERT INTO centers (
    center_id,
    clerk_user_id,
    name,
    main_contact,
    email,
    phone,
    address,
    status,
    customer_id,
    contractor_id,
    cks_manager,
    created_at,
    updated_at
  ) VALUES (
    'CEN-900',
    :'center_clerk_id',
    'Saskatoon Service Hub',
    'Corey Center',
    'center+clerk_test@ckscontracting.ca',
    '555-0104',
    '500 Center St, Saskatoon, SK',
    'active',
    'CUS-900',
    'CON-900',
    'MGR-900',
    NOW(),
    NOW()
  )
  ON CONFLICT (center_id) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    name = EXCLUDED.name,
    main_contact = EXCLUDED.main_contact,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    customer_id = EXCLUDED.customer_id,
    contractor_id = EXCLUDED.contractor_id,
    cks_manager = EXCLUDED.cks_manager,
    updated_at = NOW();
\else
  \echo 'Skipping centers insert (center_clerk_id not provided)'
\endif

-- Crew test account
\if :{?crew_clerk_id}
  UPDATE crew
  SET clerk_user_id = NULL
  WHERE clerk_user_id = :'crew_clerk_id' AND crew_id <> 'CRW-900';

  INSERT INTO crew (
    crew_id,
    clerk_user_id,
    name,
    emergency_contact,
    email,
    phone,
    address,
    status,
    assigned_center,
    cks_manager,
    created_at,
    updated_at
  ) VALUES (
    'CRW-900',
    :'crew_clerk_id',
    'Field Crew 900',
    'Cameron Crew (555-0190)',
    'crew+clerk_test@ckscontracting.ca',
    '555-0105',
    '600 Crew Yard, Saskatoon, SK',
    'active',
    'CEN-900',
    'MGR-900',
    NOW(),
    NOW()
  )
  ON CONFLICT (crew_id) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    name = EXCLUDED.name,
    emergency_contact = EXCLUDED.emergency_contact,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    assigned_center = EXCLUDED.assigned_center,
    cks_manager = EXCLUDED.cks_manager,
    updated_at = NOW();
\else
  \echo 'Skipping crew insert (crew_clerk_id not provided)'
\endif

-- Warehouse test account
\if :{?warehouse_clerk_id}
  UPDATE warehouses
  SET clerk_user_id = NULL
  WHERE clerk_user_id = :'warehouse_clerk_id' AND warehouse_id <> 'WHS-900';

  INSERT INTO warehouses (
    warehouse_id,
    clerk_user_id,
    name,
    main_contact,
    email,
    phone,
    address,
    status,
    warehouse_type,
    manager_id,
    created_at,
    updated_at
  ) VALUES (
    'WHS-900',
    :'warehouse_clerk_id',
    'Saskatoon Fulfillment Center',
    'Wanda Warehouse',
    'warehouse+clerk_test@ckscontracting.ca',
    '555-0106',
    '700 Warehouse Pkwy, Saskatoon, SK',
    'active',
    'distribution',
    'MGR-900',
    NOW(),
    NOW()
  )
  ON CONFLICT (warehouse_id) DO UPDATE
  SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    name = EXCLUDED.name,
    main_contact = EXCLUDED.main_contact,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    warehouse_type = EXCLUDED.warehouse_type,
    manager_id = EXCLUDED.manager_id,
    updated_at = NOW();
\else
  \echo 'Skipping warehouses insert (warehouse_clerk_id not provided)'
\endif

-- Realign sequences so that generated IDs continue after the highest seeded value
WITH seq_targets AS (
  SELECT 'manager_id_seq'::text AS seq_name, COALESCE(MAX(CAST(NULLIF(regexp_replace(manager_id, '\\D', '', 'g'), '') AS BIGINT)), 0) AS max_val FROM managers
  UNION ALL
  SELECT 'contractor_id_seq', COALESCE(MAX(CAST(NULLIF(regexp_replace(contractor_id, '\\D', '', 'g'), '') AS BIGINT)), 0) FROM contractors
  UNION ALL
  SELECT 'customer_id_seq', COALESCE(MAX(CAST(NULLIF(regexp_replace(customer_id, '\\D', '', 'g'), '') AS BIGINT)), 0) FROM customers
  UNION ALL
  SELECT 'center_id_seq', COALESCE(MAX(CAST(NULLIF(regexp_replace(center_id, '\\D', '', 'g'), '') AS BIGINT)), 0) FROM centers
  UNION ALL
  SELECT 'crew_id_seq', COALESCE(MAX(CAST(NULLIF(regexp_replace(crew_id, '\\D', '', 'g'), '') AS BIGINT)), 0) FROM crew
  UNION ALL
  SELECT 'warehouse_id_seq', COALESCE(MAX(CAST(NULLIF(regexp_replace(warehouse_id, '\\D', '', 'g'), '') AS BIGINT)), 0) FROM warehouses
)
SELECT setval(seq_name, max_val, CASE WHEN max_val > 0 THEN true ELSE false END)
FROM seq_targets;

COMMIT;

\echo '--- CKS Portal test user setup complete ---'
\echo 'Run npx ts-node scripts/list-users.ts to review the seeded records.'
