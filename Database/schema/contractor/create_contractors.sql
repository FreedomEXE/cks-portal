CREATE TABLE IF NOT EXISTS contractors (
  contractor_id VARCHAR(20) PRIMARY KEY,
  cks_manager VARCHAR(20),
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contractors_manager ON contractors(cks_manager);

-- FK: link to managers (on delete → unassign)
ALTER TABLE contractors
  ADD CONSTRAINT IF NOT EXISTS fk_contractors_manager
  FOREIGN KEY (cks_manager) REFERENCES managers(manager_id) ON DELETE SET NULL ON UPDATE CASCADE;

