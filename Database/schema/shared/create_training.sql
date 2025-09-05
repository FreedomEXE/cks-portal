CREATE TABLE IF NOT EXISTS training (
  training_id VARCHAR(20) PRIMARY KEY,
  service_id VARCHAR(20) NOT NULL,
  training_name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_hours INTEGER,
  certification_level VARCHAR(50),
  requirements TEXT[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE training
  ADD CONSTRAINT IF NOT EXISTS fk_training_service
  FOREIGN KEY (service_id) REFERENCES services(service_id) ON UPDATE CASCADE;

