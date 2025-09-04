-- Align contractors table with MVP creation requirements
-- - Allow NULL cks_manager (assigned later)
-- - Add address and website fields

ALTER TABLE contractors
  ALTER COLUMN cks_manager DROP NOT NULL;

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

