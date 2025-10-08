-- +migrate Up
-- Add resolution_notes column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Add resolution_notes column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- +migrate Down
ALTER TABLE reports DROP COLUMN IF EXISTS resolution_notes;
ALTER TABLE feedback DROP COLUMN IF EXISTS resolution_notes;
