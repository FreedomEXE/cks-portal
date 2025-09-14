/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 010_activity_logs.sql
 *
 * Description: System activity logging and audit trail
 * Function: Track all user actions and system events across all roles
 * Importance: Compliance, debugging, security monitoring, and user activity tracking
 * Connects to: All backend operations, audit middleware, dashboard activity feeds
 */

-- System activity logs table
CREATE TABLE IF NOT EXISTS system_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT, -- May be NULL for system events
  user_role TEXT,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL, -- 'authentication', 'business', 'system', 'security', etc.
  description TEXT NOT NULL,
  entity_type TEXT, -- 'user', 'order', 'service', 'contractor', etc.
  entity_id TEXT,   -- ID of the affected entity
  metadata JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log categories for easier querying
CREATE TABLE IF NOT EXISTS activity_categories (
  category_code TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  description TEXT,
  retention_days INTEGER DEFAULT 365,
  is_sensitive BOOLEAN DEFAULT FALSE
);

-- Pre-defined activity categories
INSERT INTO activity_categories (category_code, category_name, description, retention_days, is_sensitive) VALUES
('authentication', 'Authentication', 'User login, logout, and auth events', 90, true),
('authorization', 'Authorization', 'Permission checks and access control', 90, true),
('business', 'Business Operations', 'Core business activities like order creation', 2555, false),
('data', 'Data Operations', 'CRUD operations on business entities', 365, false),
('system', 'System Operations', 'System maintenance and administrative tasks', 180, false),
('security', 'Security Events', 'Security-related events and alerts', 2555, true),
('api', 'API Access', 'API calls and programmatic access', 30, false),
('ui', 'User Interface', 'UI interactions and user experience events', 30, false)
ON CONFLICT (category_code) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_activity_user_id ON system_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_user_role ON system_activity(user_role);
CREATE INDEX IF NOT EXISTS idx_system_activity_action_type ON system_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_system_activity_action_category ON system_activity(action_category);
CREATE INDEX IF NOT EXISTS idx_system_activity_entity_type ON system_activity(entity_type);
CREATE INDEX IF NOT EXISTS idx_system_activity_entity_id ON system_activity(entity_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_created_at ON system_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_system_activity_session_id ON system_activity(session_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_activity_user_category ON system_activity(user_id, action_category);
CREATE INDEX IF NOT EXISTS idx_system_activity_user_created ON system_activity(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_system_activity_entity_created ON system_activity(entity_type, entity_id, created_at);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_activity_recent ON system_activity(created_at) WHERE created_at > NOW() - INTERVAL '7 days';
CREATE INDEX IF NOT EXISTS idx_system_activity_sensitive ON system_activity(created_at, action_category) WHERE action_category IN ('authentication', 'authorization', 'security');

-- Enable Row Level Security
ALTER TABLE system_activity ENABLE ROW LEVEL SECURITY;

-- Function to log activity (called by backend)
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
)
RETURNS BIGINT AS $$
DECLARE
  activity_id BIGINT;
BEGIN
  INSERT INTO system_activity (
    user_id, user_role, action_type, action_category, description,
    entity_type, entity_id, metadata, session_id, ip_address, user_agent
  ) VALUES (
    p_user_id, p_user_role, p_action_type, p_action_category, p_description,
    p_entity_type, p_entity_id, p_metadata, p_session_id, p_ip_address::INET, p_user_agent
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity summary for dashboard
CREATE OR REPLACE FUNCTION get_activity_summary(
  p_user_id TEXT DEFAULT NULL,
  p_role_scope TEXT DEFAULT 'entity', -- 'global', 'ecosystem', 'entity'
  p_limit INTEGER DEFAULT 10,
  p_category TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  id BIGINT,
  user_id TEXT,
  user_role TEXT,
  action_type TEXT,
  action_category TEXT,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id, sa.user_id, sa.user_role, sa.action_type, sa.action_category,
    sa.description, sa.entity_type, sa.entity_id, sa.created_at, sa.metadata
  FROM system_activity sa
  WHERE
    sa.created_at > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_category IS NULL OR sa.action_category = p_category)
    AND (
      p_role_scope = 'global' OR
      (p_role_scope = 'entity' AND sa.user_id = p_user_id) OR
      (p_role_scope = 'ecosystem' AND (
        sa.user_id = p_user_id OR
        sa.user_id IN (
          -- This would need ecosystem relationship logic
          SELECT user_id FROM users WHERE role_code != 'admin' AND role_code != 'manager'
          -- Add actual ecosystem relationship queries here
        )
      ))
    )
  ORDER BY sa.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old activity logs based on retention policies
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER := 0;
  category_record RECORD;
BEGIN
  FOR category_record IN
    SELECT category_code, retention_days FROM activity_categories
  LOOP
    DELETE FROM system_activity
    WHERE action_category = category_record.category_code
      AND created_at < NOW() - (category_record.retention_days || ' days')::INTERVAL;

    cleaned_count := cleaned_count + FOUND;
  END LOOP;

  -- Log the cleanup operation
  PERFORM log_activity(
    'SYSTEM',
    'system',
    'cleanup_activity_logs',
    'system',
    'Cleaned up ' || cleaned_count || ' old activity log entries',
    'system',
    'activity_cleanup',
    jsonb_build_object('cleaned_count', cleaned_count)
  );

  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity statistics
CREATE OR REPLACE FUNCTION get_activity_stats(
  p_user_id TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_activities BIGINT,
  by_category JSONB,
  by_day JSONB,
  top_actions JSONB
) AS $$
DECLARE
  result_row RECORD;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO result_row
  FROM system_activity sa
  WHERE sa.created_at > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_user_id IS NULL OR sa.user_id = p_user_id);

  total_activities := result_row.count;

  -- Get by category
  SELECT jsonb_object_agg(action_category, count) INTO by_category
  FROM (
    SELECT action_category, COUNT(*) as count
    FROM system_activity sa
    WHERE sa.created_at > NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_user_id IS NULL OR sa.user_id = p_user_id)
    GROUP BY action_category
    ORDER BY count DESC
  ) t;

  -- Get by day
  SELECT jsonb_object_agg(activity_date, count) INTO by_day
  FROM (
    SELECT DATE(created_at) as activity_date, COUNT(*) as count
    FROM system_activity sa
    WHERE sa.created_at > NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_user_id IS NULL OR sa.user_id = p_user_id)
    GROUP BY DATE(created_at)
    ORDER BY activity_date DESC
  ) t;

  -- Get top actions
  SELECT jsonb_agg(jsonb_build_object('action_type', action_type, 'count', count)) INTO top_actions
  FROM (
    SELECT action_type, COUNT(*) as count
    FROM system_activity sa
    WHERE sa.created_at > NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_user_id IS NULL OR sa.user_id = p_user_id)
    GROUP BY action_type
    ORDER BY count DESC
    LIMIT 10
  ) t;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;