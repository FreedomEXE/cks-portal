-- Migration: 009_contractors_add_status.sql
-- Description: Ensure contractors table has a status column with default 'active'

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contractors' AND column_name='status'
  ) THEN
    ALTER TABLE contractors
      ADD COLUMN status VARCHAR(20);
    ALTER TABLE contractors
      ALTER COLUMN status SET DEFAULT 'active';
  END IF;
END$$;

