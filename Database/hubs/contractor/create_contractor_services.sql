CREATE TABLE IF NOT EXISTS contractor_services (
  contractor_id VARCHAR(20) NOT NULL,
  service_id VARCHAR(20) NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contractor_id, service_id)
);
ALTER TABLE contractor_services
  ADD CONSTRAINT IF NOT EXISTS fk_cs_contractor
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE CASCADE;
ALTER TABLE contractor_services
  ADD CONSTRAINT IF NOT EXISTS fk_cs_service
  FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cs_favorite ON contractor_services(is_favorite);

