/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: catalog_capabilities.sql
 *
 * Description: Manager catalog capability definitions
 * Function: Define catalog permissions for manager role
 * Importance: Security - grants manager read access to catalog
 * Connects to: Catalog domain, RLS policies, route factories
 */

-- Manager catalog capabilities (view only)
INSERT INTO capabilities (capability_name, capability_description, capability_category, is_system, created_at) VALUES
('catalog:view', 'View catalog items and categories', 'catalog', false, NOW())
ON CONFLICT (capability_name) DO NOTHING;

-- Grant manager view access to catalog
INSERT INTO role_capabilities (role_code, capability_name, granted_at) VALUES
('manager', 'catalog:view', NOW())
ON CONFLICT (role_code, capability_name) DO NOTHING;