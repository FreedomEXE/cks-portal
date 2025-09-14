/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_warehouse_domain.sql
 * 
 * Description: Domain tables for Warehouse hub - inventory, stock tracking, deliveries
 * Function: Provide foundational entities for Warehouse features and inventory management
 * Importance: Required for inventory management, stock tracking, and delivery coordination
 * Connects to: inventory.repo.ts, deliveries.repo.ts, and warehouse dashboard
 * 
 * Notes: Warehouse-specific business entities focused on inventory management and logistics
 */

-- Warehouse profiles
CREATE TABLE IF NOT EXISTS warehouse_profiles (
    warehouse_id TEXT PRIMARY KEY, -- References users(user_id)
    warehouse_name TEXT NOT NULL,
    facility_type TEXT DEFAULT 'storage' CHECK (facility_type IN ('storage', 'distribution', 'cross_dock', 'fulfillment')),
    total_square_footage INTEGER,
    storage_capacity_units INTEGER,
    loading_docks INTEGER DEFAULT 0,
    office_space INTEGER,
    climate_controlled BOOLEAN DEFAULT FALSE,
    security_level TEXT DEFAULT 'standard' CHECK (security_level IN ('basic', 'standard', 'high', 'maximum')),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    coordinates POINT,
    time_zone TEXT DEFAULT 'America/New_York',
    operating_hours JSONB,
    warehouse_manager_name TEXT,
    warehouse_manager_email TEXT,
    warehouse_manager_phone TEXT,
    emergency_contact TEXT,
    fire_suppression_system TEXT,
    backup_power BOOLEAN DEFAULT FALSE,
    truck_access_height DECIMAL(4,2), -- In feet
    max_weight_capacity INTEGER, -- In pounds
    automation_level TEXT DEFAULT 'manual' CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated')),
    certifications TEXT[], -- ISO, FDA, etc.
    insurance_info JSONB,
    lease_info JSONB,
    cks_manager TEXT, -- References users(user_id)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    item_id SERIAL PRIMARY KEY,
    warehouse_id TEXT REFERENCES warehouse_profiles(warehouse_id),
    sku TEXT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'cleaning_supplies', 'equipment', 'consumables', 'chemicals'
    subcategory TEXT,
    brand TEXT,
    model TEXT,
    unit_of_measure TEXT DEFAULT 'each' CHECK (unit_of_measure IN ('each', 'box', 'case', 'gallon', 'liter', 'pound', 'kilogram')),
    unit_cost DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    current_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    supplier_info JSONB,
    storage_location TEXT, -- Aisle, shelf, bin location
    storage_requirements TEXT, -- Temperature, humidity, special handling
    expiration_tracking BOOLEAN DEFAULT FALSE,
    hazardous_material BOOLEAN DEFAULT FALSE,
    safety_data_sheet_url TEXT,
    weight_per_unit DECIMAL(8,2), -- In pounds
    dimensions JSONB, -- Length, width, height
    barcode TEXT,
    qr_code TEXT,
    last_counted DATE,
    cycle_count_frequency INTEGER DEFAULT 90, -- Days
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'seasonal', 'back_order')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements and transactions
CREATE TABLE IF NOT EXISTS warehouse_stock_movements (
    movement_id SERIAL PRIMARY KEY,
    warehouse_id TEXT REFERENCES warehouse_profiles(warehouse_id),
    item_id INTEGER REFERENCES warehouse_inventory(item_id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'shipment', 'adjustment', 'transfer', 'return', 'damage', 'theft')),
    reference_number TEXT, -- PO number, order number, etc.
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2),
    from_location TEXT,
    to_location TEXT,
    reason_code TEXT,
    notes TEXT,
    performed_by TEXT NOT NULL, -- References users(user_id)
    approved_by TEXT, -- References users(user_id)
    batch_number TEXT,
    expiration_date DATE,
    supplier_info JSONB,
    customer_info JSONB,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery schedules and tracking
