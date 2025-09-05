CREATE TABLE IF NOT EXISTS crew (
  crew_id VARCHAR(20) PRIMARY KEY,
  assigned_center VARCHAR(20),
  crew_name VARCHAR(255),
  skills TEXT[],
  certification_level VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  profile JSONB DEFAULT '{}'::jsonb,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crew_assigned_center ON crew(assigned_center);
ALTER TABLE crew
  ADD CONSTRAINT IF NOT EXISTS fk_crew_assigned_center
  FOREIGN KEY (assigned_center) REFERENCES centers(center_id) ON DELETE SET NULL ON UPDATE CASCADE;

