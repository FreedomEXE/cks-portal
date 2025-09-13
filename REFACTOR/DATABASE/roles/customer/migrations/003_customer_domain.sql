/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_customer_domain.sql
 * 
 * Description: Domain tables for Customer hub - service requests, locations, billing, feedback
 * Function: Provide foundational entities for Customer features and service management
 * Importance: Required for service requests, order tracking, and customer relationship management
 * Connects to: requests.repo.ts, orders.repo.ts, and customer dashboard
 * 
 * Notes: Customer-specific business entities focused on service requests and relationship management
 */

-- Customer profiles - detailed customer company information
CREATE TABLE IF NOT EXISTS customer_profiles (
    customer_id TEXT PRIMARY KEY, -- References users(user_id)
    company_name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT, -- 'small', 'medium', 'large', 'enterprise'
    primary_contact_name TEXT,
    primary_contact_title TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    billing_contact_name TEXT,
    billing_contact_email TEXT,
    billing_contact_phone TEXT,
    headquarters_address TEXT,
    headquarters_city TEXT,
    headquarters_state TEXT,
    headquarters_zip TEXT,
    time_zone TEXT DEFAULT 'America/New_York',
    business_hours JSONB, -- Operating hours per day
    preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'phone', 'sms', 'app')),
    service_frequency TEXT, -- 'weekly', 'bi-weekly', 'monthly', 'as-needed'
    special_requirements TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended', 'trial', 'cancelled')),
    contract_start_date DATE,
    contract_end_date DATE,
    payment_terms TEXT DEFAULT 'net_30',
    credit_limit DECIMAL(12,2),
    preferred_contractors TEXT[], -- Preferred contractor IDs
    blacklisted_contractors TEXT[], -- Blacklisted contractor IDs
    cks_manager TEXT, -- References users(user_id) for assigned manager
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer locations - service locations for customers
CREATE TABLE IF NOT EXISTS customer_locations (
    location_id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customer_profiles(customer_id),
    location_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'USA',
    location_type TEXT DEFAULT 'office' CHECK (location_type IN ('office', 'warehouse', 'retail', 'factory', 'other')),
    square_footage INTEGER,
    floors INTEGER DEFAULT 1,
    building_access_info TEXT, -- Access codes, key locations, etc.
    parking_info TEXT,
    special_instructions TEXT,
    emergency_contacts JSONB, -- On-site emergency contacts
    service_areas JSONB, -- Specific areas to be serviced
    restricted_areas TEXT[],
    preferred_service_times JSONB, -- Time slots for service
    location_contacts JSONB, -- On-site contacts
    coordinates POINT, -- GPS coordinates
    is_primary BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'temporary')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer service requests - requests for new services
CREATE TABLE IF NOT EXISTS customer_service_requests (
    request_id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customer_profiles(customer_id),
    location_id INTEGER REFERENCES customer_locations(location_id),
    request_number TEXT UNIQUE NOT NULL,
    request_title TEXT NOT NULL,
    request_description TEXT,
    service_category TEXT, -- 'cleaning', 'maintenance', 'repair', 'special'
    service_type TEXT, -- Specific service type within category
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'emergency')),
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    flexible_scheduling BOOLEAN DEFAULT TRUE,
    frequency TEXT DEFAULT 'one-time' CHECK (frequency IN ('one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly')),
    estimated_duration INTEGER, -- In minutes
    special_requirements TEXT,
    access_requirements TEXT,
    equipment_needed TEXT[],
    budget_range_min DECIMAL(10,2),
    budget_range_max DECIMAL(10,2),
    attachments JSONB, -- File references for photos, documents
    requested_contractors TEXT[], -- Specific contractor requests
    avoid_contractors TEXT[], -- Contractors to avoid
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'assigned', 'scheduled', 'completed', 'cancelled', 'rejected')),
    rejection_reason TEXT,
    internal_notes TEXT,
    customer_notes TEXT,
    created_by TEXT REFERENCES customer_profiles(customer_id),
    assigned_to TEXT, -- References users(user_id) - manager handling request
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer order tracking - view of orders from customer perspective
CREATE TABLE IF NOT EXISTS customer_order_tracking (
    tracking_id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customer_profiles(customer_id),
    order_id INTEGER, -- References orders(order_id) from manager domain
    order_number TEXT NOT NULL,
    service_request_id INTEGER REFERENCES customer_service_requests(request_id),
    order_status TEXT NOT NULL,
    service_date DATE,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    assigned_contractor TEXT,
    contractor_contact_info JSONB,
    service_location INTEGER REFERENCES customer_locations(location_id),
    service_description TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completion_percentage INTEGER DEFAULT 0,
    customer_accessible BOOLEAN DEFAULT TRUE, -- Whether customer can view this order
    notifications_sent INTEGER DEFAULT 0,
    last_status_update TIMESTAMPTZ,
    expected_completion TIMESTAMPTZ,
    actual_completion TIMESTAMPTZ,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    customer_feedback TEXT,
    photos_before JSONB,
    photos_after JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer billing and invoicing
CREATE TABLE IF NOT EXISTS customer_billing (
    billing_id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customer_profiles(customer_id),
    invoice_number TEXT UNIQUE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    order_ids INTEGER[], -- Array of order IDs included in this bill
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_rate DECIMAL(5,4) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_terms TEXT DEFAULT 'net_30',
    due_date DATE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'disputed', 'cancelled')),
    payment_date DATE,
    payment_method TEXT,
    payment_reference TEXT,
    late_fee DECIMAL(8,2) DEFAULT 0,
    billing_contact TEXT,
    billing_address JSONB,
    line_items JSONB, -- Detailed breakdown of charges
    notes TEXT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer feedback and ratings
