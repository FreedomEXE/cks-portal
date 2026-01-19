BEGIN;

CREATE TABLE IF NOT EXISTS announcements (
  announcement_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  summary TEXT NULL,
  scope_type TEXT NOT NULL DEFAULT 'global',
  scope_id TEXT NULL,
  target_roles TEXT[] NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  created_by_role TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id TEXT NOT NULL REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  reader_role TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, reader_id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_scope
  ON announcements(scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_announcements_status
  ON announcements(status);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_reader
  ON announcement_reads(UPPER(reader_id));

COMMIT;
