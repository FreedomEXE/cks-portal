-- Seed: 010_reports_feedback_sample.sql
-- Description: Sample reports, comments, and feedback for demo

-- Sample Reports tied to CEN-001 and CUS-001
INSERT INTO reports (report_id, type, severity, title, description, center_id, customer_id, status, created_by_role, created_by_id, created_at)
VALUES
  ('RPT-1001', 'service_issue', 'medium', 'Spills in North Wing entrance', 'Multiple spill incidents reported near the main entrance. Requesting additional cleanup rounds during peak hours.', 'CEN-001', 'CUS-001', 'open', 'center', 'CEN-001', NOW() - INTERVAL '2 days'),
  ('RPT-1002', 'quality', 'low', 'Dust accumulation on window sills', 'Noticeable dust on second floor window sills; recommend adding weekly detail pass.', 'CEN-001', 'CUS-001', 'in_progress', 'customer', 'CUS-001', NOW() - INTERVAL '1 day'),
  ('RPT-1003', 'incident', 'high', 'Slip incident in lobby (no injury)', 'Guest slipped in lobby due to wet floor; no injury reported. Ensure signage and faster response.', 'CEN-001', 'CUS-001', 'resolved', 'center', 'CEN-001', NOW() - INTERVAL '6 hours');

-- Comments for reports
INSERT INTO report_comments (report_id, author_role, author_id, body, created_at)
VALUES
  ('RPT-1001', 'manager', 'MGR-001', 'Acknowledged. Scheduling extra sweeps during morning rush.', NOW() - INTERVAL '36 hours'),
  ('RPT-1002', 'center', 'CEN-001', 'Added note to crew schedule for Friday detail.', NOW() - INTERVAL '20 hours'),
  ('RPT-1002', 'manager', 'MGR-001', 'Let us measure time impact and adjust plan.', NOW() - INTERVAL '18 hours'),
  ('RPT-1003', 'manager', 'MGR-001', 'Extra caution signage deployed. Monitoring for the week.', NOW() - INTERVAL '4 hours');

-- Sample Feedback for the same scope
INSERT INTO feedback (feedback_id, kind, title, message, center_id, customer_id, created_by_role, created_by_id, created_at)
VALUES
  ('FDB-1001', 'praise', 'Great overnight shine', 'Lobby floors looked excellent this morning. Crew did great.', 'CEN-001', 'CUS-001', 'customer', 'CUS-001', NOW() - INTERVAL '3 days'),
  ('FDB-1002', 'issue', 'Restroom supplies ran low', 'Restocking in the East Wing restroom seems delayed on Tuesdays.', 'CEN-001', 'CUS-001', 'center', 'CEN-001', NOW() - INTERVAL '12 hours'),
  ('FDB-1003', 'request', 'Add weekly glass clean', 'Please add a quick glass clean to Fridays near elevators.', 'CEN-001', 'CUS-001', 'customer', 'CUS-001', NOW() - INTERVAL '8 hours');

