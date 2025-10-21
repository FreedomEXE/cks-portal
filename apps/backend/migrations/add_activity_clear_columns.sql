-- Add columns to support clearing activities
-- This allows users to clear activities from their feed while keeping the data for potential restore

ALTER TABLE system_activity
ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cleared_by VARCHAR(100);

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_system_activity_cleared_at ON system_activity(cleared_at)
WHERE cleared_at IS NULL;

COMMENT ON COLUMN system_activity.cleared_at IS 'Timestamp when this activity was cleared from the user feed';
COMMENT ON COLUMN system_activity.cleared_by IS 'User ID who cleared this activity';
