CREATE TABLE IF NOT EXISTS services (
  service_id VARCHAR(20) PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  pricing_model VARCHAR(100),
  requirements TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id VARCHAR(20) PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  unit VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplies (
  supply_id VARCHAR(20) PRIMARY KEY,
  supply_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  unit_cost DECIMAL(10,2),
  unit VARCHAR(50),
  reorder_level INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

