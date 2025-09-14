/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_manager_activity_logs.sql
 * 
 * Description: Activity logging system for tracking user actions and system events
 * Function: Track auditable user actions and system events for managers
 * Importance: Supports audits, reporting, and activity UI - fixes activity logging issues
 * Connects to: Services that log actions; Activity UI; activity.repo.ts
 * 
 * Notes: Comprehensive activity tracking system with proper indexing and partitioning
 */

-- System activity logs - comprehensive tracking for all user actions
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users(user_id)
    user_role TEXT NOT NULL, -- 'manager', 'contractor', 'customer', etc.
    action_type TEXT NOT NULL, -- 'login', 'logout', 'create_order', 'assign_contractor', etc.
    action_category TEXT NOT NULL, -- 'auth', 'orders', 'contractors', 'dashboard', etc.
    description TEXT NOT NULL,
    entity_type TEXT, -- 'order', 'contractor', 'customer', 'center', etc.
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

-- Manager-specific activity tracking for dashboard and reporting
CREATE TABLE IF NOT EXISTS manager_activity_summary (
    id SERIAL PRIMARY KEY,
    manager_id TEXT NOT NULL, -- References users(user_id)
    date DATE NOT NULL,
    total_actions INTEGER DEFAULT 0,
    orders_created INTEGER DEFAULT 0,
    contractors_assigned INTEGER DEFAULT 0,
    customers_contacted INTEGER DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, date)
);

-- News and notifications tracking
CREATE TABLE IF NOT EXISTS activity_notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- 'news', 'alert', 'reminder', 'system'
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- 'orders', 'contractors', 'system', 'company'
    related_entity_type TEXT,
    related_entity_id TEXT,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_system_activity_user_date ON system_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_activity_role_date ON system_activity(user_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_activity_action_type ON system_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_system_activity_category ON system_activity(action_category);
CREATE INDEX IF NOT EXISTS idx_system_activity_entity ON system_activity(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_session ON system_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_created ON system_activity(created_at DESC);

-- Manager summary indexes
CREATE INDEX IF NOT EXISTS idx_manager_activity_summary_manager_date ON manager_activity_summary(manager_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_manager_activity_summary_date ON manager_activity_summary(date DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_activity_notifications_user ON activity_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_notifications_type ON activity_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_activity_notifications_priority ON activity_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_activity_notifications_unread ON activity_notifications(user_id, read_at) WHERE read_at IS NULL;

-- Update trigger for manager activity summary
CREATE OR REPLACE FUNCTION update_manager_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary for managers
    IF NEW.user_role = 'manager' THEN
        INSERT INTO manager_activity_summary (
            manager_id, 
            date, 
            total_actions,
            orders_created,
            contractors_assigned,
            customers_contacted,
            reports_generated,
            login_count,
            last_activity
        ) VALUES (
            NEW.user_id,
            NEW.created_at::date,
            1,
            CASE WHEN NEW.action_type LIKE '%order%' AND NEW.action_type LIKE '%create%' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type LIKE '%contractor%' AND NEW.action_type LIKE '%assign%' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type LIKE '%customer%' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type LIKE '%report%' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            NEW.created_at
        ) ON CONFLICT (manager_id, date) DO UPDATE SET
            total_actions = manager_activity_summary.total_actions + 1,
            orders_created = manager_activity_summary.orders_created + 
                CASE WHEN NEW.action_type LIKE '%order%' AND NEW.action_type LIKE '%create%' THEN 1 ELSE 0 END,
            contractors_assigned = manager_activity_summary.contractors_assigned + 
                CASE WHEN NEW.action_type LIKE '%contractor%' AND NEW.action_type LIKE '%assign%' THEN 1 ELSE 0 END,
            customers_contacted = manager_activity_summary.customers_contacted + 
                CASE WHEN NEW.action_type LIKE '%customer%' THEN 1 ELSE 0 END,
            reports_generated = manager_activity_summary.reports_generated + 
                CASE WHEN NEW.action_type LIKE '%report%' THEN 1 ELSE 0 END,
            login_count = manager_activity_summary.login_count + 
                CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            last_activity = NEW.created_at,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manager_activity_summary
    AFTER INSERT ON system_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_manager_activity_summary();

-- Helper function to log activities (can be called from application code)
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id TEXT,
    p_user_role TEXT,
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
        p_user_id, p_user_role, p_action_type, p_action_category, p_description,
        p_entity_type, p_entity_id, p_metadata, p_session_id, 
        p_ip_address::INET, p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create partitions for better performance (optional, for high-volume systems)
-- This can be enabled later if activity volume becomes high
-- CREATE TABLE system_activity_y2025 PARTITION OF system_activity 
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
