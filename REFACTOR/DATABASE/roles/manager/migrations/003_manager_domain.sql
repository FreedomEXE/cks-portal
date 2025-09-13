/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_manager_domain.sql
 * 
 * Description: Domain tables for Manager hub - centers, customers, contractors, orders, services
 * Function: Provide foundational entities for Manager features and KPIs
 * Importance: Required for orders, services, and dashboard aggregations
 * Connects to: orders.repo.ts, services.repo.ts, and dashboard KPIs
 * 
 * Notes: Core business entities that managers interact with
 */

-- Centers - managed locations
CREATE TABLE IF NOT EXISTS centers (
    center_id TEXT PRIMARY KEY,
    center_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    cks_manager TEXT NOT NULL, -- References users(user_id) for manager assignment
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers - companies that use CKS services
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    cks_manager TEXT NOT NULL, -- References users(user_id) for manager assignment
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors - service providers
CREATE TABLE IF NOT EXISTS contractors (
    contractor_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    license_number TEXT,
    insurance_info JSONB,
    cks_manager TEXT NOT NULL, -- References users(user_id) for manager assignment
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services offered by contractors
CREATE TABLE IF NOT EXISTS services (
    service_id SERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_type TEXT, -- 'hourly', 'per_job', 'per_sqft', etc.
    base_rate DECIMAL(10,2),
    contractor_id TEXT REFERENCES contractors(contractor_id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders - service requests/work orders
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(customer_id),
    center_id TEXT REFERENCES centers(center_id),
    contractor_id TEXT REFERENCES contractors(contractor_id),
    service_id INTEGER REFERENCES services(service_id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    scheduled_date DATE,
    completed_date DATE,
    total_amount DECIMAL(10,2),
    notes TEXT,
    metadata JSONB,
    created_by TEXT NOT NULL, -- References users(user_id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service jobs - detailed job assignments
CREATE TABLE IF NOT EXISTS service_jobs (
    job_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    job_title TEXT NOT NULL,
    job_description TEXT,
    assigned_contractor TEXT REFERENCES contractors(contractor_id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job assignments - crew assignments to jobs
CREATE TABLE IF NOT EXISTS job_assignments (
    assignment_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES service_jobs(job_id),
    assigned_user TEXT NOT NULL, -- References users(user_id)
    role TEXT, -- 'lead', 'technician', 'helper', etc.
    assigned_date DATE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_centers_manager ON centers(cks_manager);
CREATE INDEX IF NOT EXISTS idx_customers_manager ON customers(cks_manager);
CREATE INDEX IF NOT EXISTS idx_contractors_manager ON contractors(cks_manager);
CREATE INDEX IF NOT EXISTS idx_services_contractor ON services(contractor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_center ON orders(center_id);
CREATE INDEX IF NOT EXISTS idx_orders_contractor ON orders(contractor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_service_jobs_order ON service_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_service_jobs_contractor ON service_jobs(assigned_contractor);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_user ON job_assignments(assigned_user);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_jobs_updated_at BEFORE UPDATE ON service_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_assignments_updated_at BEFORE UPDATE ON job_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
