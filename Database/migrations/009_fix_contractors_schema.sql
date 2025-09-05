-- Migration: Fix contractors table schema
-- Add missing website and created_at columns, update existing data

-- Add missing columns
ALTER TABLE contractors 
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing CON-001 with proper data
UPDATE contractors 
SET 
  main_contact = 'Maria Johnson',
  website = 'https://network-services.ca',
  created_at = '2024-12-01 10:00:00',
  updated_at = CURRENT_TIMESTAMP
WHERE contractor_id = 'CON-001';

-- Insert missing CON-002 that should exist
INSERT INTO contractors (contractor_id, company_name, main_contact, email, phone, address, website, created_at, updated_at)
VALUES (
  'CON-002', 
  'contractor 1', 
  'Maria Rodriguez', 
  'contractor1@email.ca', 
  '6667778888', 
  'contract 1 street', 
  'https://contractor1.ca',
  '2024-12-01 11:00:00',
  CURRENT_TIMESTAMP
)
ON CONFLICT (contractor_id) DO UPDATE SET
  main_contact = EXCLUDED.main_contact,
  website = EXCLUDED.website,
  created_at = EXCLUDED.created_at,
  updated_at = CURRENT_TIMESTAMP;