-- +migrate Up
CREATE TABLE IF NOT EXISTS reports (
  report_id VARCHAR(16) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  service_id VARCHAR(50),
  center_id VARCHAR(50),
  customer_id VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by_role VARCHAR(20) NOT NULL,
  created_by_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  tags TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_by_center ON reports(center_id);
CREATE INDEX IF NOT EXISTS idx_reports_by_customer ON reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by_id, created_by_role);

-- +migrate Down
DROP TABLE IF EXISTS reports;
