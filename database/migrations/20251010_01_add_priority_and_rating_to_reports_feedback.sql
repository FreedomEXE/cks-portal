-- Add priority to reports and rating + structured fields to feedback

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) CHECK (priority IN ('LOW','MEDIUM','HIGH'));

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS report_category TEXT,
  ADD COLUMN IF NOT EXISTS related_entity_id TEXT,
  ADD COLUMN IF NOT EXISTS report_reason TEXT;

