CREATE TABLE IF NOT EXISTS memos_threads (
  thread_id TEXT PRIMARY KEY,
  thread_key TEXT NOT NULL UNIQUE,
  thread_type TEXT NOT NULL DEFAULT 'direct',
  ecosystem_manager_id TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memos_participants (
  thread_id TEXT NOT NULL REFERENCES memos_threads(thread_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, participant_id)
);

CREATE TABLE IF NOT EXISTS memos_messages (
  message_id BIGSERIAL PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES memos_threads(thread_id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memos_participants_user
  ON memos_participants(UPPER(participant_id));

CREATE INDEX IF NOT EXISTS idx_memos_messages_thread
  ON memos_messages(thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_memos_threads_manager
  ON memos_threads(UPPER(ecosystem_manager_id));
