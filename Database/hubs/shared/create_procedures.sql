CREATE TABLE IF NOT EXISTS procedures (
  procedure_id VARCHAR(20) PRIMARY KEY,
  center_id VARCHAR(20) NOT NULL,
  procedure_name VARCHAR(255) NOT NULL,
  description TEXT,
  steps TEXT[],
  required_skills TEXT[],
  estimated_duration INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE procedures
  ADD CONSTRAINT IF NOT EXISTS fk_procedures_center
  FOREIGN KEY (center_id) REFERENCES centers(center_id) ON UPDATE CASCADE;

