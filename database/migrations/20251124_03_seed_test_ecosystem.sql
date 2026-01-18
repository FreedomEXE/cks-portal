BEGIN;

-- Test Manager (root ecosystem)
INSERT INTO managers (
  manager_id, name, email, phone, territory, status, role, reports_to, address, created_at, updated_at
) VALUES (
  'MGR-001-TEST',
  'Test Ecosystem Manager',
  'test.manager@ckscontracting.ca',
  '+1 (647) 555-0101',
  'Test Territory',
  'active',
  'manager',
  NULL,
  'Test Address',
  NOW(),
  NOW()
) ON CONFLICT (manager_id) DO NOTHING;

-- Test Contractor
INSERT INTO contractors (
  contractor_id, cks_manager, name, num_customers, main_contact, address, phone, email, status, created_at, updated_at
) VALUES (
  'CON-001-TEST',
  'MGR-001-TEST',
  'Test Contractor Co',
  1,
  'Test Contractor Contact',
  'Test Address',
  '+1 (647) 555-0102',
  'test.contractor@ckscontracting.ca',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (contractor_id) DO NOTHING;

-- Test Customer
INSERT INTO customers (
  customer_id, cks_manager, name, num_centers, main_contact, address, phone, email, status, contractor_id, created_at, updated_at
) VALUES (
  'CUS-001-TEST',
  'MGR-001-TEST',
  'Test Customer Co',
  1,
  'Test Customer Contact',
  'Test Address',
  '+1 (647) 555-0103',
  'test.customer@ckscontracting.ca',
  'active',
  'CON-001-TEST',
  NOW(),
  NOW()
) ON CONFLICT (customer_id) DO NOTHING;

-- Test Center
INSERT INTO centers (
  center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id, status, created_at, updated_at
) VALUES (
  'CEN-001-TEST',
  'MGR-001-TEST',
  'Test Center Location',
  'Test Center Contact',
  'Test Address',
  '+1 (647) 555-0104',
  'test.center@ckscontracting.ca',
  'CON-001-TEST',
  'CUS-001-TEST',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (center_id) DO NOTHING;

-- Test Crew
INSERT INTO crew (
  crew_id, name, status, emergency_contact, address, phone, email, assigned_center, cks_manager, created_at, updated_at
) VALUES (
  'CRW-001-TEST',
  'Test Crew Member',
  'active',
  'Test Emergency Contact',
  'Test Address',
  '+1 (647) 555-0105',
  'test.crew@ckscontracting.ca',
  'CEN-001-TEST',
  'MGR-001-TEST',
  NOW(),
  NOW()
) ON CONFLICT (crew_id) DO NOTHING;

-- Test Warehouse
INSERT INTO warehouses (
  warehouse_id, name, address, phone, email, manager, manager_id, warehouse_type, status, main_contact, created_at, updated_at
) VALUES (
  'WHS-001-TEST',
  'Test Warehouse',
  'Test Address',
  '+1 (647) 555-0106',
  'test.warehouse@ckscontracting.ca',
  'Test Manager',
  'MGR-001-TEST',
  'test',
  'active',
  'Test Warehouse Contact',
  NOW(),
  NOW()
) ON CONFLICT (warehouse_id) DO NOTHING;

-- Test Catalog Product
INSERT INTO catalog_products (
  product_id, name, description, tags, category, unit_of_measure, package_size, attributes, metadata, is_active
) VALUES (
  'PRD-TEST-001',
  'Test Product',
  'Test catalog product for QA.',
  ARRAY['test', 'qa'],
  'test',
  'unit',
  '1/ea',
  '{"is_test":true}'::jsonb,
  '{"is_test":true}'::jsonb,
  TRUE
) ON CONFLICT (product_id) DO NOTHING;

-- Test Catalog Service
INSERT INTO catalog_services (
  service_id, name, description, tags, category, unit_of_measure, duration_minutes, service_window, crew_required, attributes, metadata, is_active, managed_by
) VALUES (
  'SRV-TEST-001',
  'Test Service',
  'Test catalog service for QA.',
  ARRAY['test', 'qa'],
  'test',
  'service',
  60,
  'flex',
  1,
  '{"is_test":true}'::jsonb,
  '{"is_test":true}'::jsonb,
  TRUE,
  'manager'
) ON CONFLICT (service_id) DO NOTHING;

-- Test Dashboard Product
INSERT INTO products (
  product_id, name, category, description, selling_price, unit_of_measure, status, warehouse_id, assigned_center, stock_level, reorder_point, created_at, updated_at
) VALUES (
  'PRD-001-TEST',
  'Test Dashboard Product',
  'test',
  'Test product for dashboard ordering.',
  10.00,
  'unit',
  'active',
  'WHS-001-TEST',
  'CEN-001-TEST',
  100,
  10,
  NOW(),
  NOW()
) ON CONFLICT (product_id) DO NOTHING;

-- Test Dashboard Service
INSERT INTO services (
  service_id, service_name, category, description, pricing_model, requirements, status, managed_by, created_at, updated_at
) VALUES (
  'SRV-001-TEST',
  'Test Dashboard Service',
  'test',
  'Test service for dashboard ordering.',
  'flat',
  'none',
  'active',
  'manager',
  NOW(),
  NOW()
) ON CONFLICT (service_id) DO NOTHING;

COMMIT;
