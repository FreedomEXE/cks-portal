/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Warehouse Hub Enhancement Migration
-- Adds inventory management and warehouse operations tables

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id VARCHAR(20) PRIMARY KEY,
    warehouse_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    unit_cost DECIMAL(10,2),
    last_received_date TIMESTAMP,
    last_shipped_date TIMESTAMP,
    location_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Warehouse Shipments Table
CREATE TABLE IF NOT EXISTS warehouse_shipments (
    shipment_id VARCHAR(20) PRIMARY KEY,
    warehouse_id VARCHAR(20) NOT NULL,
    order_id VARCHAR(20),
    shipment_type VARCHAR(20) CHECK (shipment_type IN ('inbound', 'outbound')),
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    origin_address TEXT,
    destination_address TEXT,
    shipment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled', 'returned')),
    total_weight DECIMAL(10,2),
    total_value DECIMAL(10,2),
    notes TEXT,
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Shipment Items Table
CREATE TABLE IF NOT EXISTS shipment_items (
    shipment_item_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(20) NOT NULL,
    item_id VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    condition_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES warehouse_shipments(shipment_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id)
);

-- Warehouse Staff Table
CREATE TABLE IF NOT EXISTS warehouse_staff (
    staff_id VARCHAR(20) PRIMARY KEY,
    warehouse_id VARCHAR(20) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    shift_schedule VARCHAR(100),
    certifications TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

-- Warehouse Activity Log Table
CREATE TABLE IF NOT EXISTS warehouse_activity_log (
    log_id SERIAL PRIMARY KEY,
    warehouse_id VARCHAR(20) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(20),
    shipment_id VARCHAR(20),
    staff_id VARCHAR(20),
    quantity_change INTEGER,
    description TEXT,
    activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id),
    FOREIGN KEY (shipment_id) REFERENCES warehouse_shipments(shipment_id),
    FOREIGN KEY (staff_id) REFERENCES warehouse_staff(staff_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_warehouse_id ON inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(warehouse_id, quantity_available) 
    WHERE quantity_available <= min_stock_level;

CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_warehouse_id ON warehouse_shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_status ON warehouse_shipments(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_date ON warehouse_shipments(shipment_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_tracking ON warehouse_shipments(tracking_number);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_item_id ON shipment_items(item_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_staff_warehouse_id ON warehouse_staff(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_staff_status ON warehouse_staff(status);

CREATE INDEX IF NOT EXISTS idx_warehouse_activity_log_warehouse_id ON warehouse_activity_log(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_log_timestamp ON warehouse_activity_log(activity_timestamp);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_log_type ON warehouse_activity_log(activity_type);