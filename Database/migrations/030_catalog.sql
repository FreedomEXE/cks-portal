/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 030_catalog.sql
 *
 * Description: Catalog domain - unified services and products catalog
 * Function: Global catalog with categories, services, products, and contractor "My Services"
 * Importance: Central marketplace for all CKS offerings across roles
 * Connects to: Orders, contractor services, customer requests
 */

-- Catalog categories (hierarchical structure)
CREATE TABLE IF NOT EXISTS catalog_categories (
  category_id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES catalog_categories(category_id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services in the catalog
CREATE TABLE IF NOT EXISTS services (
  service_id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES catalog_categories(category_id),

  -- Service specifications
  unit TEXT, -- 'hourly', 'per_job', 'per_sqft', 'fixed', etc.
  price DECIMAL(10,2),

  -- Service attributes
  requires_quote BOOLEAN DEFAULT FALSE,
  is_emergency BOOLEAN DEFAULT FALSE,
  min_notice_hours INTEGER DEFAULT 24,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Products in the catalog
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES catalog_categories(category_id),

  -- Product specifications
  sku TEXT UNIQUE,
  unit TEXT, -- 'each', 'box', 'pallet', 'gallon', etc.
  price DECIMAL(10,2),

  -- Product attributes
  weight_lbs DECIMAL(8,2),
  dimensions JSONB, -- {length, width, height, unit}
  hazmat BOOLEAN DEFAULT FALSE,

  -- Inventory tracking
  track_inventory BOOLEAN DEFAULT FALSE,
  min_stock_level INTEGER,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Contractor "My Services" - links contractors to services they offer
CREATE TABLE IF NOT EXISTS org_services (
  contractor_id TEXT NOT NULL,
  service_id INTEGER NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,

  -- Contractor-specific pricing and terms
  contractor_price DECIMAL(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  lead_time_hours INTEGER DEFAULT 24,
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (contractor_id, service_id)
);

-- Unified catalog view (services + products)
CREATE OR REPLACE VIEW v_catalog_items AS
SELECT
  service_id::TEXT AS item_id,
  'service' AS item_type,
  service_name AS name,
  description,
  category_id,
  unit,
  price,
  status,
  tags,
  metadata,
  created_at,
  updated_at
FROM services
WHERE archived = FALSE

UNION ALL

SELECT
  product_id::TEXT AS item_id,
  'product' AS item_type,
  product_name AS name,
  description,
  category_id,
  unit,
  price,
  status,
  tags,
  metadata,
  created_at,
  updated_at
FROM products
WHERE archived = FALSE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON catalog_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_active ON catalog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_sort ON catalog_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_services_name ON services(LOWER(service_name));
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id, status);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_tags ON services USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_services_created ON services(created_at);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(LOWER(product_name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_org_services_contractor ON org_services(contractor_id);
CREATE INDEX IF NOT EXISTS idx_org_services_service ON org_services(service_id);
CREATE INDEX IF NOT EXISTS idx_org_services_available ON org_services(is_available);

-- Update triggers
CREATE TRIGGER update_catalog_categories_updated_at
  BEFORE UPDATE ON catalog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_services_updated_at
  BEFORE UPDATE ON org_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_services ENABLE ROW LEVEL SECURITY;