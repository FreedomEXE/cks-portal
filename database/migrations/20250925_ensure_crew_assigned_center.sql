-- Ensure crew table has assigned_center column
-- This migration adds the assigned_center column if it's missing

-- Add assigned_center column if it doesn't exist
ALTER TABLE crew
  ADD COLUMN IF NOT EXISTS assigned_center TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_crew_assigned_center ON crew(assigned_center);

-- Update any crew members that might have been created without center assignment
-- This is a safety update in case there are any orphaned crew members
UPDATE crew
SET assigned_center = NULL
WHERE assigned_center = '';