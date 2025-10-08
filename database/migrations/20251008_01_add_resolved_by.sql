-- Add resolved_by_id column to reports table to track who resolved the report
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by_id VARCHAR(50);

-- Add resolved_at timestamp to track when it was resolved
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
