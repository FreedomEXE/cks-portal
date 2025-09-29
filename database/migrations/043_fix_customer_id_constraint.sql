-- Remove NOT NULL constraint from legacy fields that are now optional
-- These fields are being kept temporarily for backward compatibility
-- but should no longer be required since we use creator_id/destination

ALTER TABLE orders
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE orders
  ALTER COLUMN center_id DROP NOT NULL;

ALTER TABLE orders
  ALTER COLUMN contractor_id DROP NOT NULL;

ALTER TABLE orders
  ALTER COLUMN manager_id DROP NOT NULL;

ALTER TABLE orders
  ALTER COLUMN crew_id DROP NOT NULL;