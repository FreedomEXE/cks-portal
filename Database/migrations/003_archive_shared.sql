-- Add Date (archived_at) to reports and feedback
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;
ALTER TABLE IF EXISTS feedback ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;
