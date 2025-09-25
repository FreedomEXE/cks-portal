-- Migration: Create missing tables for dashboard functionality
-- These tables are scaffolds for future product, training, and delivery domains
-- Currently empty to enable dashboard queries without errors

-- Products table
-- Future: Will store product inventory across warehouses and centers
CREATE TABLE IF NOT EXISTS products (
  product_id VARCHAR(64) PRIMARY KEY DEFAULT ('PRD-' || LPAD(nextval('order_product_sequence')::text, 8, '0')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  category VARCHAR(100),

  -- Location assignment
  warehouse_id VARCHAR(64), -- References warehouses(warehouse_id) when FK added
  assigned_center VARCHAR(64), -- References centers(center_id) when FK added

  -- Inventory tracking
  stock_level INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 100,
  unit_of_measure VARCHAR(50) DEFAULT 'unit',

  -- Pricing
  unit_cost NUMERIC(12,2),
  selling_price NUMERIC(12,2),
  currency CHAR(3) DEFAULT 'USD',

  -- Status and metadata
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Archive support (matching other tables)
  archived_at TIMESTAMP,
  archived_by VARCHAR(50),
  archive_reason TEXT,
  deletion_scheduled TIMESTAMP,
  restored_at TIMESTAMP,
  restored_by VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training table
-- Future: Will store training records and certifications for crew members
CREATE TABLE IF NOT EXISTS training (
  training_id SERIAL PRIMARY KEY,
  crew_member_id VARCHAR(64) NOT NULL, -- References crew(crew_id) when FK added
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50),
  category VARCHAR(100),

  -- Training details
  provider VARCHAR(255),
  instructor VARCHAR(255),
  location VARCHAR(255),
  delivery_method VARCHAR(50) CHECK (delivery_method IN ('online', 'in-person', 'hybrid', 'self-paced')),

  -- Scheduling
  scheduled_date DATE,
  start_date DATE,
  completion_date DATE,
  expiry_date DATE,

  -- Progress tracking
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'failed', 'expired')),
  score NUMERIC(5,2),
  passed BOOLEAN,
  certificate_number VARCHAR(100),

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries table
-- Future: Will track deliveries to/from warehouses
CREATE TABLE IF NOT EXISTS deliveries (
  delivery_id VARCHAR(64) PRIMARY KEY DEFAULT ('DLV-' || LPAD(nextval('order_product_sequence')::text, 8, '0')),
  warehouse_id VARCHAR(64) NOT NULL, -- References warehouses(warehouse_id) when FK added
  order_id VARCHAR(64), -- References orders(order_id) when FK added

  -- Delivery details
  delivery_type VARCHAR(50) CHECK (delivery_type IN ('inbound', 'outbound', 'transfer')),
  carrier VARCHAR(255),
  tracking_number VARCHAR(255),

  -- Locations
  origin_location VARCHAR(255),
  destination_location VARCHAR(255),
  destination_contact VARCHAR(255),

  -- Scheduling
  scheduled_date DATE,
  delivery_date DATE,
  actual_delivery_date TIMESTAMPTZ,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-transit', 'delivered', 'cancelled', 'failed', 'returned')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),

  -- Details
  items_count INTEGER DEFAULT 0,
  total_weight NUMERIC(10,2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  notes TEXT,
  signature_required BOOLEAN DEFAULT false,
  proof_of_delivery TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for dashboard query performance
CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(UPPER(warehouse_id));
CREATE INDEX IF NOT EXISTS idx_products_center ON products(UPPER(assigned_center));
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(warehouse_id, stock_level, reorder_point);

CREATE INDEX IF NOT EXISTS idx_training_crew ON training(UPPER(crew_member_id));
CREATE INDEX IF NOT EXISTS idx_training_status ON training(status);
CREATE INDEX IF NOT EXISTS idx_training_dates ON training(scheduled_date, completion_date);

CREATE INDEX IF NOT EXISTS idx_deliveries_warehouse ON deliveries(UPPER(warehouse_id));
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Archive support indexes (matching pattern from other tables)
CREATE INDEX IF NOT EXISTS idx_products_archived_at ON products(archived_at);

-- Update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_updated_at
BEFORE UPDATE ON training
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments for future development
COMMENT ON TABLE products IS 'Product inventory management - scaffold for future implementation';
COMMENT ON TABLE training IS 'Crew training and certification tracking - scaffold for future implementation';
COMMENT ON TABLE deliveries IS 'Warehouse delivery tracking - scaffold for future implementation';

COMMENT ON COLUMN products.warehouse_id IS 'Future FK to warehouses(warehouse_id)';
COMMENT ON COLUMN products.assigned_center IS 'Future FK to centers(center_id)';
COMMENT ON COLUMN training.crew_member_id IS 'Future FK to crew(crew_id)';
COMMENT ON COLUMN deliveries.warehouse_id IS 'Future FK to warehouses(warehouse_id)';
COMMENT ON COLUMN deliveries.order_id IS 'Future FK to orders(order_id)';