-- Sync crew.cks_manager from the assigned center's manager.
-- Use this when crew were seeded with assigned_center but skipped manager cascade.

UPDATE crew AS c
SET cks_manager = ct.cks_manager,
    updated_at = NOW()
FROM centers AS ct
WHERE UPPER(c.assigned_center) = UPPER(ct.center_id)
  AND COALESCE(UPPER(c.cks_manager), '') <> COALESCE(UPPER(ct.cks_manager), '');
