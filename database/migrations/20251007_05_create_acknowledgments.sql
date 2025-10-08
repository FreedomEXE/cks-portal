-- +migrate Up
-- Table to track who has acknowledged each report
CREATE TABLE IF NOT EXISTS report_acknowledgments (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(16) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  acknowledged_by_id VARCHAR(50) NOT NULL,
  acknowledged_by_role VARCHAR(20) NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, acknowledged_by_id)
);

CREATE INDEX IF NOT EXISTS idx_report_ack_report ON report_acknowledgments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_ack_user ON report_acknowledgments(acknowledged_by_id);

-- Table to track who has acknowledged each feedback
CREATE TABLE IF NOT EXISTS feedback_acknowledgments (
  id SERIAL PRIMARY KEY,
  feedback_id VARCHAR(16) NOT NULL REFERENCES feedback(feedback_id) ON DELETE CASCADE,
  acknowledged_by_id VARCHAR(50) NOT NULL,
  acknowledged_by_role VARCHAR(20) NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feedback_id, acknowledged_by_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_ack_feedback ON feedback_acknowledgments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ack_user ON feedback_acknowledgments(acknowledged_by_id);

-- +migrate Down
DROP TABLE IF EXISTS report_acknowledgments;
DROP TABLE IF EXISTS feedback_acknowledgments;