CREATE TABLE IF NOT EXISTS customer_feedback (
    feedback_id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customer_profiles(customer_id),
    order_id INTEGER, -- References orders(order_id)
    contractor_id TEXT, -- References contractor_profiles(contractor_id)
    feedback_type TEXT DEFAULT 'order' CHECK (feedback_type IN ('order', 'contractor', 'service', 'general')),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    feedback_title TEXT,
    feedback_comments TEXT,
    would_recommend BOOLEAN,
    improvements_suggested TEXT,
    compliments TEXT,
    concerns TEXT,
    follow_up_requested BOOLEAN DEFAULT FALSE,
    follow_up_reason TEXT,
    photos JSONB, -- Supporting photos
    is_testimonial BOOLEAN DEFAULT FALSE,
    testimonial_approved BOOLEAN DEFAULT FALSE,
    response_from_management TEXT,
    response_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'disputed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer communication preferences
CREATE TABLE IF NOT EXISTS customer_communication_preferences (
    preference_id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customer_profiles(customer_id),
    communication_type TEXT NOT NULL, -- 'service_reminders', 'billing_notices', 'marketing', etc.
    method TEXT DEFAULT 'email' CHECK (method IN ('email', 'sms', 'phone', 'app', 'none')),
    frequency TEXT DEFAULT 'as_needed' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly', 'as_needed', 'never')),
    time_preference TIME, -- Preferred time for communications
    day_preference TEXT, -- 'weekdays', 'weekends', 'any'
    language TEXT DEFAULT 'en',
    opt_in BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_manager ON customer_profiles(cks_manager);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_status ON customer_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_customer_locations_customer ON customer_locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_locations_primary ON customer_locations(customer_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_customer_service_requests_customer ON customer_service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_requests_status ON customer_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_requests_date ON customer_service_requests(preferred_date);
CREATE INDEX IF NOT EXISTS idx_customer_order_tracking_customer ON customer_order_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_order_tracking_order ON customer_order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_order_tracking_status ON customer_order_tracking(order_status);
CREATE INDEX IF NOT EXISTS idx_customer_billing_customer ON customer_billing(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_billing_status ON customer_billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_customer_billing_due_date ON customer_billing(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_customer ON customer_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_contractor ON customer_feedback(contractor_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_order ON customer_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_rating ON customer_feedback(overall_rating);
CREATE INDEX IF NOT EXISTS idx_customer_communication_customer ON customer_communication_preferences(customer_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_locations_updated_at BEFORE UPDATE ON customer_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_service_requests_updated_at BEFORE UPDATE ON customer_service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_order_tracking_updated_at BEFORE UPDATE ON customer_order_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_billing_updated_at BEFORE UPDATE ON customer_billing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_feedback_updated_at BEFORE UPDATE ON customer_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();