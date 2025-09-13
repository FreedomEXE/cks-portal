/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_admin_activity_logs.sql
 * 
 * Description: Creates comprehensive activity logging system for admin actions and system events.
 * Function: Track all admin activities, system changes, and user interactions for audit purposes.
 * Importance: Critical for security auditing, compliance, and system monitoring.
 * Connects to: All admin services, audit reporting, security monitoring.
 * 
 * Notes: Comprehensive logging system with retention policies and search capabilities.
 */

-- Comprehensive system audit log
CREATE TABLE IF NOT EXISTS system_audit_log (
  audit_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'user_action', 'system_event', 'security_event', 'data_change'
  event_category TEXT, -- 'authentication', 'authorization', 'crud', 'configuration', 'maintenance'
  actor_type TEXT, -- 'admin', 'user', 'system'
  actor_id TEXT,
  actor_name TEXT,
  target_type TEXT, -- 'user', 'organization', 'system_config', 'role', etc.
  target_id TEXT,
  target_name TEXT,
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout', etc.
  description TEXT,
  details JSONB,
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  result TEXT, -- 'success', 'failure', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- for automatic cleanup based on retention policy
);

-- User activity tracking across all roles
CREATE TABLE IF NOT EXISTS user_activity_log (
  activity_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_role TEXT,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'page_view', 'action', 'api_call'
  activity_description TEXT,
  page_url TEXT,
  api_endpoint TEXT,
  http_method TEXT,
  request_params JSONB,
  response_status INTEGER,
  duration_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  organization_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES system_users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(org_id) ON DELETE SET NULL
);

-- Security events log
CREATE TABLE IF NOT EXISTS security_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'failed_login', 'account_locked', 'privilege_escalation', 'suspicious_activity'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  user_id TEXT,
  admin_id TEXT,
  description TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  threat_indicators JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES system_users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Data change tracking for sensitive operations
CREATE TABLE IF NOT EXISTS data_change_log (
  change_id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by_type TEXT, -- 'admin', 'user', 'system'
  changed_by_id TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[], -- array of field names that changed
  change_reason TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login attempts tracking
CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_id TEXT PRIMARY KEY,
  user_type TEXT, -- 'admin', 'user'
  username TEXT,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  attempt_result TEXT, -- 'success', 'failed_password', 'account_locked', 'account_not_found'
  failure_reason TEXT,
  geo_location JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
  metric_id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_type TEXT, -- 'counter', 'gauge', 'histogram'
  metric_value NUMERIC,
  tags JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance and regulatory audit trail
CREATE TABLE IF NOT EXISTS compliance_audit (
  compliance_id TEXT PRIMARY KEY,
  regulation_type TEXT, -- 'GDPR', 'CCPA', 'SOX', 'HIPAA', etc.
  compliance_event TEXT,
  entity_type TEXT, -- 'user', 'data', 'system'
  entity_id TEXT,
  admin_id TEXT,
  description TEXT,
  compliance_data JSONB,
  verification_status TEXT, -- 'pending', 'verified', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Indexes for performance and searching
CREATE INDEX IF NOT EXISTS idx_system_audit_log_event_type ON system_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_actor_id ON system_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_target_type ON system_audit_log(target_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_target_id ON system_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_action ON system_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_created_at ON system_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_result ON system_audit_log(result);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_session_id ON user_activity_log(session_id);

CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_admin_id ON security_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_security_events_is_resolved ON security_events(is_resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_data_change_log_table_name ON data_change_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_change_log_record_id ON data_change_log(record_id);
CREATE INDEX IF NOT EXISTS idx_data_change_log_operation ON data_change_log(operation);
CREATE INDEX IF NOT EXISTS idx_data_change_log_changed_by_id ON data_change_log(changed_by_id);
CREATE INDEX IF NOT EXISTS idx_data_change_log_created_at ON data_change_log(created_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_result ON login_attempts(attempt_result);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_collected_at ON system_metrics(collected_at);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_regulation_type ON compliance_audit(regulation_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_entity_type ON compliance_audit(entity_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_entity_id ON compliance_audit(entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_created_at ON compliance_audit(created_at);