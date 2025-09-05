CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id VARCHAR(20) PRIMARY KEY,
  warehouse_name VARCHAR(255) NOT NULL,
  address TEXT,
  manager_name VARCHAR(255), -- warehouse manager (not Managers table)
  manager_email VARCHAR(255),
  manager_phone VARCHAR(50),
  warehouse_type VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(255),
  date_acquired DATE,
  capacity INTEGER,
  current_utilization INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);

