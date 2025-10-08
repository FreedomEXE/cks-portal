-- +migrate Up
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id VARCHAR(16) PRIMARY KEY,
  kind VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  center_id VARCHAR(50),
  customer_id VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by_role VARCHAR(20) NOT NULL,
  created_by_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_by_center ON feedback(center_id);
CREATE INDEX IF NOT EXISTS idx_feedback_by_customer ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_by ON feedback(created_by_id, created_by_role);

-- +migrate Down
DROP TABLE IF EXISTS feedback;
