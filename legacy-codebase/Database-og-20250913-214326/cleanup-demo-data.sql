/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Clean Demo Data Script
-- Removes all existing demo/seed data to start fresh

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clean all user/entity tables
DELETE FROM crew WHERE crew_id LIKE 'crew-%' OR crew_id LIKE 'CRW-%';
DELETE FROM centers WHERE center_id LIKE 'ctr-%' OR center_id LIKE 'CEN-%';
DELETE FROM customers WHERE customer_id LIKE 'cus-%' OR customer_id LIKE 'CUS-%';
DELETE FROM contractors WHERE contractor_id LIKE 'con-%' OR contractor_id LIKE 'CON-%';
DELETE FROM managers WHERE manager_id LIKE 'mgr-%' OR manager_id LIKE 'MGR-%';

-- Clean operational data
DELETE FROM orders WHERE order_id LIKE 'REQ-%' OR order_id LIKE 'ORD-%';
DELETE FROM order_items;
DELETE FROM approvals;
DELETE FROM service_jobs;
DELETE FROM job_assignments;

-- Clean warehouse data  
DELETE FROM warehouse_shipments;
DELETE FROM shipment_items;
DELETE FROM warehouse_staff;
DELETE FROM warehouse_activity_log;
DELETE FROM inventory_items;
DELETE FROM warehouses WHERE warehouse_id LIKE 'WH-%';

-- Clean requirements and training data
DELETE FROM crew_requirements;
DELETE FROM procedures WHERE procedure_id LIKE 'PRC-%';
DELETE FROM training WHERE training_id LIKE 'TRN-%';

-- Clean reports and feedback
DELETE FROM report_comments;
DELETE FROM reports;
DELETE FROM feedback;

-- Clean catalog data (keep services as they're needed for operations)
-- DELETE FROM services WHERE service_id LIKE 'SRV-%';
DELETE FROM products WHERE product_id LIKE 'PRD-%';
DELETE FROM supplies WHERE supply_id LIKE 'SUP-%';

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences (if any exist)
-- This ensures new IDs start from 001 again