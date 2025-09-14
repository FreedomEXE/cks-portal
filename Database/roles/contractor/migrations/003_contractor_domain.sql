/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_contractor_domain.sql
 * 
 * Description: Domain tables for Contractor hub - services, jobs, schedules, performance tracking
 * Function: Provide foundational entities for Contractor features and job management
 * Importance: Required for job assignments, service delivery, and performance tracking
 * Connects to: jobs.repo.ts, services.repo.ts, and contractor dashboard KPIs
 * 
 * Notes: Contractor-specific business entities focused on service delivery and job management
 */

-- Contractor profiles - detailed contractor information
CREATE TABLE IF NOT EXISTS contractor_profiles (
    contractor_id TEXT PRIMARY KEY, -- References users(user_id)
    company_name TEXT NOT NULL,
    business_license TEXT,
    insurance_policy TEXT,
    insurance_expiry DATE,
    specializations TEXT[], -- Array of service specializations
    service_radius INTEGER, -- Service radius in miles
    hourly_rate DECIMAL(8,2),
    availability_schedule JSONB, -- Weekly availability schedule
    certifications JSONB, -- Professional certifications
    equipment JSONB, -- Available equipment and tools
    emergency_contact TEXT,
    emergency_phone TEXT,
    bank_account_info JSONB, -- Encrypted payment information
    tax_id TEXT,
    preferred_payment_method TEXT DEFAULT 'direct_deposit' CHECK (preferred_payment_method IN ('direct_deposit', 'check', 'paypal')),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_jobs_completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    cks_manager TEXT, -- References users(user_id) for assigned manager
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor services - services offered by contractors
CREATE TABLE IF NOT EXISTS contractor_services (
    service_id SERIAL PRIMARY KEY,
    contractor_id TEXT REFERENCES contractor_profiles(contractor_id),
    service_name TEXT NOT NULL,
    service_description TEXT,
    service_category TEXT, -- 'cleaning', 'maintenance', 'repair', etc.
    pricing_model TEXT DEFAULT 'hourly' CHECK (pricing_model IN ('hourly', 'fixed', 'per_unit')),
    base_rate DECIMAL(8,2),
    minimum_charge DECIMAL(8,2),
    travel_fee DECIMAL(8,2),
    equipment_required TEXT[],
    estimated_duration INTEGER, -- In minutes
    availability_zones TEXT[], -- Geographic coverage areas
    seasonal_availability JSONB, -- Season-specific availability
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor job assignments - assigned jobs from orders
CREATE TABLE IF NOT EXISTS contractor_job_assignments (
    assignment_id SERIAL PRIMARY KEY,
    job_id INTEGER, -- References service_jobs(job_id) from manager domain
    contractor_id TEXT REFERENCES contractor_profiles(contractor_id),
    assigned_by TEXT NOT NULL, -- References users(user_id) - usually manager
    assignment_date TIMESTAMPTZ DEFAULT NOW(),
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    estimated_hours DECIMAL(6,2),
    hourly_rate DECIMAL(8,2),
    travel_allowance DECIMAL(8,2),
    equipment_provided BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')),
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    declined_reason TEXT,
    completion_notes TEXT,
    contractor_rating INTEGER CHECK (contractor_rating >= 1 AND contractor_rating <= 5),
    customer_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor work logs - detailed work tracking
CREATE TABLE IF NOT EXISTS contractor_work_logs (
    log_id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES contractor_job_assignments(assignment_id),
    contractor_id TEXT REFERENCES contractor_profiles(contractor_id),
    log_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_duration INTEGER DEFAULT 0, -- In minutes
    work_description TEXT,
    materials_used JSONB, -- List of materials and quantities
    equipment_used TEXT[],
    issues_encountered TEXT,
    photos JSONB, -- Before/after photos metadata
    location_coordinates POINT, -- GPS coordinates
    weather_conditions TEXT,
    customer_present BOOLEAN DEFAULT FALSE,
    customer_signature TEXT, -- Digital signature data
    supervisor_notes TEXT,
    billable_hours DECIMAL(6,2),
    travel_time DECIMAL(4,2),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'disputed')),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by TEXT, -- References users(user_id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor availability - schedule management
CREATE TABLE IF NOT EXISTS contractor_availability (
    availability_id SERIAL PRIMARY KEY,
    contractor_id TEXT REFERENCES contractor_profiles(contractor_id),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    availability_type TEXT DEFAULT 'available' CHECK (availability_type IN ('available', 'busy', 'unavailable', 'emergency_only')),
    capacity INTEGER DEFAULT 1, -- Number of concurrent jobs possible
    location_preference TEXT, -- Preferred service area for the day
    transportation_method TEXT,
    notes TEXT,
    recurring_pattern TEXT, -- 'weekly', 'biweekly', 'monthly', null for one-time
    recurring_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contractor_id, date, start_time)
);

-- Contractor performance metrics - tracking and analytics
CREATE TABLE IF NOT EXISTS contractor_performance (
    metric_id SERIAL PRIMARY KEY,
    contractor_id TEXT REFERENCES contractor_profiles(contractor_id),
    metric_period DATE, -- Monthly metrics (first day of month)
    jobs_assigned INTEGER DEFAULT 0,
    jobs_accepted INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_cancelled INTEGER DEFAULT 0,
    total_hours_worked DECIMAL(8,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    on_time_percentage DECIMAL(5,2) DEFAULT 0,
    customer_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    safety_incidents INTEGER DEFAULT 0,
    training_hours DECIMAL(6,2) DEFAULT 0,
    equipment_maintenance_costs DECIMAL(8,2) DEFAULT 0,
    travel_miles INTEGER DEFAULT 0,
    fuel_reimbursements DECIMAL(8,2) DEFAULT 0,
    bonus_earned DECIMAL(8,2) DEFAULT 0,
    penalties_assessed DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contractor_id, metric_period)
);

-- Contractor equipment tracking
CREATE TABLE IF NOT EXISTS contractor_equipment (
    equipment_id SERIAL PRIMARY KEY,
    contractor_id TEXT REFERENCES contractor_profiles(contractor_id),
    equipment_name TEXT NOT NULL,
    equipment_type TEXT, -- 'vehicle', 'tool', 'safety', 'cleaning'
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    current_value DECIMAL(10,2),
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
    maintenance_schedule TEXT, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    last_maintenance DATE,
    next_maintenance DATE,
    warranty_expiry DATE,
    insurance_covered BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'lost', 'stolen')),
    location TEXT, -- Current storage location
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_manager ON contractor_profiles(cks_manager);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_status ON contractor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_rating ON contractor_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_services_contractor ON contractor_services(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_services_category ON contractor_services(service_category);
CREATE INDEX IF NOT EXISTS idx_contractor_job_assignments_contractor ON contractor_job_assignments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_job_assignments_status ON contractor_job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_contractor_job_assignments_scheduled ON contractor_job_assignments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_contractor_work_logs_contractor ON contractor_work_logs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_work_logs_date ON contractor_work_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_availability_contractor_date ON contractor_availability(contractor_id, date);
CREATE INDEX IF NOT EXISTS idx_contractor_performance_contractor_period ON contractor_performance(contractor_id, metric_period DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_equipment_contractor ON contractor_equipment(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_equipment_status ON contractor_equipment(status);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contractor_profiles_updated_at BEFORE UPDATE ON contractor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_services_updated_at BEFORE UPDATE ON contractor_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_job_assignments_updated_at BEFORE UPDATE ON contractor_job_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_work_logs_updated_at BEFORE UPDATE ON contractor_work_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_availability_updated_at BEFORE UPDATE ON contractor_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_performance_updated_at BEFORE UPDATE ON contractor_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_equipment_updated_at BEFORE UPDATE ON contractor_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();