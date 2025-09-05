/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- App Users mapping table (Clerk -> CKS role/code)
-- Allows login bootstrap to resolve a Clerk user to a role + code created by Admin

CREATE TABLE IF NOT EXISTS app_users (
  clerk_user_id VARCHAR(80) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','contractor','customer','center','crew','warehouse')),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);

