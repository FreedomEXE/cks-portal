/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: directory.rls.sql
 *
 * Description: Row Level Security policies for directory domain tables
 * Function: Enforce ecosystem-based access control for directory entities
 * Importance: Ensure contractors only see their ecosystem, admins see all, etc.
 * Connects to: Directory domain, ecosystem relationships, role-based access
 */

-- Contractors table policies
CREATE POLICY contractors_admin_full_access ON contractors
  FOR ALL
  TO application_role
  USING (current_user_has_capability('contractors:admin'))
  WITH CHECK (current_user_has_capability('contractors:admin'));

CREATE POLICY contractors_manager_assigned_access ON contractors
  FOR ALL
  TO application_role
  USING (
    current_user_has_capability('contractors:view') AND
    cks_manager = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_user_has_capability('contractors:update') AND
    cks_manager = current_setting('app.current_user_id', true)
  );

CREATE POLICY contractors_own_access ON contractors
  FOR ALL
  TO application_role
  USING (contractor_id = current_setting('app.current_user_id', true))
  WITH CHECK (contractor_id = current_setting('app.current_user_id', true));

CREATE POLICY contractors_view_capability ON contractors
  FOR SELECT
  TO application_role
  USING (current_user_has_capability('contractors:view'));

-- Customers table policies
CREATE POLICY customers_admin_full_access ON customers
  FOR ALL
  TO application_role
  USING (current_user_has_capability('customers:admin'))
  WITH CHECK (current_user_has_capability('customers:admin'));

CREATE POLICY customers_manager_assigned_access ON customers
  FOR ALL
  TO application_role
  USING (
    current_user_has_capability('customers:view') AND
    cks_manager = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_user_has_capability('customers:update') AND
    cks_manager = current_setting('app.current_user_id', true)
  );

CREATE POLICY customers_contractor_relationship_access ON customers
  FOR SELECT
  TO application_role
  USING (
    current_user_has_capability('customers:view') AND
    customer_id IN (
      SELECT customer_id FROM contractor_customer_relationships
      WHERE contractor_id = current_setting('app.current_user_id', true)
        AND relationship_type IN ('approved', 'preferred')
    )
  );

CREATE POLICY customers_own_access ON customers
  FOR ALL
  TO application_role
  USING (customer_id = current_setting('app.current_user_id', true))
  WITH CHECK (customer_id = current_setting('app.current_user_id', true));

-- Centers table policies
CREATE POLICY centers_admin_full_access ON centers
  FOR ALL
  TO application_role
  USING (current_user_has_capability('centers:admin'))
  WITH CHECK (current_user_has_capability('centers:admin'));

CREATE POLICY centers_manager_assigned_access ON centers
  FOR ALL
  TO application_role
  USING (
    current_user_has_capability('centers:view') AND
    cks_manager = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_user_has_capability('centers:update') AND
    cks_manager = current_setting('app.current_user_id', true)
  );

CREATE POLICY centers_contractor_access ON centers
  FOR SELECT
  TO application_role
  USING (
    current_user_has_capability('centers:view') AND
    (
      primary_contractor = current_setting('app.current_user_id', true) OR
      customer_id IN (
        SELECT customer_id FROM contractor_customer_relationships
        WHERE contractor_id = current_setting('app.current_user_id', true)
          AND relationship_type IN ('approved', 'preferred')
      )
    )
  );

CREATE POLICY centers_customer_owned_access ON centers
  FOR ALL
  TO application_role
  USING (customer_id = current_setting('app.current_user_id', true))
  WITH CHECK (customer_id = current_setting('app.current_user_id', true));

CREATE POLICY centers_own_access ON centers
  FOR ALL
  TO application_role
  USING (center_id = current_setting('app.current_user_id', true))
  WITH CHECK (center_id = current_setting('app.current_user_id', true));

-- Crew table policies
CREATE POLICY crew_admin_full_access ON crew
  FOR ALL
  TO application_role
  USING (current_user_has_capability('crew:admin'))
  WITH CHECK (current_user_has_capability('crew:admin'));

CREATE POLICY crew_contractor_managed_access ON crew
  FOR ALL
  TO application_role
  USING (
    current_user_has_capability('crew:view') AND
    contractor_id = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_user_has_capability('crew:update') AND
    contractor_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY crew_manager_ecosystem_access ON crew
  FOR SELECT
  TO application_role
  USING (
    current_user_has_capability('crew:view') AND
    contractor_id IN (
      SELECT contractor_id FROM contractors
      WHERE cks_manager = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY crew_own_access ON crew
  FOR ALL
  TO application_role
  USING (crew_id = current_setting('app.current_user_id', true))
  WITH CHECK (crew_id = current_setting('app.current_user_id', true));

-- Warehouses table policies
CREATE POLICY warehouses_admin_full_access ON warehouses
  FOR ALL
  TO application_role
  USING (current_user_has_capability('warehouses:admin'))
  WITH CHECK (current_user_has_capability('warehouses:admin'));

CREATE POLICY warehouses_manager_assigned_access ON warehouses
  FOR ALL
  TO application_role
  USING (
    current_user_has_capability('warehouses:view') AND
    cks_manager = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_user_has_capability('warehouses:update') AND
    cks_manager = current_setting('app.current_user_id', true)
  );

CREATE POLICY warehouses_contractor_owned_access ON warehouses
  FOR ALL
  TO application_role
  USING (
    current_user_has_capability('warehouses:view') AND
    contractor_id = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_user_has_capability('warehouses:update') AND
    contractor_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY warehouses_own_access ON warehouses
  FOR ALL
  TO application_role
  USING (warehouse_id = current_setting('app.current_user_id', true))
  WITH CHECK (warehouse_id = current_setting('app.current_user_id', true));

-- Managers table policies
CREATE POLICY managers_admin_full_access ON managers
  FOR ALL
  TO application_role
  USING (current_user_has_capability('managers:admin'))
  WITH CHECK (current_user_has_capability('managers:admin'));

CREATE POLICY managers_own_access ON managers
  FOR ALL
  TO application_role
  USING (manager_id = current_setting('app.current_user_id', true))
  WITH CHECK (manager_id = current_setting('app.current_user_id', true));

CREATE POLICY managers_view_capability ON managers
  FOR SELECT
  TO application_role
  USING (current_user_has_capability('managers:view'));

-- Relationship table policies
CREATE POLICY contractor_customer_relationships_admin_access ON contractor_customer_relationships
  FOR ALL
  TO application_role
  USING (current_user_has_capability('contractors:admin') OR current_user_has_capability('customers:admin'))
  WITH CHECK (current_user_has_capability('contractors:admin') OR current_user_has_capability('customers:admin'));

CREATE POLICY contractor_customer_relationships_participant_access ON contractor_customer_relationships
  FOR SELECT
  TO application_role
  USING (
    contractor_id = current_setting('app.current_user_id', true) OR
    customer_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY crew_center_assignments_admin_access ON crew_center_assignments
  FOR ALL
  TO application_role
  USING (current_user_has_capability('crew:admin'))
  WITH CHECK (current_user_has_capability('crew:admin'));

CREATE POLICY crew_center_assignments_participant_access ON crew_center_assignments
  FOR SELECT
  TO application_role
  USING (
    crew_id = current_setting('app.current_user_id', true) OR
    center_id = current_setting('app.current_user_id', true)
  );

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON contractors TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON centers TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON crew TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouses TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON managers TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON contractor_customer_relationships TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON crew_center_assignments TO application_role;