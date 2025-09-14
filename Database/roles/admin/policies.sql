/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: policies.sql
 *
 * Description: Admin role-specific RLS policy application and overrides
 * Function: Apply shared RLS templates with admin-specific configurations
 * Importance: Ensure admin role has appropriate global access while maintaining security
 * Connects to: Shared RLS templates, admin role configuration, global scope access
 */

-- Apply shared RLS policies with admin context
\i '../../../rls/users.rls.sql'
\i '../../../rls/directory.rls.sql'

-- Admin-specific policy additions (if needed)

-- Admin override policy for emergency access (highest priority)
CREATE POLICY admin_emergency_override ON users
  FOR ALL
  TO application_role
  USING (
    current_setting('app.current_role', true) = 'admin' AND
    current_user_has_capability('system:emergency_access')
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'admin' AND
    current_user_has_capability('system:emergency_access')
  );

-- Admin can bypass normal RLS for system maintenance
CREATE POLICY admin_maintenance_mode ON system_activity
  FOR ALL
  TO application_role
  USING (
    current_setting('app.current_role', true) = 'admin' AND
    current_user_has_capability('system:maintenance')
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'admin' AND
    current_user_has_capability('system:maintenance')
  );

-- Grant admin role full access to RBAC tables
CREATE POLICY admin_rbac_full_access ON roles
  FOR ALL
  TO application_role
  USING (current_user_has_capability('permissions:admin'))
  WITH CHECK (current_user_has_capability('permissions:admin'));

CREATE POLICY admin_permissions_full_access ON permissions
  FOR ALL
  TO application_role
  USING (current_user_has_capability('permissions:admin'))
  WITH CHECK (current_user_has_capability('permissions:admin'));

CREATE POLICY admin_role_permissions_full_access ON role_permissions
  FOR ALL
  TO application_role
  USING (current_user_has_capability('permissions:admin'))
  WITH CHECK (current_user_has_capability('permissions:admin'));

CREATE POLICY admin_user_overrides_full_access ON user_permission_overrides
  FOR ALL
  TO application_role
  USING (current_user_has_capability('permissions:admin'))
  WITH CHECK (current_user_has_capability('permissions:admin'));

-- Grant additional permissions to application role for admin operations
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON permissions TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permission_overrides TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_hierarchy TO application_role;