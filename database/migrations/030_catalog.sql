-- Catalog domain core tables
CREATE TABLE IF NOT EXISTS catalog_items (
  id BIGSERIAL PRIMARY KEY,
  item_code VARCHAR(32) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product','service')),
  description TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  unit_of_measure TEXT,
  base_price NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_product_details (
  item_id BIGINT PRIMARY KEY REFERENCES catalog_items(id) ON DELETE CASCADE,
  sku TEXT,
  package_size TEXT,
  lead_time_days INTEGER,
  reorder_point INTEGER,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS catalog_service_details (
  item_id BIGINT PRIMARY KEY REFERENCES catalog_items(id) ON DELETE CASCADE,
  duration_minutes INTEGER,
  service_window TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION set_catalog_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalog_items_updated_at ON catalog_items;
CREATE TRIGGER trg_catalog_items_updated_at
BEFORE UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION set_catalog_item_updated_at();

CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(item_type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_tags ON catalog_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON catalog_items(is_active);
