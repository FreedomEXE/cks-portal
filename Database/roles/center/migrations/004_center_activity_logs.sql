/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_center_activity_logs.sql
 * 
 * Description: Activity logging system for tracking center operations and facility events
 * Function: Track auditable center actions and facility-related events
 * Importance: Supports audits, operations tracking, and facility management analytics
 * Connects to: Services that log actions; Activity UI; activity.repo.ts
 * 
 * Notes: Comprehensive activity tracking system focused on center facility operations
 */

-- System activity logs - comprehensive tracking for all center actions
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users(user_id)
    user_role TEXT NOT NULL, -- 'center', 'manager', etc.
    action_type TEXT NOT NULL, -- 'visitor_checkin', 'maintenance_request', 'operations_update', etc.
    action_category TEXT NOT NULL, -- 'visitors', 'maintenance', 'operations', 'security', etc.
    description TEXT NOT NULL,
    entity_type TEXT, -- 'visitor', 'maintenance_request', 'equipment', etc.
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

-- Center-specific activity tracking for operations and compliance
CREATE TABLE IF NOT EXISTS center_activity_summary (
    id SERIAL PRIMARY KEY,
    center_id TEXT NOT NULL, -- References users(user_id)
    date DATE NOT NULL,
    total_actions INTEGER DEFAULT 0,
    visitors_checked_in INTEGER DEFAULT 0,
    maintenance_requests_created INTEGER DEFAULT 0,
    operations_updates INTEGER DEFAULT 0,
    security_incidents INTEGER DEFAULT 0,
    equipment_updates INTEGER DEFAULT 0,
    service_completions INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(center_id, date)
);

-- Center notifications and alerts
CREATE TABLE IF NOT EXISTS center_notifications (
    id SERIAL PRIMARY KEY,
    center_id TEXT NOT NULL, -- References users(user_id)
    notification_type TEXT NOT NULL, -- 'maintenance_due', 'visitor_overstay', 'emergency_alert', etc.
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- 'maintenance', 'security', 'operations', 'compliance'
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
CREATE INDEX IF NOT EXISTS idx_system_activity_center_date ON system_activity(user_id, created_at DESC) WHERE user_role = 'center';
CREATE INDEX IF NOT EXISTS idx_system_activity_center_category ON system_activity(action_category, created_at DESC) WHERE user_role = 'center';
CREATE INDEX IF NOT EXISTS idx_center_activity_summary_center_date ON center_activity_summary(center_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_center_notifications_center ON center_notifications(center_id, created_at DESC);

-- Update trigger for center activity summary
CREATE OR REPLACE FUNCTION update_center_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_role = 'center' THEN
        INSERT INTO center_activity_summary (
            center_id, date, total_actions,
            visitors_checked_in, maintenance_requests_created, operations_updates,
            security_incidents, equipment_updates, service_completions,
            login_count, last_activity
        ) VALUES (
            NEW.user_id, NEW.created_at::date, 1,
            CASE WHEN NEW.action_type = 'visitor_checkin' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'maintenance_request_create' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'operations' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'security' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'equipment' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type LIKE '%service_complete%' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            NEW.created_at
        ) ON CONFLICT (center_id, date) DO UPDATE SET
            total_actions = center_activity_summary.total_actions + 1,
            visitors_checked_in = center_activity_summary.visitors_checked_in + 
                CASE WHEN NEW.action_type = 'visitor_checkin' THEN 1 ELSE 0 END,
            maintenance_requests_created = center_activity_summary.maintenance_requests_created + 
                CASE WHEN NEW.action_type = 'maintenance_request_create' THEN 1 ELSE 0 END,
            operations_updates = center_activity_summary.operations_updates + 
                CASE WHEN NEW.action_category = 'operations' THEN 1 ELSE 0 END,
            security_incidents = center_activity_summary.security_incidents + 
                CASE WHEN NEW.action_category = 'security' THEN 1 ELSE 0 END,
            equipment_updates = center_activity_summary.equipment_updates + 
                CASE WHEN NEW.action_category = 'equipment' THEN 1 ELSE 0 END,
            service_completions = center_activity_summary.service_completions + 
                CASE WHEN NEW.action_type LIKE '%service_complete%' THEN 1 ELSE 0 END,
            login_count = center_activity_summary.login_count + 
                CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            last_activity = NEW.created_at,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_center_activity_summary
    AFTER INSERT ON system_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_center_activity_summary();