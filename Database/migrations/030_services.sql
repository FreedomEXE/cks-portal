/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 030_services.sql
 *
 * Description: Services domain - service catalog, pricing, and offerings
 * Function: Manage services offered by contractors across the CKS network
 * Importance: Foundation for order creation, pricing, and service delivery
 * Connects to: Orders, contractors, pricing models, service assignments
 */

-- Service categories for organization
CREATE TABLE IF NOT EXISTS service_categories (
  category_id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INTEGER REFERENCES service_categories(category_id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master service catalog
CREATE TABLE IF NOT EXISTS service_catalog (
  service_id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES service_categories(category_id),

  -- Service specifications
  unit_type TEXT NOT NULL CHECK (unit_type IN ('hourly', 'per_job', 'per_sqft', 'per_item', 'per_day', 'fixed')),
  estimated_duration INTERVAL,
  difficulty_level TEXT CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced', 'expert')),
  required_skills JSONB DEFAULT '[]',
  required_certifications JSONB DEFAULT '[]',
  equipment_needed JSONB DEFAULT '[]',

  -- Pricing information
  base_rate DECIMAL(10,2),
  min_rate DECIMAL(10,2),
  max_rate DECIMAL(10,2),
  pricing_factors JSONB, -- Factors that affect pricing

  -- Service attributes
  is_emergency BOOLEAN DEFAULT FALSE,
  requires_quote BOOLEAN DEFAULT FALSE,
  advance_notice_hours INTEGER DEFAULT 24,
  cancellation_policy JSONB,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'deprecated')),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Contractor-specific service offerings
CREATE TABLE IF NOT EXISTS contractor_services (
  contractor_service_id SERIAL PRIMARY KEY,
  contractor_id TEXT NOT NULL REFERENCES contractors(contractor_id),
  service_id INTEGER NOT NULL REFERENCES service_catalog(service_id),

  -- Contractor-specific pricing
  contractor_rate DECIMAL(10,2),
  min_order_amount DECIMAL(10,2),
  pricing_structure JSONB, -- Custom pricing rules

  -- Availability and capacity
  availability JSONB, -- Days/hours available
  capacity_limit INTEGER, -- Max concurrent jobs
  service_area JSONB, -- Geographic coverage
  lead_time_hours INTEGER DEFAULT 24,

  -- Quality and performance
  completion_rate DECIMAL(5,2), -- Percentage of completed jobs
  avg_rating DECIMAL(3,2) CHECK (avg_rating >= 0 AND avg_rating <= 5),
  total_jobs_completed INTEGER DEFAULT 0,

  -- Status and preferences
  is_preferred BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  special_terms JSONB,
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE,

  UNIQUE(contractor_id, service_id)
);

-- Service templates for quick order creation
CREATE TABLE IF NOT EXISTS service_templates (
  template_id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  contractor_id TEXT REFERENCES contractors(contractor_id),
  service_id INTEGER REFERENCES service_catalog(service_id),

  -- Template configuration
  template_config JSONB NOT NULL, -- Pre-filled form data
  estimated_cost DECIMAL(10,2),
  estimated_duration INTERVAL,

  -- Usage and performance
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),

  -- Status
  is_public BOOLEAN DEFAULT FALSE, -- Available to all customers
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Service add-ons and extras
CREATE TABLE IF NOT EXISTS service_addons (
  addon_id SERIAL PRIMARY KEY,
  addon_name TEXT NOT NULL,
  description TEXT,
  service_id INTEGER REFERENCES service_catalog(service_id),

  -- Pricing
  addon_type TEXT CHECK (addon_type IN ('fixed_price', 'percentage', 'per_unit')),
  price DECIMAL(10,2),
  percentage DECIMAL(5,2),

  -- Rules
  is_required BOOLEAN DEFAULT FALSE,
  max_quantity INTEGER DEFAULT 1,
  conditions JSONB, -- When this addon is available/required

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service pricing history for tracking changes
CREATE TABLE IF NOT EXISTS service_pricing_history (
  history_id SERIAL PRIMARY KEY,
  contractor_service_id INTEGER REFERENCES contractor_services(contractor_service_id),
  old_rate DECIMAL(10,2),
  new_rate DECIMAL(10,2),
  change_reason TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  changed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service reviews and ratings
CREATE TABLE IF NOT EXISTS service_reviews (
  review_id SERIAL PRIMARY KEY,
  contractor_service_id INTEGER REFERENCES contractor_services(contractor_service_id),
  customer_id TEXT REFERENCES customers(customer_id),
  order_id INTEGER, -- References orders(order_id) when implemented

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  pros TEXT[],
  cons TEXT[],

  -- Review metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  helpful_votes INTEGER DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON service_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(category_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_status ON service_catalog(status);
CREATE INDEX IF NOT EXISTS idx_service_catalog_unit_type ON service_catalog(unit_type);
CREATE INDEX IF NOT EXISTS idx_service_catalog_emergency ON service_catalog(is_emergency);

CREATE INDEX IF NOT EXISTS idx_contractor_services_contractor ON contractor_services(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_services_service ON contractor_services(service_id);
CREATE INDEX IF NOT EXISTS idx_contractor_services_available ON contractor_services(is_available);
CREATE INDEX IF NOT EXISTS idx_contractor_services_preferred ON contractor_services(is_preferred);
CREATE INDEX IF NOT EXISTS idx_contractor_services_rating ON contractor_services(avg_rating);

CREATE INDEX IF NOT EXISTS idx_service_templates_contractor ON service_templates(contractor_id);
CREATE INDEX IF NOT EXISTS idx_service_templates_service ON service_templates(service_id);
CREATE INDEX IF NOT EXISTS idx_service_templates_public ON service_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_service_templates_active ON service_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_service_addons_service ON service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_active ON service_addons(is_active);

CREATE INDEX IF NOT EXISTS idx_service_pricing_history_contractor_service ON service_pricing_history(contractor_service_id);
CREATE INDEX IF NOT EXISTS idx_service_pricing_history_effective_date ON service_pricing_history(effective_date);

CREATE INDEX IF NOT EXISTS idx_service_reviews_contractor_service ON service_reviews(contractor_service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_customer ON service_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_service_reviews_public ON service_reviews(is_public);

-- Update triggers
CREATE TRIGGER update_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_services_updated_at
  BEFORE UPDATE ON contractor_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_templates_updated_at
  BEFORE UPDATE ON service_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at
  BEFORE UPDATE ON service_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;