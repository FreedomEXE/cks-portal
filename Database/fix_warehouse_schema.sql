-- Fix warehouse schema to match expected structure
-- Work with existing warehouses table and add missing columns

-- First update the warehouses table to match expected schema
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(255);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS manager_id VARCHAR(20);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS warehouse_type VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS date_acquired DATE;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS current_utilization INTEGER;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update warehouse_name from name column if it exists and warehouse_name is null
UPDATE warehouses SET warehouse_name = name WHERE warehouse_name IS NULL AND name IS NOT NULL;

-- Update manager_id from manager column if it exists and manager_id is null
UPDATE warehouses SET manager_id = manager WHERE manager_id IS NULL AND manager IS NOT NULL;

-- Insert sample warehouses if they don't exist
INSERT INTO warehouses (warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status)
VALUES 
  ('WH-000', 'Template Warehouse', '1000 Logistics Drive, Metro City, MC 12345', 'MGR-001', NULL, NULL, NULL, NULL, 50000, 32500, 'active'),
  ('WH-001', 'Central Distribution Hub', '2000 Supply Way, Metro City, MC 12345', 'MGR-001', 'Distribution', '(555) 312-9001', 'wh-001@cks.com', '2024-06-15', 40000, 18000, 'active')
ON CONFLICT (warehouse_id) DO UPDATE SET
  warehouse_name = EXCLUDED.warehouse_name,
  manager_id = EXCLUDED.manager_id,
  capacity = EXCLUDED.capacity,
  current_utilization = EXCLUDED.current_utilization,
  status = EXCLUDED.status;

-- Expand orders with assigned warehouse for fulfillment
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_warehouse VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_warehouse ON orders(assigned_warehouse);

-- Per-warehouse inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  warehouse_id VARCHAR(20) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  item_id VARCHAR(40) NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product','supply')),
  sku VARCHAR(60),
  item_name VARCHAR(255),
  category VARCHAR(100),
  quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_available INTEGER GENERATED ALWAYS AS (GREATEST(quantity_on_hand - quantity_reserved, 0)) STORED,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit_cost DECIMAL(10,2),
  location_code VARCHAR(60),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  last_received_date TIMESTAMP,
  last_shipped_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (warehouse_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);

-- Shipments
CREATE TABLE IF NOT EXISTS warehouse_shipments (
  shipment_id VARCHAR(40) PRIMARY KEY,
  warehouse_id VARCHAR(20) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  shipment_type VARCHAR(20) NOT NULL CHECK (shipment_type IN ('inbound','outbound')),
  carrier VARCHAR(60),
  tracking_number VARCHAR(80),
  origin_address TEXT,
  destination_address TEXT,
  shipment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_transit','delivered','cancelled')),
  total_weight DECIMAL(10,2),
  total_value DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shipments_warehouse ON warehouse_shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON warehouse_shipments(status);

CREATE TABLE IF NOT EXISTS shipment_items (
  shipment_item_id SERIAL PRIMARY KEY,
  shipment_id VARCHAR(40) NOT NULL REFERENCES warehouse_shipments(shipment_id) ON DELETE CASCADE,
  order_id VARCHAR(20),
  item_id VARCHAR(40) NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product','supply')),
  sku VARCHAR(60),
  item_name VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2)
);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);

-- Staff (optional for MVP)
CREATE TABLE IF NOT EXISTS warehouse_staff (
  staff_id VARCHAR(40) PRIMARY KEY,
  warehouse_id VARCHAR(20) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  staff_name VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  shift_schedule VARCHAR(100),
  certifications TEXT[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_warehouse_staff_warehouse ON warehouse_staff(warehouse_id);

-- Activity log
CREATE TABLE IF NOT EXISTS warehouse_activity_log (
  log_id SERIAL PRIMARY KEY,
  warehouse_id VARCHAR(20) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('stock_adjustment','receipt','pick','ship')),
  item_id VARCHAR(40),
  quantity_change INTEGER,
  description TEXT,
  staff_id VARCHAR(40),
  shipment_id VARCHAR(40),
  activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_warehouse ON warehouse_activity_log(warehouse_id);

-- Sample inventory rows (free SKUs for MVP)
INSERT INTO inventory_items (warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, min_stock_level, unit_cost, location_code)
VALUES 
  ('WH-000', 'SUP-001', 'supply', 'SKU-CLN-001', 'Cleaning Solution (1L)', 'Cleaning', 120, 20, 4.50, 'A-01'),
  ('WH-000', 'SUP-002', 'supply', 'SKU-GLV-002', 'Latex Gloves (Box 100)', 'Safety', 75, 30, 6.75, 'A-02'),
  ('WH-000', 'PRD-001', 'product', 'SKU-MOP-001', 'Industrial Mop', 'Equipment', 40, 10, 18.00, 'B-01'),
  ('WH-001', 'SUP-001', 'supply', 'SKU-CLN-001', 'Cleaning Solution (1L)', 'Cleaning', 60, 20, 4.50, 'A-01')
ON CONFLICT (warehouse_id, item_id) DO NOTHING;