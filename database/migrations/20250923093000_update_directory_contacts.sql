/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/*
 File: 20250923093000_update_directory_contacts.sql

 Description:
 Adds emergency contact support for crew records and stores main contact
 details for warehouses to align with provisioning data requirements.

 Responsibilities:
 - Rename crew.role column to crew.emergency_contact
 - Add warehouses.main_contact column

 Notes:
 Guard clauses ensure the migration can run multiple times safely.
*/
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

-- Up
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'crew'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE crew RENAME COLUMN role TO emergency_contact;
  END IF;
END $$;

ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS main_contact VARCHAR(255);

-- Down
ALTER TABLE warehouses
  DROP COLUMN IF EXISTS main_contact;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'crew'
      AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE crew RENAME COLUMN emergency_contact TO role;
  END IF;
END $$;
