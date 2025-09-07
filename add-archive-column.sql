-- Add archived_at column to managers table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'managers' AND column_name = 'archived_at') THEN
        ALTER TABLE managers ADD COLUMN archived_at TIMESTAMP NULL;
    END IF;
END $$;

-- Create index for archived_at column for better performance
CREATE INDEX IF NOT EXISTS idx_managers_archived_at ON managers(archived_at);

-- Test query to verify column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'managers' AND column_name = 'archived_at';