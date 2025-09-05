CREATE TABLE IF NOT EXISTS customers (
  customer_id VARCHAR(20) PRIMARY KEY,
  contractor_id VARCHAR(20), -- inherit manager via contractor
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  service_tier VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_contractor ON customers(contractor_id);

ALTER TABLE customers
  ADD CONSTRAINT IF NOT EXISTS fk_customers_contractor
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE SET NULL ON UPDATE CASCADE;

