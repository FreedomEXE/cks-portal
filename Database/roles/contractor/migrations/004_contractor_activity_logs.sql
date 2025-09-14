/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_contractor_activity_logs.sql
 * 
 * Description: Activity logging system for tracking contractor actions and work events
 * Function: Track auditable contractor actions and work-related events
 * Importance: Supports audits, performance tracking, and activity UI for contractors
 * Connects to: Services that log actions; Activity UI; activity.repo.ts
 * 
 * Notes: Comprehensive activity tracking system focused on contractor work activities
 */

-- System activity logs - comprehensive tracking for all contractor actions
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users(user_id)
    user_role TEXT NOT NULL, -- 'contractor', 'manager', etc.
    action_type TEXT NOT NULL, -- 'job_accept', 'job_complete', 'schedule_update', etc.
    action_category TEXT NOT NULL, -- 'jobs', 'schedule', 'profile', 'work_log', etc.
    description TEXT NOT NULL,
    entity_type TEXT, -- 'job_assignment', 'work_log', 'availability', etc.
    entity_id TEXT, -- ID of the affected entity
    before_state JSONB, -- State before the action (for updates)
    after_state JSONB, -- State after the action (for updates)
    metadata JSONB, -- Additional context data
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT, -- For tracing requests across services
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER, -- How long the action took
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor-specific activity tracking for performance and compliance
CREATE TABLE IF NOT EXISTS contractor_activity_summary (
    id SERIAL PRIMARY KEY,
    contractor_id TEXT NOT NULL, -- References users(user_id)
    date DATE NOT NULL,
    total_actions INTEGER DEFAULT 0,
    jobs_accepted INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    work_logs_submitted INTEGER DEFAULT 0,
    schedule_updates INTEGER DEFAULT 0,
    profile_updates INTEGER DEFAULT 0,
    equipment_updates INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    hours_worked DECIMAL(6,2) DEFAULT 0,
    miles_traveled INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contractor_id, date)
);

-- Work session tracking - detailed work period logging
CREATE TABLE IF NOT EXISTS contractor_work_sessions (
    session_id SERIAL PRIMARY KEY,
    contractor_id TEXT NOT NULL, -- References users(user_id)
    assignment_id INTEGER, -- References contractor_job_assignments(assignment_id)
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_break_minutes INTEGER DEFAULT 0,
    location_start POINT, -- GPS coordinates at start
    location_end POINT, -- GPS coordinates at end
    travel_distance DECIMAL(8,2), -- Miles traveled
    session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'on_break', 'completed', 'interrupted')),
    interruption_reason TEXT,
    productivity_score DECIMAL(3,2), -- Self-reported productivity (1-5 scale)
    safety_incidents INTEGER DEFAULT 0,
    client_interactions INTEGER DEFAULT 0,
    notes TEXT,
    weather_conditions TEXT,
    equipment_used TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor notifications and alerts
