-- Migration: 002_reports_feedback.sql
-- Description: Add reports, report_comments, and feedback tables

CREATE TABLE IF NOT EXISTS reports (
  report_id VARCHAR(40) PRIMARY KEY,
  type VARCHAR(40) NOT NULL,
  severity VARCHAR(20),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  center_id VARCHAR(40),
  customer_id VARCHAR(40),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by_role VARCHAR(20) NOT NULL,
  created_by_id VARCHAR(60) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_center ON reports(center_id);
CREATE INDEX IF NOT EXISTS idx_reports_customer ON reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE TABLE IF NOT EXISTS report_comments (
  comment_id SERIAL PRIMARY KEY,
  report_id VARCHAR(40) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  author_role VARCHAR(20) NOT NULL,
  author_id VARCHAR(60) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_report_comments_report ON report_comments(report_id);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id VARCHAR(40) PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  center_id VARCHAR(40),
  customer_id VARCHAR(40),
  created_by_role VARCHAR(20) NOT NULL,
  created_by_id VARCHAR(60) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_center ON feedback(center_id);
CREATE INDEX IF NOT EXISTS idx_feedback_customer ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

