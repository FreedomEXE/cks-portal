/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_center_domain.sql
 * 
 * Description: Domain tables for Center hub - facilities, operations, visitors, maintenance
 * Function: Provide foundational entities for Center features and facility management
 * Importance: Required for facility operations, visitor tracking, and maintenance management
 * Connects to: facility.repo.ts, operations.repo.ts, and center dashboard
 * 
 * Notes: Center-specific business entities focused on facility management and operations
 */

-- Center profiles - detailed center facility information
CREATE TABLE IF NOT EXISTS center_profiles (
    center_id TEXT PRIMARY KEY, -- References users(user_id)
    center_name TEXT NOT NULL,
    facility_type TEXT, -- 'office_building', 'warehouse', 'retail_center', 'mixed_use'
    total_square_footage INTEGER,
    floors INTEGER DEFAULT 1,
    building_year INTEGER,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'USA',
    coordinates POINT, -- GPS coordinates
    time_zone TEXT DEFAULT 'America/New_York',
    operating_hours JSONB, -- Operating hours per day
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    facility_manager_name TEXT,
    facility_manager_email TEXT,
    facility_manager_phone TEXT,
    security_company TEXT,
    security_contact TEXT,
    hvac_system_info JSONB,
    electrical_info JSONB,
    plumbing_info JSONB,
    fire_safety_info JSONB,
    accessibility_features TEXT[],
    parking_spaces INTEGER,
    loading_docks INTEGER,
    elevators INTEGER,
    restrooms INTEGER,
    capacity_limits JSONB, -- Max occupancy per area
    special_requirements TEXT,
    compliance_certifications TEXT[],
    insurance_info JSONB,
    lease_info JSONB,
    utility_providers JSONB,
    cks_manager TEXT, -- References users(user_id) for assigned manager
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'renovation', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Center areas - specific areas within centers
CREATE TABLE IF NOT EXISTS center_areas (
    area_id SERIAL PRIMARY KEY,
    center_id TEXT REFERENCES center_profiles(center_id),
    area_name TEXT NOT NULL,
    area_type TEXT, -- 'office', 'conference_room', 'lobby', 'restroom', 'storage', etc.
    floor_number INTEGER,
    square_footage INTEGER,
    capacity INTEGER,
    access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'restricted', 'private', 'secure')),
    cleaning_frequency TEXT DEFAULT 'daily' CHECK (cleaning_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'as-needed')),
    special_cleaning_requirements TEXT,
    equipment_required TEXT[],
    safety_requirements TEXT,
    temperature_control BOOLEAN DEFAULT FALSE,
    lighting_type TEXT,
    flooring_type TEXT,
    wall_type TEXT,
    furniture_inventory JSONB,
    technology_equipment JSONB,
    maintenance_schedule JSONB,
    last_deep_clean DATE,
    next_scheduled_clean DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'out_of_order', 'renovation', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Center operations - daily operations tracking
CREATE TABLE IF NOT EXISTS center_operations (
    operation_id SERIAL PRIMARY KEY,
    center_id TEXT REFERENCES center_profiles(center_id),
    operation_date DATE NOT NULL,
    opening_time TIME,
    closing_time TIME,
    staff_count INTEGER DEFAULT 0,
    visitor_count INTEGER DEFAULT 0,
    occupancy_percentage DECIMAL(5,2) DEFAULT 0,
    energy_usage_kwh DECIMAL(10,2),
    water_usage_gallons DECIMAL(10,2),
    waste_generated_lbs DECIMAL(8,2),
    recycling_lbs DECIMAL(8,2),
    temperature_avg DECIMAL(4,1),
    humidity_avg DECIMAL(4,1),
    air_quality_index INTEGER,
    security_incidents INTEGER DEFAULT 0,
    maintenance_requests INTEGER DEFAULT 0,
    cleaning_services_performed INTEGER DEFAULT 0,
    supply_deliveries INTEGER DEFAULT 0,
    equipment_downtime_hours DECIMAL(6,2) DEFAULT 0,
    emergency_events INTEGER DEFAULT 0,
    weather_conditions TEXT,
    special_events TEXT,
    notes TEXT,
    shift_supervisor TEXT, -- References users(user_id)
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'emergency', 'maintenance', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(center_id, operation_date)
);

