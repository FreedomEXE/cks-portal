/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: policies.sql
 *
 * Description: Manager role-specific RLS policy application and overrides
 * Function: Apply shared RLS templates with manager-specific configurations
 * Importance: Ensure manager role has appropriate ecosystem access while maintaining security
 * Connects to: Shared RLS templates, manager role configuration, ecosystem scope access
 */

-- Apply shared RLS policies with manager context
\i '../../../rls/users.rls.sql'
\i '../../../rls/directory.rls.sql'

-- Manager-specific policy additions for ecosystem management

-- Manager can view activity across their ecosystem
CREATE POLICY manager_ecosystem_activity_access ON system_activity
  FOR SELECT
  TO application_role
  USING (
    current_setting('app.current_role', true) = 'manager' AND
    current_user_has_capability('dashboard:view') AND
    (
      user_id = current_setting('app.current_user_id', true) OR
      user_id IN (
        -- Users in manager's ecosystem
        SELECT contractor_id FROM contractors WHERE cks_manager = current_setting('app.current_user_id', true)
        UNION
        SELECT customer_id FROM customers WHERE cks_manager = current_setting('app.current_user_id', true)
        UNION
        SELECT center_id FROM centers WHERE cks_manager = current_setting('app.current_user_id', true)
        UNION
        SELECT crew_id FROM crew c
        JOIN contractors con ON c.contractor_id = con.contractor_id
        WHERE con.cks_manager = current_setting('app.current_user_id', true)
        UNION
        SELECT warehouse_id FROM warehouses WHERE cks_manager = current_setting('app.current_user_id', true)
      )
    )
  );

-- Manager can manage activity within their ecosystem
CREATE POLICY manager_ecosystem_activity_management ON system_activity
  FOR INSERT
  TO application_role
  WITH CHECK (
    current_setting('app.current_role', true) = 'manager' AND
    current_user_has_capability('dashboard:manage') AND
    user_id = current_setting('app.current_user_id', true)
  );

-- Manager-specific service access for their ecosystem
CREATE POLICY manager_ecosystem_services_access ON contractor_services
  FOR SELECT
  TO application_role
  USING (
    current_user_has_capability('services:view') AND
    contractor_id IN (
      SELECT contractor_id FROM contractors
      WHERE cks_manager = current_setting('app.current_user_id', true)
    )
  );

-- Managers can view service reviews for their ecosystem contractors
CREATE POLICY manager_ecosystem_service_reviews_access ON service_reviews
  FOR SELECT
  TO application_role
  USING (
    current_user_has_capability('reports:view') AND
    contractor_service_id IN (
      SELECT cs.contractor_service_id FROM contractor_services cs
      JOIN contractors c ON cs.contractor_id = c.contractor_id
      WHERE c.cks_manager = current_setting('app.current_user_id', true)
    )
  );

-- Grant manager-specific permissions to application role
GRANT SELECT ON service_catalog TO application_role;
GRANT SELECT ON service_categories TO application_role;
GRANT SELECT ON contractor_services TO application_role;
GRANT SELECT ON service_reviews TO application_role;