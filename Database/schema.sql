/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- CKS Portal Database Schema
-- Implements smart ID relationship system matching frontend directory structure
-- Chain of command: Admin → Managers → Contractors → Customers → Centers → Crew

-- ============================================
-- CORE ENTITY TABLES
-- ============================================

-- Contractors (Green hub)
CREATE TABLE IF NOT EXISTS contractors (
    contractor_id VARCHAR(20) PRIMARY KEY,
    cks_manager VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    business_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Managers (Blue hub)
CREATE TABLE IF NOT EXISTS managers (
    manager_id VARCHAR(20) PRIMARY KEY,
    manager_name VARCHAR(255) NOT NULL,
    assigned_center VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(50),
    territory VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers (Yellow hub)
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(20) PRIMARY KEY,
    cks_manager VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    service_tier VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Centers (Orange hub)
CREATE TABLE IF NOT EXISTS centers (
    center_id VARCHAR(20) PRIMARY KEY,
    cks_manager VARCHAR(20) NOT NULL,
    center_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(20) NOT NULL,
    contractor_id VARCHAR(20) NOT NULL,
    address TEXT,
    operational_hours VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crew (Red hub)
CREATE TABLE IF NOT EXISTS crew (
    crew_id VARCHAR(20) PRIMARY KEY,
    cks_manager VARCHAR(20), -- nullable; manager assignment happens later
    assigned_center VARCHAR(20), -- nullable to support Unassigned pool
    crew_name VARCHAR(255),
    skills TEXT[], -- PostgreSQL array for multiple skills
    certification_level VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    profile JSONB DEFAULT '{}'::jsonb, -- extended profile fields captured at creation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPORTING ENTITY TABLES
-- ============================================

-- Services (Multi-role access)
CREATE TABLE IF NOT EXISTS services (
    service_id VARCHAR(20) PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    pricing_model VARCHAR(100),
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (Inventory and catalog)
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplies (Inventory management)
CREATE TABLE IF NOT EXISTS supplies (
    supply_id VARCHAR(20) PRIMARY KEY,
    supply_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    unit_cost DECIMAL(10,2),
    unit VARCHAR(50),
    reorder_level INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procedures (Center-specific)
CREATE TABLE IF NOT EXISTS procedures (
    procedure_id VARCHAR(20) PRIMARY KEY,
    center_id VARCHAR(20) NOT NULL,
    procedure_name VARCHAR(255) NOT NULL,
    description TEXT,
    steps TEXT[],
    required_skills TEXT[],
    estimated_duration INTEGER, -- in minutes
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training (Service-specific)
CREATE TABLE IF NOT EXISTS training (
    training_id VARCHAR(20) PRIMARY KEY,
    service_id VARCHAR(20) NOT NULL,
    training_name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_hours INTEGER,
    certification_level VARCHAR(50),
    requirements TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses (Logistics)
CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id VARCHAR(20) PRIMARY KEY,
    warehouse_name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_id VARCHAR(20),
    warehouse_type VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    date_acquired DATE,
    capacity INTEGER,
    current_utilization INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders (Business operations)
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(20) PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    center_id VARCHAR(20),
    service_id VARCHAR(20),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    total_amount DECIMAL(10,2),
    order_kind VARCHAR(20) NOT NULL DEFAULT 'one_time' CHECK (order_kind IN ('one_time','recurring')),
    recurrence_interval VARCHAR(20), -- e.g., weekly, monthly (optional for recurring)
    created_by_role VARCHAR(20),
    created_by_id VARCHAR(60),
    status VARCHAR(30) DEFAULT 'submitted' CHECK (
        status IN (
            'draft',
            'submitted',
            'contractor_pending',
            'contractor_approved',
            'contractor_denied',
            'scheduling_pending',
            'scheduled',
            'in_progress',
            'completed',
            'shipped',
            'delivered',
            'closed',
            'cancelled'
        )
    ),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items (supports both products and services)
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product','service','supply')),
    item_id VARCHAR(40) NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approvals (contractor/manager/admin)
CREATE TABLE IF NOT EXISTS approvals (
    approval_id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    approver_type VARCHAR(20) NOT NULL CHECK (approver_type IN ('contractor','manager','admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
    note TEXT,
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WAREHOUSE MODULE (Inventory, Shipments, Activity)
-- ============================================

-- Expand orders with assigned warehouse for fulfillment
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_warehouse VARCHAR(20);
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

-- ============================================
-- SAMPLE DATA (Warehouse)
-- ============================================

INSERT INTO warehouses (warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status)
VALUES 
  ('WH-000', 'Template Warehouse', '1000 Logistics Drive, Metro City, MC 12345', 'MGR-001', NULL, NULL, NULL, NULL, 50000, 32500, 'active'),
  ('WH-001', 'Central Distribution Hub', '2000 Supply Way, Metro City, MC 12345', 'MGR-001', 'Distribution', '(555) 312-9001', 'wh-001@cks.com', '2024-06-15', 40000, 18000, 'active')
ON CONFLICT (warehouse_id) DO NOTHING;

-- Sample inventory rows (free SKUs for MVP)
INSERT INTO inventory_items (warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, min_stock_level, unit_cost, location_code)
VALUES 
  ('WH-000', 'SUP-001', 'supply', 'SKU-CLN-001', 'Cleaning Solution (1L)', 'Cleaning', 120, 20, 4.50, 'A-01'),
  ('WH-000', 'SUP-002', 'supply', 'SKU-GLV-002', 'Latex Gloves (Box 100)', 'Safety', 75, 30, 6.75, 'A-02'),
  ('WH-000', 'PRD-001', 'product', 'SKU-MOP-001', 'Industrial Mop', 'Equipment', 40, 10, 18.00, 'B-01'),
  ('WH-001', 'SUP-001', 'supply', 'SKU-CLN-001', 'Cleaning Solution (1L)', 'Cleaning', 60, 20, 4.50, 'A-01')
ON CONFLICT (warehouse_id, item_id) DO NOTHING;

-- Service Jobs (scheduling)
CREATE TABLE IF NOT EXISTS service_jobs (
    job_id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    center_id VARCHAR(20) NOT NULL,
    manager_id VARCHAR(20),
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','in_progress','completed','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Assignments (crew assignment)
CREATE TABLE IF NOT EXISTS job_assignments (
    assignment_id SERIAL PRIMARY KEY,
    job_id VARCHAR(20) NOT NULL,
    crew_id VARCHAR(20) NOT NULL,
    role VARCHAR(50),
    hours_estimated INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Centers relationships
ALTER TABLE centers
ADD CONSTRAINT fk_centers_customer 
FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
ADD CONSTRAINT fk_centers_contractor 
FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id),
ADD CONSTRAINT fk_centers_manager 
FOREIGN KEY (cks_manager) REFERENCES managers(manager_id);

-- Crew relationships
ALTER TABLE crew
ADD CONSTRAINT fk_crew_center 
FOREIGN KEY (assigned_center) REFERENCES centers(center_id),
ADD CONSTRAINT fk_crew_manager 
FOREIGN KEY (cks_manager) REFERENCES managers(manager_id);

-- Contractors relationships
ALTER TABLE contractors
ADD CONSTRAINT fk_contractors_manager 
FOREIGN KEY (cks_manager) REFERENCES managers(manager_id);

-- Customers relationships
ALTER TABLE customers
ADD CONSTRAINT fk_customers_manager 
FOREIGN KEY (cks_manager) REFERENCES managers(manager_id);

-- Procedures relationships
ALTER TABLE procedures
ADD CONSTRAINT fk_procedures_center 
FOREIGN KEY (center_id) REFERENCES centers(center_id);

-- Training relationships
ALTER TABLE training
ADD CONSTRAINT fk_training_service 
FOREIGN KEY (service_id) REFERENCES services(service_id);

-- Warehouses relationships
ALTER TABLE warehouses
ADD CONSTRAINT fk_warehouses_manager 
FOREIGN KEY (manager_id) REFERENCES managers(manager_id);

-- Orders relationships
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer 
FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
ADD CONSTRAINT fk_orders_center 
FOREIGN KEY (center_id) REFERENCES centers(center_id),
ADD CONSTRAINT fk_orders_service 
FOREIGN KEY (service_id) REFERENCES services(service_id);

-- Order items relationship
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_order
FOREIGN KEY (order_id) REFERENCES orders(order_id);

-- Approvals relationship
ALTER TABLE approvals
ADD CONSTRAINT fk_approvals_order
FOREIGN KEY (order_id) REFERENCES orders(order_id);

-- Jobs relationships
ALTER TABLE service_jobs
ADD CONSTRAINT fk_jobs_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD CONSTRAINT fk_jobs_center FOREIGN KEY (center_id) REFERENCES centers(center_id),
ADD CONSTRAINT fk_jobs_manager FOREIGN KEY (manager_id) REFERENCES managers(manager_id);

ALTER TABLE job_assignments
ADD CONSTRAINT fk_assign_job FOREIGN KEY (job_id) REFERENCES service_jobs(job_id),
ADD CONSTRAINT fk_assign_crew FOREIGN KEY (crew_id) REFERENCES crew(crew_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_contractors_manager ON contractors(cks_manager);
CREATE INDEX IF NOT EXISTS idx_customers_manager ON customers(cks_manager);
CREATE INDEX IF NOT EXISTS idx_centers_manager ON centers(cks_manager);
CREATE INDEX IF NOT EXISTS idx_centers_customer ON centers(customer_id);
CREATE INDEX IF NOT EXISTS idx_centers_contractor ON centers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_crew_manager ON crew(cks_manager);
CREATE INDEX IF NOT EXISTS idx_crew_center ON crew(assigned_center);

-- Status and date indexes
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_centers_status ON centers(status);
CREATE INDEX IF NOT EXISTS idx_crew_status ON crew(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_approvals_order ON approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_center ON orders(center_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_order ON service_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_assign_job ON job_assignments(job_id);

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample managers first (required for foreign keys)
INSERT INTO managers (manager_id, manager_name, assigned_center, email, status) VALUES
('MGR-001', 'John Manager', 'CEN-001', 'john.manager@cks.com', 'active'),
('MGR-002', 'Sarah Director', 'CEN-002', 'sarah.director@cks.com', 'active')
ON CONFLICT (manager_id) DO NOTHING;

-- Insert sample contractors
INSERT INTO contractors (contractor_id, cks_manager, company_name, contact_person, email, status) VALUES
('CON-001', 'MGR-001', 'Alpha Cleaning Services', 'Mike Alpha', 'mike@alphaclean.com', 'active'),
('CON-002', 'MGR-002', 'Beta Maintenance Co', 'Lisa Beta', 'lisa@betamaint.com', 'active')
ON CONFLICT (contractor_id) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (customer_id, cks_manager, company_name, contact_person, email, status) VALUES
('CUS-001', 'MGR-001', 'Metro Shopping Center', 'Tom Metro', 'tom@metroshopping.com', 'active'),
('CUS-002', 'MGR-002', 'Downtown Office Plaza', 'Anna Downtown', 'anna@downtownplaza.com', 'active')
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample centers
INSERT INTO centers (center_id, cks_manager, center_name, customer_id, contractor_id, address, status) VALUES
('CEN-001', 'MGR-001', 'Metro Main Building', 'CUS-001', 'CON-001', '123 Main St, Metro City', 'active'),
('CEN-002', 'MGR-002', 'Downtown Tower A', 'CUS-002', 'CON-002', '456 Office Blvd, Downtown', 'active')
ON CONFLICT (center_id) DO NOTHING;

-- Insert sample crew
INSERT INTO crew (crew_id, cks_manager, assigned_center, crew_name, skills, status) VALUES
('CRW-001', 'MGR-001', 'CEN-001', 'Team Alpha One', ARRAY['cleaning', 'maintenance'], 'active'),
('CRW-002', 'MGR-002', 'CEN-002', 'Team Beta One', ARRAY['janitorial', 'security'], 'active')
ON CONFLICT (crew_id) DO NOTHING;

-- ============================================
-- CREW REQUIREMENTS (training/procedures readiness)
-- ============================================
CREATE TABLE IF NOT EXISTS crew_requirements (
  requirement_id SERIAL PRIMARY KEY,
  crew_id VARCHAR(20) NOT NULL REFERENCES crew(crew_id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('training','procedure')),
  item_id VARCHAR(40),
  title VARCHAR(255) NOT NULL,
  required BOOLEAN DEFAULT true,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','waived')),
  source VARCHAR(20) DEFAULT 'manager' CHECK (source IN ('manager','admin','center_policy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crew_requirements_crew ON crew_requirements(crew_id);

-- Insert sample services
INSERT INTO services (service_id, service_name, category, description, status) VALUES
('SRV-001', 'Daily Cleaning', 'Cleaning', 'Standard daily cleaning services', 'active'),
('SRV-002', 'Maintenance Check', 'Maintenance', 'Regular maintenance inspections', 'active')
ON CONFLICT (service_id) DO NOTHING;

-- ============================================
-- REPORTS & FEEDBACK (MVP)
-- ============================================

-- Reports: center/customer-visible issues tracking (no pricing)
CREATE TABLE IF NOT EXISTS reports (
  report_id VARCHAR(40) PRIMARY KEY,
  type VARCHAR(40) NOT NULL, -- incident|quality|service_issue|general
  severity VARCHAR(20),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  center_id VARCHAR(40),
  customer_id VARCHAR(40),
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open|in_progress|resolved|closed
  created_by_role VARCHAR(20) NOT NULL,
  created_by_id VARCHAR(60) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_center ON reports(center_id);
CREATE INDEX IF NOT EXISTS idx_reports_customer ON reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Report comments for collaboration
CREATE TABLE IF NOT EXISTS report_comments (
  comment_id SERIAL PRIMARY KEY,
  report_id VARCHAR(40) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  author_role VARCHAR(20) NOT NULL,
  author_id VARCHAR(60) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_report_comments_report ON report_comments(report_id);

-- Feedback: lightweight praise/request/issue
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id VARCHAR(40) PRIMARY KEY,
  kind VARCHAR(20) NOT NULL, -- praise|request|issue
  title VARCHAR(200) NOT NULL,
  message TEXT,
  center_id VARCHAR(40),
  customer_id VARCHAR(40),
  created_by_role VARCHAR(20) NOT NULL,
  created_by_id VARCHAR(60) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_center ON feedback(center_id);
CREATE INDEX IF NOT EXISTS idx_feedback_customer ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
