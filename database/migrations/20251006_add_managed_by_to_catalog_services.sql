-- Migration: Add managed_by column to catalog_services
-- This column distinguishes between manager-managed and warehouse-managed services

-- Add the column first
ALTER TABLE catalog_services
ADD COLUMN IF NOT EXISTS managed_by VARCHAR(20) NOT NULL DEFAULT 'manager';

-- Add check constraint (use DO block to avoid error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'catalog_services_managed_by_check'
  ) THEN
    ALTER TABLE catalog_services
    ADD CONSTRAINT catalog_services_managed_by_check
    CHECK (managed_by IN ('manager', 'warehouse'));
  END IF;
END $$;

-- Add index for filtering by managed_by
CREATE INDEX IF NOT EXISTS idx_catalog_services_managed_by
ON catalog_services(managed_by);

-- Update existing services to be manager-managed by default
UPDATE catalog_services
SET managed_by = 'manager'
WHERE managed_by IS NULL;
