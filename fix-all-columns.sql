-- Comprehensive fix for all missing columns in CKS Portal database
-- Run this entire script in Beekeeper Studio

-- 1. Fix customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned',
  ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(50);

-- 2. Fix centers table
ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned',
  ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(50);

-- 3. Fix crew table
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crew' AND column_name = 'status'
  ) THEN
    ALTER TABLE crew ADD COLUMN status VARCHAR(255) DEFAULT 'unassigned';
  END IF;

  -- Handle emergency_contact column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crew' AND column_name = 'emergency_contact'
  ) THEN
    -- Check if 'role' exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'crew' AND column_name = 'role'
    ) THEN
      ALTER TABLE crew RENAME COLUMN role TO emergency_contact;
    ELSE
      ALTER TABLE crew ADD COLUMN emergency_contact VARCHAR(255);
    END IF;
  END IF;
END $$;

-- 4. Fix warehouses table
ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS main_contact VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'active';

-- 5. Fix managers table (profile fields)
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS role VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- 6. Ensure contractors have status (should already exist)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned';

-- Verify all columns were added
SELECT 'Verification Results:' as message;

SELECT
  'customers.status' as column_check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='status') as exists;

SELECT
  'centers.status' as column_check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='centers' AND column_name='status') as exists;

SELECT
  'crew.status' as column_check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='crew' AND column_name='status') as exists;

SELECT
  'crew.emergency_contact' as column_check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='crew' AND column_name='emergency_contact') as exists;

SELECT
  'warehouses.main_contact' as column_check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='main_contact') as exists;

SELECT 'All columns should show TRUE above. If not, there was an error.' as message;