CREATE TABLE IF NOT EXISTS contractor_notifications (
    id SERIAL PRIMARY KEY,
    contractor_id TEXT NOT NULL, -- References users(user_id)
    notification_type TEXT NOT NULL, -- 'job_assignment', 'schedule_reminder', 'payment', 'safety_alert'
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- 'jobs', 'schedule', 'payments', 'safety', 'training'
    related_entity_type TEXT,
    related_entity_id TEXT,
    action_required BOOLEAN DEFAULT FALSE,
    action_deadline TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    delivery_method TEXT DEFAULT 'app' CHECK (delivery_method IN ('app', 'email', 'sms', 'push')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_system_activity_contractor_date ON system_activity(user_id, created_at DESC) WHERE user_role = 'contractor';
CREATE INDEX IF NOT EXISTS idx_system_activity_contractor_category ON system_activity(action_category, created_at DESC) WHERE user_role = 'contractor';
CREATE INDEX IF NOT EXISTS idx_system_activity_contractor_entity ON system_activity(entity_type, entity_id) WHERE user_role = 'contractor';
CREATE INDEX IF NOT EXISTS idx_system_activity_contractor_session ON system_activity(session_id) WHERE user_role = 'contractor';

-- Contractor summary indexes
CREATE INDEX IF NOT EXISTS idx_contractor_activity_summary_contractor_date ON contractor_activity_summary(contractor_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_activity_summary_date ON contractor_activity_summary(date DESC);

-- Work session indexes
CREATE INDEX IF NOT EXISTS idx_contractor_work_sessions_contractor ON contractor_work_sessions(contractor_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_work_sessions_assignment ON contractor_work_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_contractor_work_sessions_status ON contractor_work_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_contractor_work_sessions_date ON contractor_work_sessions(session_start::date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_contractor_notifications_contractor ON contractor_notifications(contractor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_notifications_type ON contractor_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_contractor_notifications_priority ON contractor_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_contractor_notifications_unread ON contractor_notifications(contractor_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_notifications_action_required ON contractor_notifications(contractor_id, action_deadline) WHERE action_required = true;

-- Update trigger for contractor activity summary
CREATE OR REPLACE FUNCTION update_contractor_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary for contractors
    IF NEW.user_role = 'contractor' THEN
        INSERT INTO contractor_activity_summary (
            contractor_id, 
            date, 
            total_actions,
            jobs_accepted,
            jobs_completed,
            work_logs_submitted,
            schedule_updates,
            profile_updates,
            equipment_updates,
            login_count,
            last_activity
        ) VALUES (
            NEW.user_id,
            NEW.created_at::date,
            1,
            CASE WHEN NEW.action_type = 'job_accept' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'job_complete' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'work_log_submit' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'schedule' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'profile' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'equipment' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            NEW.created_at
        ) ON CONFLICT (contractor_id, date) DO UPDATE SET
            total_actions = contractor_activity_summary.total_actions + 1,
            jobs_accepted = contractor_activity_summary.jobs_accepted + 
                CASE WHEN NEW.action_type = 'job_accept' THEN 1 ELSE 0 END,
            jobs_completed = contractor_activity_summary.jobs_completed + 
                CASE WHEN NEW.action_type = 'job_complete' THEN 1 ELSE 0 END,
            work_logs_submitted = contractor_activity_summary.work_logs_submitted + 
                CASE WHEN NEW.action_type = 'work_log_submit' THEN 1 ELSE 0 END,
            schedule_updates = contractor_activity_summary.schedule_updates + 
                CASE WHEN NEW.action_category = 'schedule' THEN 1 ELSE 0 END,
            profile_updates = contractor_activity_summary.profile_updates + 
                CASE WHEN NEW.action_category = 'profile' THEN 1 ELSE 0 END,
            equipment_updates = contractor_activity_summary.equipment_updates + 
                CASE WHEN NEW.action_category = 'equipment' THEN 1 ELSE 0 END,
            login_count = contractor_activity_summary.login_count + 
                CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            last_activity = NEW.created_at,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contractor_activity_summary
    AFTER INSERT ON system_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_contractor_activity_summary();

-- Helper function to log contractor activities
CREATE OR REPLACE FUNCTION log_contractor_activity(
    p_contractor_id TEXT,
    p_action_type TEXT,
    p_action_category TEXT,
    p_description TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    activity_id INTEGER;
BEGIN
    INSERT INTO system_activity (
        user_id, user_role, action_type, action_category, description,
        entity_type, entity_id, metadata, session_id, ip_address, user_agent
    ) VALUES (
        p_contractor_id, 'contractor', p_action_type, p_action_category, p_description,
        p_entity_type, p_entity_id, p_metadata, p_session_id, 
        p_ip_address::INET, p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create contractor notification
CREATE OR REPLACE FUNCTION create_contractor_notification(
    p_contractor_id TEXT,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'normal',
    p_category TEXT DEFAULT NULL,
    p_action_required BOOLEAN DEFAULT FALSE,
    p_action_deadline TIMESTAMPTZ DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO contractor_notifications (
        contractor_id, notification_type, title, message, priority,
        category, action_required, action_deadline, expires_at, metadata
    ) VALUES (
        p_contractor_id, p_notification_type, p_title, p_message, p_priority,
        p_category, p_action_required, p_action_deadline, p_expires_at, p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;