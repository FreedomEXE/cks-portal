INSERT INTO admin_users (
  clerk_user_id,
  cks_code,
  full_name,
  email,
  status,
  role
) VALUES (
  'user_30zQMJoQqhzVJEgWRUgen7SsSnY',
  'ADM-001',
  'Admin User',
  'admin@ckscontracting.ca',
  'active',
  'admin'
) ON CONFLICT (clerk_user_id) DO NOTHING;
