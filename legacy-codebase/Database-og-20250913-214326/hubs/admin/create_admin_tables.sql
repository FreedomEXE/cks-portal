/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Admin Hub Schema
-- Tables specific to admin operations and system management

-- Admin Users Table (for system administrators)
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id VARCHAR(20) PRIMARY KEY,
    admin_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'support')),
    permissions TEXT[], -- Array of permission strings
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP,
    archived_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether value can be exposed to frontend
    updated_by VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(admin_id)
);

-- System Maintenance Log
CREATE TABLE IF NOT EXISTS maintenance_log (
    log_id SERIAL PRIMARY KEY,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    performed_by VARCHAR(20),
    details JSONB, -- Additional maintenance details
    FOREIGN KEY (performed_by) REFERENCES admin_users(admin_id)
);

-- Audit Trail (for sensitive admin operations)
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(20),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    FOREIGN KEY (changed_by) REFERENCES admin_users(admin_id)
);

-- System Alerts/Notifications
CREATE TABLE IF NOT EXISTS system_alerts (
    alert_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    metadata JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(20),
    resolved_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resolved_by) REFERENCES admin_users(admin_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_archived_at ON admin_users(archived_at);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_public ON system_config(is_public);

CREATE INDEX IF NOT EXISTS idx_maintenance_log_type ON maintenance_log(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_status ON maintenance_log(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_date ON maintenance_log(started_at);

CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_by ON audit_trail(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_at ON audit_trail(changed_at);

CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_expires ON system_alerts(expires_at);