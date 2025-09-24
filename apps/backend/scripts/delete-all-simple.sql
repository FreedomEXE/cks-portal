-- Delete all users from all tables (testing only)
-- Run in order to avoid foreign key violations

-- Safety check: Only allow in test environments
DO $
BEGIN
    IF current_database() NOT LIKE '%test%'
       AND current_database() NOT LIKE '%dev%' THEN
        RAISE EXCEPTION 'This script can only be run in test/dev databases. Current database: %', current_database();
    END IF;
END $;

BEGIN;
-- Delete archive relationships first
DELETE FROM archive_relationships;

-- Delete activity logs
DELETE FROM system_activity;

-- Delete users in reverse hierarchy order
DELETE FROM crew;
DELETE FROM centers;
DELETE FROM customers;
DELETE FROM contractors;
DELETE FROM managers;

-- Reset sequences to start from 1
ALTER SEQUENCE cks_manager_seq RESTART WITH 1;
ALTER SEQUENCE cks_contractor_seq RESTART WITH 1;
ALTER SEQUENCE cks_customer_seq RESTART WITH 1;
ALTER SEQUENCE cks_center_seq RESTART WITH 1;
ALTER SEQUENCE cks_crew_seq RESTART WITH 1;

COMMIT;

-- Show counts
SELECT 'managers' as table_name, COUNT(*) as count FROM managers
UNION ALL
SELECT 'contractors', COUNT(*) FROM contractors
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'centers', COUNT(*) FROM centers
UNION ALL
SELECT 'crew', COUNT(*) FROM crew;
