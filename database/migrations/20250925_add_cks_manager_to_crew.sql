-- Add cks_manager column to crew table for manager inheritance
ALTER TABLE crew
  ADD COLUMN IF NOT EXISTS cks_manager TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_crew_cks_manager ON crew(cks_manager);

-- Update existing crew members to inherit manager from their assigned center
UPDATE crew
SET cks_manager = centers.cks_manager
FROM centers
WHERE crew.assigned_center = centers.center_id
  AND crew.cks_manager IS NULL
  AND centers.cks_manager IS NOT NULL;