/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: users.rls.sql
 *
 * Description: Row Level Security policies for users and related tables
 * Function: Enforce data access controls based on user roles and capabilities
 * Importance: Security foundation ensuring users only see appropriate data
 * Connects to: Authentication middleware, role configurations, capability system
 */

-- Set up session variables for RLS policies
-- These will be set by the backend authentication middleware

-- Users table policies
CREATE POLICY users_admin_full_access ON users
  FOR ALL
  TO application_role
  USING (current_user_has_capability('users:admin'))
  WITH CHECK (current_user_has_capability('users:admin'));

CREATE POLICY users_manager_ecosystem_access ON users
  FOR SELECT
  TO application_role
  USING (
    current_user_has_capability('users:view') AND
    (
      -- Managers can see users in their ecosystem
      role_code IN ('contractor', 'customer', 'center', 'crew', 'warehouse') AND
      user_id IN (
        -- This would be expanded with actual ecosystem relationships
        SELECT user_id FROM users WHERE role_code != 'admin'
      )
    )
  );

CREATE POLICY users_own_profile_access ON users
  FOR ALL
  TO application_role
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY users_profile_view_capability ON users
  FOR SELECT
  TO application_role
  USING (current_user_has_capability('profile:view'));

-- User sessions policies
CREATE POLICY user_sessions_own_access ON user_sessions
  FOR ALL
  TO application_role
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY user_sessions_admin_access ON user_sessions
  FOR ALL
  TO application_role
  USING (current_user_has_capability('users:admin'))
  WITH CHECK (current_user_has_capability('users:admin'));

-- User preferences policies
CREATE POLICY user_preferences_own_access ON user_preferences
  FOR ALL
  TO application_role
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- User API keys policies
CREATE POLICY user_api_keys_own_access ON user_api_keys
  FOR ALL
  TO application_role
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY user_api_keys_admin_access ON user_api_keys
  FOR SELECT
  TO application_role
  USING (current_user_has_capability('users:admin'));

-- Create application role for backend connections
CREATE ROLE IF NOT EXISTS application_role;

-- Grant necessary permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_api_keys TO application_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO application_role;

-- Function to set session context (called by backend)
CREATE OR REPLACE FUNCTION set_session_context(
  p_user_id TEXT,
  p_role_code TEXT,
  p_capabilities TEXT[]
)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id, true);
  PERFORM set_config('app.current_role', p_role_code, true);
  PERFORM set_config('app.current_capabilities', array_to_string(p_capabilities, ','), true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear session context
CREATE OR REPLACE FUNCTION clear_session_context()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', '', true);
  PERFORM set_config('app.current_role', '', true);
  PERFORM set_config('app.current_capabilities', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;