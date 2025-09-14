-- Migration: 008_contractors_add_contact_person.sql
-- Description: Ensure contractors table has contact_person column for Admin create flow

ALTER TABLE IF EXISTS contractors
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

