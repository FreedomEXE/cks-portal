-- Create announcements and announcement_reads tables for news feed

CREATE TABLE IF NOT EXISTS announcements (
  announcement_id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  summary VARCHAR(240),
  scope_type VARCHAR(20) NOT NULL,
  scope_id VARCHAR(50),
  target_roles TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by_role VARCHAR(30) NOT NULL,
  created_by_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_announcements_starts_at ON announcements(starts_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id VARCHAR(40) NOT NULL REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  reader_id VARCHAR(50) NOT NULL,
  reader_role VARCHAR(30) NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, reader_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_reader ON announcement_reads(reader_id);
