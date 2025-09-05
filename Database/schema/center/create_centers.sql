CREATE TABLE IF NOT EXISTS centers (
  center_id VARCHAR(20) PRIMARY KEY,
  center_name VARCHAR(255) NOT NULL,
  customer_id VARCHAR(20),
  contractor_id VARCHAR(20),
  address TEXT,
  operational_hours VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_centers_customer ON centers(customer_id);
CREATE INDEX IF NOT EXISTS idx_centers_contractor ON centers(contractor_id);

ALTER TABLE centers
  ADD CONSTRAINT IF NOT EXISTS fk_centers_customer
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT IF NOT EXISTS fk_centers_contractor
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE SET NULL ON UPDATE CASCADE;

