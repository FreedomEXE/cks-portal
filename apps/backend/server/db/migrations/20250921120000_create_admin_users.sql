-- +migrate Up
CREATE TABLE IF NOT EXISTS admin_users (
  clerk_user_id VARCHAR PRIMARY KEY,
  cks_code VARCHAR UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  full_name TEXT,
  email VARCHAR UNIQUE,
  territory VARCHAR,
  phone VARCHAR,
  address TEXT,
  reports_to VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_key ON admin_users (email);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_cks_code_key ON admin_users (cks_code);
CREATE INDEX IF NOT EXISTS admin_users_status_idx ON admin_users (status);
CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users (role);

-- +migrate Down
DROP TABLE IF EXISTS admin_users;
