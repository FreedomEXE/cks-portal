-- Split catalog into dedicated product and service tables while preserving legacy access
DO $$
BEGIN
  IF to_regclass('public.catalog_items_legacy') IS NULL AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_items'
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'ALTER TABLE catalog_items RENAME TO catalog_items_legacy';
  END IF;

  IF to_regclass('public.catalog_product_details_legacy') IS NULL AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_product_details'
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'ALTER TABLE catalog_product_details RENAME TO catalog_product_details_legacy';
  END IF;

  IF to_regclass('public.catalog_service_details_legacy') IS NULL AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_service_details'
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'ALTER TABLE catalog_service_details RENAME TO catalog_service_details_legacy';
  END IF;
END ;

CREATE TABLE IF NOT EXISTS catalog_products (
  product_id VARCHAR(32) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  category TEXT,
  unit_of_measure TEXT,
  base_price NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  sku TEXT,
  package_size TEXT,
  lead_time_days INTEGER,
  reorder_point INTEGER,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_services (
  service_id VARCHAR(32) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  category TEXT,
  unit_of_measure TEXT,
  base_price NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  duration_minutes INTEGER,
  service_window TEXT,
  crew_required INTEGER,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_catalog_products_updated_at ON catalog_products;
CREATE TRIGGER trig_catalog_products_updated_at
BEFORE UPDATE ON catalog_products
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trig_catalog_services_updated_at ON catalog_services;
CREATE TRIGGER trig_catalog_services_updated_at
BEFORE UPDATE ON catalog_services
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DO 
BEGIN
  IF to_regclass('public.catalog_items_legacy') IS NOT NULL THEN
    INSERT INTO catalog_products (
      product_id,
      name,
      description,
      image_url,
      tags,
      category,
      unit_of_measure,
      base_price,
      currency,
      sku,
      package_size,
      lead_time_days,
      reorder_point,
      attributes,
      metadata,
      is_active,
      created_at,
      updated_at
    )
    SELECT
      i.item_code,
      i.name,
      i.description,
      i.image_url,
      COALESCE(i.tags, '{}'::text[]),
      COALESCE(i.metadata->>'category', NULL),
      i.unit_of_measure,
      i.base_price,
      i.currency,
      pd.sku,
      pd.package_size,
      pd.lead_time_days,
      pd.reorder_point,
      COALESCE(pd.attributes, '{}'::jsonb),
      COALESCE(i.metadata, '{}'::jsonb),
      i.is_active,
      i.created_at,
      i.updated_at
    FROM catalog_items_legacy AS i
    LEFT JOIN catalog_product_details_legacy AS pd ON pd.item_id = i.id
    WHERE i.item_type = 'product'
    ON CONFLICT (product_id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      tags = EXCLUDED.tags,
      category = EXCLUDED.category,
      unit_of_measure = EXCLUDED.unit_of_measure,
      base_price = EXCLUDED.base_price,
      currency = EXCLUDED.currency,
      sku = EXCLUDED.sku,
      package_size = EXCLUDED.package_size,
      lead_time_days = EXCLUDED.lead_time_days,
      reorder_point = EXCLUDED.reorder_point,
      attributes = EXCLUDED.attributes,
      metadata = EXCLUDED.metadata,
      is_active = EXCLUDED.is_active;

    INSERT INTO catalog_services (
      service_id,
      name,
      description,
      image_url,
      tags,
      category,
      unit_of_measure,
      base_price,
      currency,
      duration_minutes,
      service_window,
      crew_required,
      attributes,
      metadata,
      is_active,
      created_at,
      updated_at
    )
    SELECT
      i.item_code,
      i.name,
      i.description,
      i.image_url,
      COALESCE(i.tags, '{}'::text[]),
      COALESCE(i.metadata->>'category', NULL),
      i.unit_of_measure,
      i.base_price,
      i.currency,
      sd.duration_minutes,
      sd.service_window,
      (sd.attributes->>'crew_required')::INTEGER,
      COALESCE(sd.attributes, '{}'::jsonb),
      COALESCE(i.metadata, '{}'::jsonb),
      i.is_active,
      i.created_at,
      i.updated_at
    FROM catalog_items_legacy AS i
    LEFT JOIN catalog_service_details_legacy AS sd ON sd.item_id = i.id
    WHERE i.item_type = 'service'
    ON CONFLICT (service_id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      tags = EXCLUDED.tags,
      category = EXCLUDED.category,
      unit_of_measure = EXCLUDED.unit_of_measure,
      base_price = EXCLUDED.base_price,
      currency = EXCLUDED.currency,
      duration_minutes = EXCLUDED.duration_minutes,
      service_window = EXCLUDED.service_window,
      crew_required = EXCLUDED.crew_required,
      attributes = EXCLUDED.attributes,
      metadata = EXCLUDED.metadata,
      is_active = EXCLUDED.is_active;
  END IF;
END ;

DROP TABLE IF EXISTS catalog_product_details_legacy;
DROP TABLE IF EXISTS catalog_service_details_legacy;
DROP TABLE IF EXISTS catalog_items_legacy;
DROP TABLE IF EXISTS catalog_product_details;
DROP TABLE IF EXISTS catalog_service_details;

CREATE OR REPLACE VIEW catalog_items AS
SELECT
  NULL::bigint AS id,
  p.product_id AS item_code,
  p.name,
  'product'::text AS item_type,
  p.description,
  p.image_url,
  p.tags,
  p.unit_of_measure,
  p.base_price,
  p.currency,
  p.metadata,
  p.sku,
  p.package_size,
  p.lead_time_days,
  p.reorder_point,
  p.attributes AS product_attributes,
  NULL::integer AS duration_minutes,
  NULL::text AS service_window,
  NULL::jsonb AS service_attributes,
  p.is_active,
  p.category,
  NULL::integer AS crew_required
FROM catalog_products AS p
UNION ALL
SELECT
  NULL::bigint AS id,
  s.service_id AS item_code,
  s.name,
  'service'::text AS item_type,
  s.description,
  s.image_url,
  s.tags,
  s.unit_of_measure,
  s.base_price,
  s.currency,
  s.metadata,
  NULL::text AS sku,
  NULL::text AS package_size,
  NULL::integer AS lead_time_days,
  NULL::integer AS reorder_point,
  NULL::jsonb AS product_attributes,
  s.duration_minutes,
  s.service_window,
  s.attributes AS service_attributes,
  s.is_active,
  s.category,
  s.crew_required
FROM catalog_services AS s;

CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products(category);
CREATE INDEX IF NOT EXISTS idx_catalog_products_tags ON catalog_products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_catalog_services_category ON catalog_services(category);
CREATE INDEX IF NOT EXISTS idx_catalog_services_tags ON catalog_services USING GIN(tags);
