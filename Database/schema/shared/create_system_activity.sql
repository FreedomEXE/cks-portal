CREATE TABLE IF NOT EXISTS system_activity (
  activity_id SERIAL PRIMARY KEY,
  activity_type VARCHAR(40) NOT NULL,
  actor_id VARCHAR(60),
  actor_role VARCHAR(20),
  target_id VARCHAR(60),
  target_type VARCHAR(30),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

