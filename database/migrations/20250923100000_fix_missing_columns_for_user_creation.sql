-- Fix missing columns for user creation in admin create section
-- This migration ensures centers, crew, and warehouses tables have all required columns

-- 1. Fix centers table
ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned';

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(50);

-- 2. Fix crew table
ALTER TABLE crew
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned';

-- Handle emergency_contact column (might be named 'role' in some databases)
DO $$
BEGIN
  -- Add emergency_contact if it doesn't exist
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

-- 3. Fix warehouses table
ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS main_contact VARCHAR(255);

ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'active';

-- 4. Fix customers table (ensure status exists)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned';

-- 5. Fix contractors table (ensure status exists)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned';

-- 6. Fix managers table profile columns (if not already added by previous migration)
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS role VARCHAR(255);

ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255);

ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS address VARCHAR(255);