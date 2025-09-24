/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/*
 File: 20250923090000_alter_managers_add_profile_columns.sql

 Description:
 Adds missing profile-oriented fields for managers so hubs can read the
 data captured during provisioning (role, reports_to, address).

 Responsibilities:
 - Add role/reports_to/address columns to managers table
 - Provide rollback for local development resets

 Notes:
 Keep columns nullable to avoid backfill requirements for existing data.
*/
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

-- Up
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS role VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Down
ALTER TABLE managers
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS reports_to,
  DROP COLUMN IF EXISTS role;