-- Center visitor tracking
CREATE TABLE IF NOT EXISTS center_visitors (
    visit_id SERIAL PRIMARY KEY,
    center_id TEXT REFERENCES center_profiles(center_id),
    visitor_name TEXT,
    visitor_company TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    host_name TEXT,
    host_department TEXT,
    purpose_of_visit TEXT,
    areas_accessed TEXT[],
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    visitor_type TEXT DEFAULT 'guest' CHECK (visitor_type IN ('guest', 'vendor', 'contractor', 'delivery', 'maintenance', 'inspector', 'emergency')),
    access_level TEXT DEFAULT 'escort_required' CHECK (access_level IN ('escort_required', 'supervised', 'unescorted', 'restricted')),
    badge_number TEXT,
    parking_spot TEXT,
    emergency_contact TEXT,
    special_requirements TEXT,
    photo_path TEXT,
    id_verified BOOLEAN DEFAULT FALSE,
    background_check_required BOOLEAN DEFAULT FALSE,
    safety_briefing_completed BOOLEAN DEFAULT FALSE,
    escort_assigned TEXT, -- References users(user_id)
    visit_status TEXT DEFAULT 'active' CHECK (visit_status IN ('scheduled', 'active', 'completed', 'cancelled', 'overstay')),
    security_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Center maintenance requests
CREATE TABLE IF NOT EXISTS center_maintenance_requests (
    request_id SERIAL PRIMARY KEY,
    center_id TEXT REFERENCES center_profiles(center_id),
    area_id INTEGER REFERENCES center_areas(area_id),
    request_number TEXT UNIQUE NOT NULL,
    request_title TEXT NOT NULL,
    description TEXT,
    maintenance_type TEXT, -- 'preventive', 'corrective', 'emergency', 'routine'
    category TEXT, -- 'hvac', 'electrical', 'plumbing', 'structural', 'cleaning', 'security'
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'emergency')),
    urgency_level INTEGER DEFAULT 3 CHECK (urgency_level >= 1 AND urgency_level <= 5),
    safety_concern BOOLEAN DEFAULT FALSE,
    equipment_involved TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    vendor_required BOOLEAN DEFAULT FALSE,
    preferred_vendor TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    completion_deadline TIMESTAMPTZ,
    work_order_number TEXT,
    parts_needed TEXT[],
    tools_required TEXT[],
    safety_requirements TEXT,
    photos_before JSONB,
    photos_after JSONB,
    work_performed TEXT,
    time_spent_hours DECIMAL(6,2),
    materials_used JSONB,
    warranty_info TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    requested_by TEXT NOT NULL, -- References users(user_id)
    assigned_to TEXT, -- References users(user_id) or contractor
    approved_by TEXT, -- References users(user_id)
    completed_by TEXT, -- References users(user_id) or contractor
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled', 'deferred')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Center equipment inventory
CREATE TABLE IF NOT EXISTS center_equipment (
    equipment_id SERIAL PRIMARY KEY,
    center_id TEXT REFERENCES center_profiles(center_id),
    area_id INTEGER REFERENCES center_areas(area_id),
    equipment_name TEXT NOT NULL,
    equipment_type TEXT, -- 'hvac', 'lighting', 'security', 'cleaning', 'office', 'safety'
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    asset_tag TEXT UNIQUE,
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    current_value DECIMAL(10,2),
    warranty_expiry DATE,
    maintenance_contract TEXT,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_replacement')),
    operational_status TEXT DEFAULT 'operational' CHECK (operational_status IN ('operational', 'down', 'maintenance', 'decommissioned')),
    last_service_date DATE,
    next_service_date DATE,
    service_frequency TEXT, -- 'monthly', 'quarterly', 'semi-annual', 'annual'
    energy_rating TEXT,
    specifications JSONB,
    manual_location TEXT,
    vendor_info JSONB,
    safety_requirements TEXT,
    compliance_certifications TEXT[],
    installation_date DATE,
    location_details TEXT,
    usage_hours INTEGER DEFAULT 0,
    maintenance_history JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Center service schedules
CREATE TABLE IF NOT EXISTS center_service_schedules (
    schedule_id SERIAL PRIMARY KEY,
    center_id TEXT REFERENCES center_profiles(center_id),
    area_id INTEGER REFERENCES center_areas(area_id),
    service_type TEXT NOT NULL, -- 'cleaning', 'maintenance', 'inspection', 'security'
    service_name TEXT NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly'
    preferred_day_of_week INTEGER, -- 1=Monday, 7=Sunday
    preferred_time TIME,
    duration_minutes INTEGER,
    contractor_id TEXT, -- References contractor_profiles(contractor_id)
    instructions TEXT,
    supplies_required TEXT[],
    equipment_required TEXT[],
    checklist JSONB,
    last_performed DATE,
    next_scheduled DATE,
    cost_per_service DECIMAL(8,2),
    annual_cost DECIMAL(10,2),
    performance_standards TEXT,
    quality_metrics JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_center_profiles_manager ON center_profiles(cks_manager);
CREATE INDEX IF NOT EXISTS idx_center_profiles_status ON center_profiles(status);
CREATE INDEX IF NOT EXISTS idx_center_areas_center ON center_areas(center_id);
CREATE INDEX IF NOT EXISTS idx_center_areas_type ON center_areas(area_type);
CREATE INDEX IF NOT EXISTS idx_center_operations_center_date ON center_operations(center_id, operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_center_visitors_center ON center_visitors(center_id);
CREATE INDEX IF NOT EXISTS idx_center_visitors_checkin ON center_visitors(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_center_visitors_status ON center_visitors(visit_status);
CREATE INDEX IF NOT EXISTS idx_center_maintenance_center ON center_maintenance_requests(center_id);
CREATE INDEX IF NOT EXISTS idx_center_maintenance_status ON center_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_center_maintenance_priority ON center_maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_center_maintenance_scheduled ON center_maintenance_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_center_equipment_center ON center_equipment(center_id);
CREATE INDEX IF NOT EXISTS idx_center_equipment_area ON center_equipment(area_id);
CREATE INDEX IF NOT EXISTS idx_center_equipment_type ON center_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_center_equipment_status ON center_equipment(operational_status);
CREATE INDEX IF NOT EXISTS idx_center_service_schedules_center ON center_service_schedules(center_id);
CREATE INDEX IF NOT EXISTS idx_center_service_schedules_next ON center_service_schedules(next_scheduled);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_center_profiles_updated_at BEFORE UPDATE ON center_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_center_areas_updated_at BEFORE UPDATE ON center_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_center_operations_updated_at BEFORE UPDATE ON center_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_center_visitors_updated_at BEFORE UPDATE ON center_visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_center_maintenance_requests_updated_at BEFORE UPDATE ON center_maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_center_equipment_updated_at BEFORE UPDATE ON center_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_center_service_schedules_updated_at BEFORE UPDATE ON center_service_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();