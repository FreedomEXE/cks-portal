-- Add archive columns to warehouses, services, and products tables

-- Warehouses
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);

-- Services
ALTER TABLE services ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE services ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
ALTER TABLE services ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;
ALTER TABLE services ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP;
ALTER TABLE services ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);

-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouses_archived_at ON warehouses(archived_at);
CREATE INDEX IF NOT EXISTS idx_services_archived_at ON services(archived_at);
CREATE INDEX IF NOT EXISTS idx_products_archived_at ON products(archived_at);

-- Verify columns were added
SELECT
    'warehouses' as table_name,
    COUNT(*) as archive_columns_count
FROM information_schema.columns
WHERE table_name = 'warehouses'
AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
UNION ALL
SELECT
    'services' as table_name,
    COUNT(*) as archive_columns_count
FROM information_schema.columns
WHERE table_name = 'services'
AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
UNION ALL
SELECT
    'products' as table_name,
    COUNT(*) as archive_columns_count
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled');