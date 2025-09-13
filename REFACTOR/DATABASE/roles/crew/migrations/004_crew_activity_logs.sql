/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_crew_activity_logs.sql
 * 
 * Description: Activity logging system for tracking crew actions and work activities
 * Function: Track auditable crew actions and task-related events
 * Importance: Supports audits, performance tracking, and crew management analytics
 * Connects to: Services that log actions; Activity UI; activity.repo.ts
 * 
 * Notes: Comprehensive activity tracking system focused on crew task activities and coordination
 */

-- System activity logs - comprehensive tracking for all crew actions
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users(user_id)
    user_role TEXT NOT NULL, -- 'crew', 'manager', etc.
    action_type TEXT NOT NULL, -- 'task_start', 'task_complete', 'clock_in', etc.
    action_category TEXT NOT NULL, -- 'tasks', 'schedule', 'equipment', 'time', etc.
    description TEXT NOT NULL,
    entity_type TEXT, -- 'task_assignment', 'schedule', 'equipment_usage', etc.
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

-- Crew-specific activity tracking for performance and coordination
CREATE TABLE IF NOT EXISTS crew_activity_summary (
    id SERIAL PRIMARY KEY,
    crew_id TEXT NOT NULL, -- References users(user_id)
    date DATE NOT NULL,
    total_actions INTEGER DEFAULT 0,
    tasks_started INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    equipment_used INTEGER DEFAULT 0,
    time_entries INTEGER DEFAULT 0,
    schedule_updates INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    hours_worked DECIMAL(6,2) DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crew_id, date)
);

-- Crew notifications and alerts
CREATE TABLE IF NOT EXISTS crew_notifications (
    id SERIAL PRIMARY KEY,
    crew_id TEXT NOT NULL, -- References users(user_id)
    notification_type TEXT NOT NULL, -- 'task_assignment', 'schedule_change', 'safety_alert', etc.
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- 'tasks', 'schedule', 'safety', 'equipment', 'training'
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
CREATE INDEX IF NOT EXISTS idx_system_activity_crew_date ON system_activity(user_id, created_at DESC) WHERE user_role = 'crew';
CREATE INDEX IF NOT EXISTS idx_system_activity_crew_category ON system_activity(action_category, created_at DESC) WHERE user_role = 'crew';
CREATE INDEX IF NOT EXISTS idx_crew_activity_summary_crew_date ON crew_activity_summary(crew_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_crew_notifications_crew ON crew_notifications(crew_id, created_at DESC);

-- Update trigger for crew activity summary
CREATE OR REPLACE FUNCTION update_crew_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary for crew members
    IF NEW.user_role = 'crew' THEN
        INSERT INTO crew_activity_summary (
            crew_id, date, total_actions,
            tasks_started, tasks_completed, equipment_used,
            time_entries, schedule_updates, login_count, last_activity
        ) VALUES (
            NEW.user_id, NEW.created_at::date, 1,
            CASE WHEN NEW.action_type = 'task_start' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'task_complete' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'equipment' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'time' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'schedule' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            NEW.created_at
        ) ON CONFLICT (crew_id, date) DO UPDATE SET
            total_actions = crew_activity_summary.total_actions + 1,
            tasks_started = crew_activity_summary.tasks_started + 
                CASE WHEN NEW.action_type = 'task_start' THEN 1 ELSE 0 END,
            tasks_completed = crew_activity_summary.tasks_completed + 
                CASE WHEN NEW.action_type = 'task_complete' THEN 1 ELSE 0 END,
            equipment_used = crew_activity_summary.equipment_used + 
                CASE WHEN NEW.action_category = 'equipment' THEN 1 ELSE 0 END,
            time_entries = crew_activity_summary.time_entries + 
                CASE WHEN NEW.action_category = 'time' THEN 1 ELSE 0 END,
            schedule_updates = crew_activity_summary.schedule_updates + 
                CASE WHEN NEW.action_category = 'schedule' THEN 1 ELSE 0 END,
            login_count = crew_activity_summary.login_count + 
                CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            last_activity = NEW.created_at,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crew_activity_summary
    AFTER INSERT ON system_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_crew_activity_summary();