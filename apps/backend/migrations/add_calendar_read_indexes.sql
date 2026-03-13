CREATE INDEX IF NOT EXISTS idx_calendar_events_active_window
  ON calendar_events (planned_start_at, planned_end_at)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_active_status
  ON calendar_events (status, planned_start_at)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_active_source_upper
  ON calendar_events (UPPER(source_id))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_active_center_upper
  ON calendar_events (UPPER(center_id))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_active_warehouse_upper
  ON calendar_events (UPPER(warehouse_id))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_active_order_meta_upper
  ON calendar_events (UPPER(COALESCE(metadata->>'orderId', '')))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_active_service_meta_upper
  ON calendar_events (UPPER(COALESCE(metadata->>'serviceId', '')))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_event_id
  ON calendar_event_participants (event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_role_participant_event
  ON calendar_event_participants (participant_role, UPPER(participant_id), event_id);
