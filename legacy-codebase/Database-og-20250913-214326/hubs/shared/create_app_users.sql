CREATE TABLE IF NOT EXISTS app_users (
  email VARCHAR(255) PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  clerk_user_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

