-- +migrate Up
-- Add archive columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS cks_manager VARCHAR(50);

-- Add archive columns to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMPTZ;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS cks_manager VARCHAR(50);

-- Create indexes for cks_manager (used for ecosystem queries)
CREATE INDEX IF NOT EXISTS idx_reports_cks_manager ON reports(cks_manager);
CREATE INDEX IF NOT EXISTS idx_feedback_cks_manager ON feedback(cks_manager);

-- +migrate Down
ALTER TABLE reports DROP COLUMN IF EXISTS archived_by;
ALTER TABLE reports DROP COLUMN IF EXISTS archive_reason;
ALTER TABLE reports DROP COLUMN IF EXISTS deletion_scheduled;
ALTER TABLE reports DROP COLUMN IF EXISTS restored_at;
ALTER TABLE reports DROP COLUMN IF EXISTS restored_by;
ALTER TABLE reports DROP COLUMN IF EXISTS cks_manager;

ALTER TABLE feedback DROP COLUMN IF EXISTS archived_by;
ALTER TABLE feedback DROP COLUMN IF EXISTS archive_reason;
ALTER TABLE feedback DROP COLUMN IF EXISTS deletion_scheduled;
ALTER TABLE feedback DROP COLUMN IF EXISTS restored_at;
ALTER TABLE feedback DROP COLUMN IF EXISTS restored_by;
ALTER TABLE feedback DROP COLUMN IF EXISTS updated_at;
ALTER TABLE feedback DROP COLUMN IF EXISTS cks_manager;

DROP INDEX IF EXISTS idx_reports_cks_manager;
DROP INDEX IF EXISTS idx_feedback_cks_manager;
