-- +migrate Up
-- Add acknowledgment tracking system to reports and feedback

-- Add columns to reports table for acknowledgment tracking
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS required_acknowledgers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS acknowledgment_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS resolved_by_role VARCHAR(20),
ADD COLUMN IF NOT EXISTS resolved_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS action_taken TEXT;

-- Create index for acknowledgment_complete for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_ack_complete ON reports(acknowledgment_complete);
CREATE INDEX IF NOT EXISTS idx_reports_resolved_at ON reports(resolved_at);

-- +migrate Down
ALTER TABLE reports
DROP COLUMN IF EXISTS required_acknowledgers,
DROP COLUMN IF EXISTS acknowledgment_complete,
DROP COLUMN IF EXISTS resolved_at,
DROP COLUMN IF EXISTS resolved_by_id,
DROP COLUMN IF EXISTS resolved_by_role,
DROP COLUMN IF EXISTS resolved_by_name,
DROP COLUMN IF EXISTS resolution_notes,
DROP COLUMN IF EXISTS action_taken;

DROP INDEX IF EXISTS idx_reports_ack_complete;
DROP INDEX IF EXISTS idx_reports_resolved_at;
