/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: catalog.rls.sql
 *
 * Description: RLS policies for catalog domain tables
 * Function: Role-based access control for catalog browsing and management
 * Importance: Security layer ensuring proper catalog access by role
 * Connects to: 030_services.sql schema, role-specific policies
 */

-- =============================================================================
-- CATALOG CATEGORIES POLICIES
-- =============================================================================

-- All authenticated users can view active categories (catalog is public)
CREATE POLICY catalog_categories_view_all ON catalog_categories
  FOR SELECT TO application_role
  USING (is_active = true);

-- Only admin can manage categories (create, update, archive)
CREATE POLICY catalog_categories_admin_manage ON catalog_categories
  FOR ALL TO application_role
  USING (
    EXISTS (
      SELECT 1 FROM user_capabilities uc
      WHERE uc.user_id = current_setting('app.current_user_id', true)::uuid
        AND uc.capability_name IN ('catalog:admin', 'admin:global')
    )
  );

-- =============================================================================
-- SERVICES POLICIES
-- =============================================================================

-- All authenticated users can view active services
CREATE POLICY services_view_all ON services
  FOR SELECT TO application_role
  USING (
    archived = false
    AND status = 'active'
  );

-- Admin can manage all services
CREATE POLICY services_admin_manage ON services
  FOR ALL TO application_role
  USING (
    EXISTS (
      SELECT 1 FROM user_capabilities uc
      WHERE uc.user_id = current_setting('app.current_user_id', true)::uuid
        AND uc.capability_name IN ('catalog:admin', 'admin:global')
    )
  );

-- Manager can view all services (including inactive) within their ecosystem
CREATE POLICY services_manager_view ON services
  FOR SELECT TO application_role
  USING (
    archived = false
    AND EXISTS (
      SELECT 1 FROM user_capabilities uc
      WHERE uc.user_id = current_setting('app.current_user_id', true)::uuid
        AND uc.capability_name = 'dashboard:view'
        AND current_setting('app.current_role', true) = 'manager'
    )
  );

-- =============================================================================
-- PRODUCTS POLICIES
-- =============================================================================

-- All authenticated users can view active products
CREATE POLICY products_view_all ON products
  FOR SELECT TO application_role
  USING (
    archived = false
    AND status = 'active'
  );

-- Admin can manage all products
CREATE POLICY products_admin_manage ON products
  FOR ALL TO application_role
  USING (
    EXISTS (
      SELECT 1 FROM user_capabilities uc
      WHERE uc.user_id = current_setting('app.current_user_id', true)::uuid
        AND uc.capability_name IN ('catalog:admin', 'admin:global')
    )
  );

-- Manager can view all products (including inactive) within their ecosystem
CREATE POLICY products_manager_view ON products
  FOR SELECT TO application_role
  USING (
    archived = false
    AND EXISTS (
      SELECT 1 FROM user_capabilities uc
      WHERE uc.user_id = current_setting('app.current_user_id', true)::uuid
        AND uc.capability_name = 'dashboard:view'
        AND current_setting('app.current_role', true) = 'manager'
    )
  );

-- =============================================================================
-- ORG_SERVICES POLICIES (Contractor "My Services")
-- =============================================================================

-- Contractors can view and manage their own services
CREATE POLICY org_services_contractor_own ON org_services
  FOR ALL TO application_role
  USING (
    contractor_id = current_setting('app.current_entity_id', true)
    AND current_setting('app.current_role', true) = 'contractor'
  );

-- Admin can view all org_services relationships
CREATE POLICY org_services_admin_view ON org_services
  FOR SELECT TO application_role
  USING (
    EXISTS (
      SELECT 1 FROM user_capabilities uc
      WHERE uc.user_id = current_setting('app.current_user_id', true)::uuid
        AND uc.capability_name IN ('catalog:admin', 'admin:global')
    )
  );

-- Manager can view org_services within their ecosystem
CREATE POLICY org_services_manager_view ON org_services
  FOR SELECT TO application_role
  USING (
    EXISTS (
      SELECT 1 FROM contractors c
      WHERE c.contractor_id = org_services.contractor_id
        AND c.cks_manager = current_setting('app.current_user_id', true)::uuid
        AND current_setting('app.current_role', true) = 'manager'
    )
  );

-- =============================================================================
-- VIEW ACCESS (v_catalog_items inherits from base table policies)
-- =============================================================================

-- The v_catalog_items view will automatically respect the base table policies
-- since it's a UNION of services and products tables with their existing RLS