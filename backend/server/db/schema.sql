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
    cks_manager VARCHAR(20) NOT NULL,
    assigned_center VARCHAR(20) NOT NULL,
    crew_name VARCHAR(255),
    skills TEXT[], -- PostgreSQL array for multiple skills
    certification_level VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Insert sample services
INSERT INTO services (service_id, service_name, category, description, status) VALUES
('SRV-001', 'Daily Cleaning', 'Cleaning', 'Standard daily cleaning services', 'active'),
('SRV-002', 'Maintenance Check', 'Maintenance', 'Regular maintenance inspections', 'active')
ON CONFLICT (service_id) DO NOTHING;