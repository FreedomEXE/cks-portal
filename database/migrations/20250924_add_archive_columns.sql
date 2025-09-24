-- Add archive/soft-delete columns to all user tables
-- This migration adds support for soft delete, archiving, and scheduled hard delete

-- Managers table
ALTER TABLE managers
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;

-- Contractors table
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;

-- Customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;

-- Centers table
ALTER TABLE centers
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;

-- Crew table
ALTER TABLE crew
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;

-- Create archive relationship tracking table
-- This stores parent-child relationships before deletion for potential restoration
CREATE TABLE IF NOT EXISTS archive_relationships (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'contractor', 'customer', 'center', 'crew'
  entity_id VARCHAR(50) NOT NULL,
  parent_type VARCHAR(50),
  parent_id VARCHAR(50),
  relationship_data JSONB, -- Store additional relationship metadata
  archived_at TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_by VARCHAR(50),
  restored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_managers_archived_at ON managers(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_contractors_archived_at ON contractors(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_customers_archived_at ON customers(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_centers_archived_at ON centers(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_crew_archived_at ON crew(archived_at) WHERE archived_at IS NOT NULL;

CREATE INDEX idx_archive_relationships_entity ON archive_relationships(entity_type, entity_id);
CREATE INDEX idx_archive_relationships_archived_at ON archive_relationships(archived_at);

-- Create a view for easy access to all archived entities
CREATE OR REPLACE VIEW archived_entities AS
SELECT
  'manager' as entity_type,
  manager_id as entity_id,
  manager_name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM managers
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'contractor' as entity_type,
  contractor_id as entity_id,
  company_name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM contractors
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'customer' as entity_type,
  customer_id as entity_id,
  company_name as name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM customers
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'center' as entity_type,
  center_id as entity_id,
  name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM centers
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'crew' as entity_type,
  crew_id as entity_id,
  name,
  archived_at,
  archived_by,
  archive_reason,
  deletion_scheduled
FROM crew
WHERE archived_at IS NOT NULL;