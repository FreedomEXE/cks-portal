/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 020_directory.sql
 *
 * Description: Directory domain - contractors, customers, centers, crew, warehouses
 * Function: Core business entities and their relationships across the CKS ecosystem
 * Importance: Foundation for business operations, assignments, and ecosystem scoping
 * Connects to: Orders, services, user management, ecosystem relationships
 */

-- Contractors - service providers in the CKS network
CREATE TABLE IF NOT EXISTS contractors (
  contractor_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email CITEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  license_number TEXT,
  insurance_info JSONB,

  -- CKS network relationships
  cks_manager TEXT, -- References users(user_id) for manager assignment

  -- Business information
  business_type TEXT,
  specialties TEXT[],
  service_areas TEXT[],
  capacity_info JSONB,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'archived')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Customers - companies that use CKS services
CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email CITEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- CKS network relationships
  cks_manager TEXT, -- References users(user_id) for manager assignment
  preferred_contractor TEXT, -- References contractors(contractor_id)

  -- Business information
  industry TEXT,
  company_size TEXT,
  billing_info JSONB,
  preferences JSONB,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'archived')),
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('basic', 'standard', 'premium', 'enterprise')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Centers - customer locations/facilities
CREATE TABLE IF NOT EXISTS centers (
  center_id TEXT PRIMARY KEY,
  center_name TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),

  -- Location information
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email CITEXT,

  -- CKS network relationships
  cks_manager TEXT, -- References users(user_id) for manager assignment
  primary_contractor TEXT, -- References contractors(contractor_id)

  -- Facility information
  facility_type TEXT,
  square_footage INTEGER,
  operating_hours JSONB,
  special_requirements JSONB,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'archived')),
  accessibility_info JSONB,
  emergency_contacts JSONB,
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Crew - field workers and technicians
CREATE TABLE IF NOT EXISTS crew (
  crew_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email CITEXT,
  phone TEXT,

  -- Employment information
  contractor_id TEXT NOT NULL REFERENCES contractors(contractor_id),
  employee_id TEXT,
  position TEXT,
  skill_level TEXT CHECK (skill_level IN ('trainee', 'junior', 'senior', 'lead', 'specialist')),

  -- Certifications and skills
  certifications JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  specialties TEXT[],

  -- Work information
  hourly_rate DECIMAL(8,2),
  availability JSONB,
  work_schedule JSONB,
  equipment JSONB,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated', 'archived')),
  hire_date DATE,
  termination_date DATE,
  background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'cleared', 'flagged')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Warehouses - inventory and logistics hubs
CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id TEXT PRIMARY KEY,
  warehouse_name TEXT NOT NULL,

  -- Location information
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email CITEXT,

  -- CKS network relationships
  cks_manager TEXT, -- References users(user_id) for manager assignment
  contractor_id TEXT, -- References contractors(contractor_id) if contractor-owned

  -- Facility information
  warehouse_type TEXT CHECK (warehouse_type IN ('distribution', 'storage', 'fulfillment', 'mixed')),
  total_square_footage INTEGER,
  storage_capacity JSONB,
  dock_doors INTEGER,
  operating_hours JSONB,

  -- Capabilities
  capabilities JSONB DEFAULT '[]', -- ['climate_controlled', 'hazmat', 'refrigerated', etc.]
  equipment JSONB DEFAULT '[]',

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'archived')),
  certification_info JSONB,
  insurance_info JSONB,
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Managers - CKS network managers (for completeness)
CREATE TABLE IF NOT EXISTS managers (
  manager_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email CITEXT,
  phone TEXT,

  -- Management information
  territory TEXT[],
  specialization TEXT[],
  max_contractors INTEGER,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  hire_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  archived BOOLEAN DEFAULT FALSE
);

-- Relationship tables for many-to-many relationships

-- Contractor-Customer relationships (contractors can serve multiple customers)
CREATE TABLE IF NOT EXISTS contractor_customer_relationships (
  contractor_id TEXT REFERENCES contractors(contractor_id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'approved' CHECK (relationship_type IN ('pending', 'approved', 'preferred', 'suspended')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contractor_id, customer_id)
);

-- Crew assignments to centers (crew can be assigned to multiple centers)
CREATE TABLE IF NOT EXISTS crew_center_assignments (
  crew_id TEXT REFERENCES crew(crew_id) ON DELETE CASCADE,
  center_id TEXT REFERENCES centers(center_id) ON DELETE CASCADE,
  assignment_type TEXT DEFAULT 'regular' CHECK (assignment_type IN ('regular', 'temporary', 'on_call')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (crew_id, center_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractors_manager ON contractors(cks_manager);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_rating ON contractors(rating);
CREATE INDEX IF NOT EXISTS idx_contractors_location ON contractors(state, city);

CREATE INDEX IF NOT EXISTS idx_customers_manager ON customers(cks_manager);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);

CREATE INDEX IF NOT EXISTS idx_centers_customer ON centers(customer_id);
CREATE INDEX IF NOT EXISTS idx_centers_manager ON centers(cks_manager);
CREATE INDEX IF NOT EXISTS idx_centers_contractor ON centers(primary_contractor);
CREATE INDEX IF NOT EXISTS idx_centers_status ON centers(status);
CREATE INDEX IF NOT EXISTS idx_centers_location ON centers(state, city);

CREATE INDEX IF NOT EXISTS idx_crew_contractor ON crew(contractor_id);
CREATE INDEX IF NOT EXISTS idx_crew_status ON crew(status);
CREATE INDEX IF NOT EXISTS idx_crew_skill_level ON crew(skill_level);

CREATE INDEX IF NOT EXISTS idx_warehouses_manager ON warehouses(cks_manager);
CREATE INDEX IF NOT EXISTS idx_warehouses_contractor ON warehouses(contractor_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(state, city);

CREATE INDEX IF NOT EXISTS idx_managers_status ON managers(status);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_contractor_customer_rel_type ON contractor_customer_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_crew_center_assignment_type ON crew_center_assignments(assignment_type);

-- Update triggers
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_centers_updated_at
  BEFORE UPDATE ON centers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_updated_at
  BEFORE UPDATE ON crew
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_managers_updated_at
  BEFORE UPDATE ON managers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_customer_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_center_assignments ENABLE ROW LEVEL SECURITY;