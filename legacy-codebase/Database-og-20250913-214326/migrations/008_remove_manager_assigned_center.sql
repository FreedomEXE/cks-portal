-- Migration: Remove assigned_center from managers table
-- Reason: Managers can manage multiple centers, not just one assigned center

-- Remove the assigned_center column from managers table
ALTER TABLE managers DROP COLUMN IF EXISTS assigned_center;

-- Clean up any references in INSERT statements (already handled in main schema)
-- No additional cleanup needed as this was conceptually incorrect