/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- System Activity/Audit Log Migration
-- Creates system-wide activity tracking for admin dashboard

-- System Activity Table
CREATE TABLE IF NOT EXISTS system_activity (
    activity_id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'user_created', 'user_updated', 'user_deleted',
        'support_ticket_created', 'support_ticket_updated',
        'order_created', 'order_approved', 'order_completed',
        'report_created', 'report_resolved',
        'feedback_submitted',
        'system_backup', 'system_maintenance',
        'login_attempt', 'login_success', 'login_failed'
    )),
    actor_id VARCHAR(60), -- who performed the action (null for system actions)
    actor_role VARCHAR(20),
    target_id VARCHAR(60), -- what was affected (user_id, ticket_id, etc.)
    target_type VARCHAR(20), -- 'user', 'ticket', 'order', etc.
    description TEXT NOT NULL,
    metadata JSONB, -- additional data (old/new values, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_activity_type ON system_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_system_activity_created_at ON system_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_system_activity_actor ON system_activity(actor_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_target ON system_activity(target_id, target_type);

-- Function to log system activity
CREATE OR REPLACE FUNCTION log_system_activity(
    p_activity_type VARCHAR(50),
    p_actor_id VARCHAR(60),
    p_actor_role VARCHAR(20),
    p_target_id VARCHAR(60),
    p_target_type VARCHAR(20),
    p_description TEXT,
    p_metadata JSONB
) RETURNS void AS $$
BEGIN
    INSERT INTO system_activity (
        activity_type, actor_id, actor_role, target_id, target_type, description, metadata
    ) VALUES (
        p_activity_type, p_actor_id, p_actor_role, p_target_id, p_target_type, p_description, p_metadata
    );
END;
$$ LANGUAGE plpgsql;