CREATE TABLE IF NOT EXISTS warehouse_deliveries (
    delivery_id SERIAL PRIMARY KEY,
    warehouse_id TEXT REFERENCES warehouse_profiles(warehouse_id),
    delivery_number TEXT UNIQUE NOT NULL,
    delivery_type TEXT DEFAULT 'outbound' CHECK (delivery_type IN ('inbound', 'outbound', 'transfer')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'preparing', 'loaded', 'in_transit', 'delivered', 'cancelled', 'returned')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'emergency')),
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_departure_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    carrier_name TEXT,
    carrier_contact TEXT,
    tracking_number TEXT,
    vehicle_info JSONB, -- Vehicle type, license plate, driver info
    route_info JSONB, -- Planned route, stops, distances
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_state TEXT,
    delivery_zip TEXT,
    delivery_contact_name TEXT,
    delivery_contact_phone TEXT,
    special_instructions TEXT,
    loading_dock_assigned TEXT,
    total_weight DECIMAL(10,2),
    total_cubic_feet DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    fuel_cost DECIMAL(8,2),
    mileage INTEGER,
    delivery_confirmation TEXT, -- Signature, photo, etc.
    pod_received BOOLEAN DEFAULT FALSE, -- Proof of delivery
    customer_feedback TEXT,
    issues_encountered TEXT,
    created_by TEXT NOT NULL, -- References users(user_id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery line items
CREATE TABLE IF NOT EXISTS warehouse_delivery_items (
    delivery_item_id SERIAL PRIMARY KEY,
    delivery_id INTEGER REFERENCES warehouse_deliveries(delivery_id),
    item_id INTEGER REFERENCES warehouse_inventory(item_id),
    quantity_requested INTEGER NOT NULL,
    quantity_picked INTEGER,
    quantity_delivered INTEGER,
    unit_price DECIMAL(10,2),
    line_total DECIMAL(10,2),
    storage_location TEXT,
    batch_number TEXT,
    expiration_date DATE,
    condition_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouse cycle counts and audits
CREATE TABLE IF NOT EXISTS warehouse_cycle_counts (
    count_id SERIAL PRIMARY KEY,
    warehouse_id TEXT REFERENCES warehouse_profiles(warehouse_id),
    count_number TEXT UNIQUE NOT NULL,
    count_type TEXT DEFAULT 'cycle' CHECK (count_type IN ('cycle', 'full', 'spot', 'audit')),
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    location_filter TEXT, -- Specific areas to count
    category_filter TEXT, -- Specific categories to count
    total_items_counted INTEGER DEFAULT 0,
    discrepancies_found INTEGER DEFAULT 0,
    total_value_adjustment DECIMAL(12,2) DEFAULT 0,
    count_team TEXT[], -- Array of user IDs
    supervisor TEXT, -- References users(user_id)
    notes TEXT,
    approved_by TEXT, -- References users(user_id)
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cycle count details
CREATE TABLE IF NOT EXISTS warehouse_cycle_count_details (
    detail_id SERIAL PRIMARY KEY,
    count_id INTEGER REFERENCES warehouse_cycle_counts(count_id),
    item_id INTEGER REFERENCES warehouse_inventory(item_id),
    expected_quantity INTEGER NOT NULL,
    actual_quantity INTEGER,
    variance INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
    variance_percentage DECIMAL(5,2),
    unit_cost DECIMAL(10,2),
    value_variance DECIMAL(10,2),
    location TEXT,
    counter_user TEXT, -- References users(user_id)
    count_timestamp TIMESTAMPTZ,
    recount_required BOOLEAN DEFAULT FALSE,
    variance_reason TEXT,
    adjustment_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_profiles_manager ON warehouse_profiles(cks_manager);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_sku ON warehouse_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_category ON warehouse_inventory(category);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_reorder ON warehouse_inventory(warehouse_id) WHERE current_stock <= reorder_point;
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_movements_warehouse ON warehouse_stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_movements_item ON warehouse_stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_movements_date ON warehouse_stock_movements(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_deliveries_warehouse ON warehouse_deliveries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_deliveries_status ON warehouse_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_deliveries_scheduled ON warehouse_deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_delivery_items_delivery ON warehouse_delivery_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_cycle_counts_warehouse ON warehouse_cycle_counts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_cycle_count_details_count ON warehouse_cycle_count_details(count_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_warehouse_profiles_updated_at BEFORE UPDATE ON warehouse_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_inventory_updated_at BEFORE UPDATE ON warehouse_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_deliveries_updated_at BEFORE UPDATE ON warehouse_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_cycle_counts_updated_at BEFORE UPDATE ON warehouse_cycle_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();