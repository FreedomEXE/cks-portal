/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: catalog_capabilities.sql
 *
 * Description: Admin catalog capability definitions
 * Function: Define catalog permissions for admin role
 * Importance: Security - grants admin full catalog management access
 * Connects to: Catalog domain, RLS policies, route factories
 */

-- Admin catalog capabilities
INSERT INTO capabilities (capability_name, capability_description, capability_category, is_system, created_at) VALUES
('catalog:view', 'View catalog items and categories', 'catalog', false, NOW()),
('catalog:create', 'Create new catalog items and categories', 'catalog', false, NOW()),
('catalog:update', 'Update existing catalog items and categories', 'catalog', false, NOW()),
('catalog:delete', 'Delete catalog items and categories', 'catalog', false, NOW()),
('catalog:admin', 'Full administrative access to catalog system', 'catalog', false, NOW())
ON CONFLICT (capability_name) DO NOTHING;

-- Grant admin all catalog capabilities
INSERT INTO role_capabilities (role_code, capability_name, granted_at) VALUES
('admin', 'catalog:view', NOW()),
('admin', 'catalog:create', NOW()),
('admin', 'catalog:update', NOW()),
('admin', 'catalog:delete', NOW()),
('admin', 'catalog:admin', NOW())
ON CONFLICT (role_code, capability_name) DO NOTHING;