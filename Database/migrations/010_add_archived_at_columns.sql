/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Add archived_at columns for soft delete functionality if they don't exist
-- This ensures all hub tables support archiving instead of hard deletion

-- Add archived_at to managers table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'managers' AND column_name = 'archived_at') THEN
        ALTER TABLE managers ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add archived_at to contractors table if missing  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contractors' AND column_name = 'archived_at') THEN
        ALTER TABLE contractors ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add archived_at to customers table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'archived_at') THEN
        ALTER TABLE customers ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add archived_at to centers table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'centers' AND column_name = 'archived_at') THEN
        ALTER TABLE centers ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add archived_at to crew table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'crew' AND column_name = 'archived_at') THEN
        ALTER TABLE crew ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add archived_at to warehouses table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'archived_at') THEN
        ALTER TABLE warehouses ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Create indexes for archived_at columns for better performance
CREATE INDEX IF NOT EXISTS idx_managers_archived_at ON managers(archived_at);
CREATE INDEX IF NOT EXISTS idx_contractors_archived_at ON contractors(archived_at);  
CREATE INDEX IF NOT EXISTS idx_customers_archived_at ON customers(archived_at);
CREATE INDEX IF NOT EXISTS idx_centers_archived_at ON centers(archived_at);
CREATE INDEX IF NOT EXISTS idx_crew_archived_at ON crew(archived_at);
CREATE INDEX IF NOT EXISTS idx_warehouses_archived_at ON warehouses(archived_at);