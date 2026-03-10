/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------
  File: 20260310_01_create_calendar_tables.sql
  Description:
  Creates the Phase 1 calendar projection tables and indexes.
-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

-- Calendar projection tables
-- Read-only calendar rows materialized from source-domain actions.

CREATE SEQUENCE IF NOT EXISTS calendar_event_sequence START 1;

CREATE TABLE IF NOT EXISTS calendar_events (
  event_id TEXT PRIMARY KEY DEFAULT ('EVT-' || LPAD(nextval('calendar_event_sequence')::text, 8, '0')),

  event_type TEXT NOT NULL,
  event_category TEXT,
  title TEXT NOT NULL,
  description TEXT,

  planned_start_at TIMESTAMPTZ NOT NULL,
  planned_end_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',

  template_id TEXT,
  series_parent_id TEXT REFERENCES calendar_events(event_id) ON DELETE SET NULL,
  occurrence_index INTEGER,
  recurrence_id TIMESTAMPTZ,
  is_exception BOOLEAN NOT NULL DEFAULT FALSE,

  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_action TEXT,
  source_detail TEXT,
  generator_key TEXT NOT NULL,
  source_version TEXT,
  source_hash TEXT,

  center_id TEXT,
  warehouse_id TEXT,
  location_name TEXT,
  location_address TEXT,

  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT NOT NULL DEFAULT 'normal',
  color TEXT,
  icon TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  created_by_role TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,

  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  archive_reason TEXT,
  deletion_scheduled TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,
  restored_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_generator_key
  ON calendar_events(generator_key);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(planned_start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_at ON calendar_events(planned_end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_center ON calendar_events(center_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_warehouse ON calendar_events(warehouse_id);
-- GiST range index deferred to Phase 4 (conflict detection).
-- For Phase 1, the composite B-tree on start/end covers window queries.
CREATE INDEX IF NOT EXISTS idx_calendar_events_window
  ON calendar_events(planned_start_at, planned_end_at);

CREATE TABLE IF NOT EXISTS calendar_event_participants (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES calendar_events(event_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_role TEXT NOT NULL,
  participation_type TEXT NOT NULL DEFAULT 'watcher',
  notify BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, participant_id, participant_role)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_participant
  ON calendar_event_participants(participant_id, participant_role);
CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_event
  ON calendar_event_participants(event_id);
