/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------
  File: 20260311_01_create_schedule_tables.sql
  Description:
  Creates the Schedule foundation tables for blocks, assignments, tasks,
  and reusable templates.
-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

CREATE SEQUENCE IF NOT EXISTS schedule_block_id_seq START 1;

CREATE TABLE IF NOT EXISTS schedule_templates (
  template_id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rrule TEXT,
  default_start_time TEXT,
  default_duration_minutes INTEGER,
  default_assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
  block_id TEXT PRIMARY KEY DEFAULT ('BLK-' || LPAD(nextval('schedule_block_id_seq')::text, 3, '0')),
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  center_id TEXT,
  warehouse_id TEXT,
  building_name TEXT,
  area_name TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  block_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT NOT NULL DEFAULT 'normal',
  source_type TEXT,
  source_id TEXT,
  source_action TEXT,
  template_id TEXT REFERENCES schedule_templates(template_id) ON DELETE SET NULL,
  recurrence_rule TEXT,
  series_parent_id TEXT REFERENCES schedule_blocks(block_id) ON DELETE SET NULL,
  occurrence_index INTEGER,
  generator_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  archived_at TIMESTAMPTZ,
  archived_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_blocks_generator_key
  ON schedule_blocks(generator_key);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_scope
  ON schedule_blocks(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_center
  ON schedule_blocks(center_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_warehouse
  ON schedule_blocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_source
  ON schedule_blocks(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_window
  ON schedule_blocks(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_status
  ON schedule_blocks(status);

CREATE TABLE IF NOT EXISTS schedule_block_assignments (
  assignment_id BIGSERIAL PRIMARY KEY,
  block_id TEXT NOT NULL REFERENCES schedule_blocks(block_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_role TEXT NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'assignee',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'assigned',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE (block_id, participant_id, participant_role, assignment_type)
);

CREATE INDEX IF NOT EXISTS idx_schedule_block_assignments_block
  ON schedule_block_assignments(block_id);
CREATE INDEX IF NOT EXISTS idx_schedule_block_assignments_participant
  ON schedule_block_assignments(participant_id, participant_role);

CREATE TABLE IF NOT EXISTS schedule_block_tasks (
  task_id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL REFERENCES schedule_blocks(block_id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  task_type TEXT NOT NULL DEFAULT 'task',
  catalog_item_code TEXT,
  catalog_item_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  area_name TEXT,
  estimated_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  required_tools TEXT[] NOT NULL DEFAULT '{}'::text[],
  required_products TEXT[] NOT NULL DEFAULT '{}'::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE (block_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_schedule_block_tasks_block
  ON schedule_block_tasks(block_id, sequence);
CREATE INDEX IF NOT EXISTS idx_schedule_block_tasks_status
  ON schedule_block_tasks(status);
