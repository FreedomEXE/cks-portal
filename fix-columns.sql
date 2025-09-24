-- Fix missing columns that migrations failed to create

-- Add emergency_contact to crew table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'crew'
      AND column_name = 'emergency_contact'
  ) THEN
    -- First check if 'role' column exists and rename it
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'crew'
        AND column_name = 'role'
    ) THEN
      ALTER TABLE crew RENAME COLUMN role TO emergency_contact;
    ELSE
      -- If neither exists, add the column
      ALTER TABLE crew ADD COLUMN emergency_contact VARCHAR(255);
    END IF;
  END IF;
END $$;

-- Add main_contact to warehouses table if it doesn't exist
ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS main_contact VARCHAR(255);

-- Add profile columns to managers table if they don't exist
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS role VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address VARCHAR(255);

SELECT 'Columns fixed successfully' as status;