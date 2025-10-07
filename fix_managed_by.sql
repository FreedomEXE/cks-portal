-- Fix managed_by column in catalog_services table
-- Run this file directly against your database

-- Add the column
ALTER TABLE catalog_services
ADD COLUMN IF NOT EXISTS managed_by VARCHAR(20) NOT NULL DEFAULT 'manager';

-- Add check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'catalog_services_managed_by_check'
  ) THEN
    ALTER TABLE catalog_services
    ADD CONSTRAINT catalog_services_managed_by_check
    CHECK (managed_by IN ('manager', 'warehouse'));
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_catalog_services_managed_by
ON catalog_services(managed_by);

-- Update existing services
UPDATE catalog_services
SET managed_by = 'manager'
WHERE managed_by IS NULL;

-- Delete old WSRV- services if they exist
DELETE FROM catalog_services WHERE service_id LIKE 'WSRV-%';

-- Insert warehouse services
INSERT INTO catalog_services (
  service_id, name, description, tags, category, unit_of_measure,
  base_price, currency, duration_minutes, service_window, crew_required,
  attributes, metadata, managed_by, is_active
) VALUES
  ('SRV-101', 'Inventory Audit Service', 'Comprehensive inventory count and verification service performed by warehouse staff',
   ARRAY['warehouse', 'inventory', 'audit'], 'warehouse', 'audit', 150.00, 'USD', 180, 'business-hours', 1,
   '{"requires_warehouse_access": true, "includes_reporting": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-102', 'Product Receiving & Inspection', 'Receiving, inspection, and shelving of incoming products',
   ARRAY['warehouse', 'receiving', 'inspection'], 'warehouse', 'shipment', 75.00, 'USD', 90, 'business-hours', 1,
   '{"includes_quality_check": true, "requires_forklift": false}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-103', 'Special Order Fulfillment', 'Custom order picking, packing, and preparation for delivery',
   ARRAY['warehouse', 'fulfillment', 'custom'], 'warehouse', 'order', 50.00, 'USD', 60, 'same-day', 1,
   '{"priority_handling": true, "custom_packaging": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-104', 'Product Relabeling Service', 'Relabeling and repackaging of products for specific requirements',
   ARRAY['warehouse', 'relabeling', 'packaging'], 'warehouse', 'unit', 35.00, 'USD', 45, 'business-hours', 1,
   '{"includes_materials": true, "custom_labels": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-105', 'Emergency Stock Retrieval', 'After-hours emergency inventory retrieval and preparation',
   ARRAY['warehouse', 'emergency', 'urgent'], 'warehouse', 'request', 200.00, 'USD', 30, 'after-hours', 1,
   '{"emergency_service": true, "after_hours_surcharge": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-106', 'Pallet Breakdown & Distribution', 'Breaking down bulk pallets and organizing for distribution',
   ARRAY['warehouse', 'distribution', 'logistics'], 'warehouse', 'pallet', 85.00, 'USD', 120, 'business-hours', 1,
   '{"requires_forklift": true, "includes_sorting": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-107', 'Product Return Processing', 'Inspection, documentation, and restocking of returned products',
   ARRAY['warehouse', 'returns', 'inspection'], 'warehouse', 'return', 45.00, 'USD', 60, 'business-hours', 1,
   '{"includes_inspection": true, "damage_documentation": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE),

  ('SRV-108', 'Storage Organization Service', 'Warehouse storage optimization and organization',
   ARRAY['warehouse', 'organization', 'optimization'], 'warehouse', 'section', 125.00, 'USD', 240, 'business-hours', 2,
   '{"includes_labeling": true, "optimization_plan": true}'::jsonb,
   '{"managed_by": "warehouse", "service_type": "warehouse"}'::jsonb, 'warehouse', TRUE)
ON CONFLICT (service_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  base_price = EXCLUDED.base_price,
  duration_minutes = EXCLUDED.duration_minutes,
  attributes = EXCLUDED.attributes,
  metadata = EXCLUDED.metadata,
  managed_by = EXCLUDED.managed_by,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify
SELECT service_id, name, managed_by, is_active FROM catalog_services ORDER BY service_id;
