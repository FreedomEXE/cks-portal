/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 003_crew_domain.sql
 * 
 * Description: Domain tables for Crew hub - task assignments, schedules, equipment usage
 * Function: Provide foundational entities for Crew features and task management
 * Importance: Required for task assignments, schedule management, and team coordination
 * Connects to: tasks.repo.ts, schedule.repo.ts, and crew dashboard
 * 
 * Notes: Crew-specific business entities focused on task execution and team coordination
 */

-- Crew member profiles
CREATE TABLE IF NOT EXISTS crew_profiles (
    crew_id TEXT PRIMARY KEY, -- References users(user_id)
    crew_name TEXT NOT NULL,
    crew_role TEXT, -- 'lead', 'technician', 'helper', 'specialist'
    skill_level TEXT DEFAULT 'entry' CHECK (skill_level IN ('entry', 'intermediate', 'advanced', 'expert')),
    certifications TEXT[],
    specializations TEXT[],
    hourly_rate DECIMAL(8,2),
    hire_date DATE,
    employee_id TEXT UNIQUE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    supervisor_id TEXT, -- References users(user_id)
    team_id TEXT,
    shift_preference TEXT, -- 'day', 'evening', 'night', 'flexible'
    availability_schedule JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'leave', 'terminated')),
    cks_manager TEXT, -- References users(user_id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew task assignments
CREATE TABLE IF NOT EXISTS crew_task_assignments (
    assignment_id SERIAL PRIMARY KEY,
    crew_id TEXT REFERENCES crew_profiles(crew_id),
    job_id INTEGER, -- References service_jobs(job_id) from manager domain
    task_title TEXT NOT NULL,
    task_description TEXT,
    task_type TEXT, -- 'cleaning', 'maintenance', 'inspection', 'setup'
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    estimated_duration INTEGER, -- In minutes
    actual_duration INTEGER,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    location TEXT,
    equipment_needed TEXT[],
    supplies_needed TEXT[],
    special_instructions TEXT,
    safety_requirements TEXT,
    assigned_by TEXT, -- References users(user_id)
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    completion_notes TEXT,
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_check_by TEXT, -- References users(user_id)
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew schedules
CREATE TABLE IF NOT EXISTS crew_schedules (
    schedule_id SERIAL PRIMARY KEY,
    crew_id TEXT REFERENCES crew_profiles(crew_id),
    schedule_date DATE NOT NULL,
    shift_start TIME,
    shift_end TIME,
    break_start TIME,
    break_end TIME,
    location TEXT,
    supervisor TEXT, -- References users(user_id)
    schedule_type TEXT DEFAULT 'regular' CHECK (schedule_type IN ('regular', 'overtime', 'emergency', 'training')),
    notes TEXT,
    approved_by TEXT, -- References users(user_id)
    approved_at TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crew_id, schedule_date, shift_start)
);

-- Crew equipment usage
CREATE TABLE IF NOT EXISTS crew_equipment_usage (
    usage_id SERIAL PRIMARY KEY,
    crew_id TEXT REFERENCES crew_profiles(crew_id),
    equipment_id INTEGER, -- References equipment from various domains
    equipment_name TEXT NOT NULL,
    check_out_time TIMESTAMPTZ NOT NULL,
    check_in_time TIMESTAMPTZ,
    location_used TEXT,
    condition_out TEXT DEFAULT 'good' CHECK (condition_out IN ('excellent', 'good', 'fair', 'poor')),
    condition_in TEXT CHECK (condition_in IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    usage_notes TEXT,
    maintenance_required BOOLEAN DEFAULT FALSE,
    damage_reported TEXT,
    authorized_by TEXT, -- References users(user_id)
    status TEXT DEFAULT 'checked_out' CHECK (status IN ('checked_out', 'in_use', 'checked_in', 'lost', 'damaged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew time tracking
CREATE TABLE IF NOT EXISTS crew_time_logs (
    log_id SERIAL PRIMARY KEY,
    crew_id TEXT REFERENCES crew_profiles(crew_id),
    assignment_id INTEGER REFERENCES crew_task_assignments(assignment_id),
    log_date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    break_start TIME,
    break_end TIME,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    location TEXT,
    supervisor TEXT, -- References users(user_id)
    work_performed TEXT,
    issues_encountered TEXT,
    approved_by TEXT, -- References users(user_id)
    approved_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disputed', 'corrected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew performance metrics
CREATE TABLE IF NOT EXISTS crew_performance (
    metric_id SERIAL PRIMARY KEY,
    crew_id TEXT REFERENCES crew_profiles(crew_id),
    metric_period DATE, -- Monthly metrics (first day of month)
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_on_time INTEGER DEFAULT 0,
    total_hours_worked DECIMAL(8,2) DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    average_quality_rating DECIMAL(3,2) DEFAULT 0,
    equipment_issues INTEGER DEFAULT 0,
    safety_incidents INTEGER DEFAULT 0,
    training_hours DECIMAL(6,2) DEFAULT 0,
    supervisor_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crew_id, metric_period)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crew_profiles_manager ON crew_profiles(cks_manager);
CREATE INDEX IF NOT EXISTS idx_crew_profiles_supervisor ON crew_profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_crew_profiles_team ON crew_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_crew_task_assignments_crew ON crew_task_assignments(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_task_assignments_status ON crew_task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_crew_task_assignments_scheduled ON crew_task_assignments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_crew_date ON crew_schedules(crew_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_crew_equipment_usage_crew ON crew_equipment_usage(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_time_logs_crew_date ON crew_time_logs(crew_id, log_date);
CREATE INDEX IF NOT EXISTS idx_crew_performance_crew_period ON crew_performance(crew_id, metric_period DESC);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crew_profiles_updated_at BEFORE UPDATE ON crew_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_task_assignments_updated_at BEFORE UPDATE ON crew_task_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_schedules_updated_at BEFORE UPDATE ON crew_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_equipment_usage_updated_at BEFORE UPDATE ON crew_equipment_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_time_logs_updated_at BEFORE UPDATE ON crew_time_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_performance_updated_at BEFORE UPDATE ON crew_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();