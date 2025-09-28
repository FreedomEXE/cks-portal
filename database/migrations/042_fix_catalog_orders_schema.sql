-- Fix catalog and orders schema to properly separate products and services
-- This migration updates the existing schema to match the new design

-- First, ensure we have the split catalog tables from migration 041
-- The catalog_products and catalog_services tables should already exist

-- Add category columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'catalog_products' AND column_name = 'category') THEN
    ALTER TABLE catalog_products ADD COLUMN category TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'catalog_services' AND column_name = 'category') THEN
    ALTER TABLE catalog_services ADD COLUMN category TEXT;
  END IF;
END $$;

-- Update the order_items table to use product_id and service_id instead of generic item references
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_id VARCHAR(32),
  ADD COLUMN IF NOT EXISTS service_id VARCHAR(32),
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'USD';

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_order_items_product') THEN
    ALTER TABLE order_items
      ADD CONSTRAINT fk_order_items_product
      FOREIGN KEY (product_id) REFERENCES catalog_products(product_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_order_items_service') THEN
    ALTER TABLE order_items
      ADD CONSTRAINT fk_order_items_service
      FOREIGN KEY (service_id) REFERENCES catalog_services(service_id);
  END IF;
END $$;

-- Add check constraint to ensure exactly one of product_id or service_id is set
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS chk_order_items_type;
ALTER TABLE order_items
  ADD CONSTRAINT chk_order_items_type
  CHECK ((product_id IS NOT NULL AND service_id IS NULL) OR
         (product_id IS NULL AND service_id IS NOT NULL));

-- Migrate existing data if needed (assuming item_id was storing catalog codes)
UPDATE order_items oi
SET product_id = oi.item_id
WHERE oi.item_type = 'product'
  AND oi.product_id IS NULL
  AND EXISTS (SELECT 1 FROM catalog_products p WHERE p.product_id = oi.item_id);

UPDATE order_items oi
SET service_id = oi.item_id
WHERE oi.item_type = 'service'
  AND oi.service_id IS NULL
  AND EXISTS (SELECT 1 FROM catalog_services s WHERE s.service_id = oi.item_id);

-- Set default categories for existing catalog items
UPDATE catalog_products
SET category = 'supplies'
WHERE category IS NULL
  AND product_id IN ('PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005');

UPDATE catalog_products
SET category = 'materials'
WHERE category IS NULL
  AND product_id IN ('PRD-006', 'PRD-007', 'PRD-008', 'PRD-009', 'PRD-010');

UPDATE catalog_services
SET category = 'cleaning'
WHERE category IS NULL
  AND service_id IN ('SRV-001', 'SRV-002', 'SRV-003', 'SRV-004', 'SRV-005');

UPDATE catalog_services
SET category = 'maintenance'
WHERE category IS NULL
  AND service_id IN ('SRV-006', 'SRV-007', 'SRV-008', 'SRV-009', 'SRV-010');