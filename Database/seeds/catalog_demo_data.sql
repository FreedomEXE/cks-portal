/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: catalog_demo_data.sql
 *
 * Description: Demo data for catalog system
 * Function: Populate catalog with sample categories, services, and products
 * Importance: Testing and development - provides realistic catalog data
 * Connects to: Catalog tables, frontend catalog page
 */

-- Sample categories
INSERT INTO catalog_categories (name, description, parent_id, icon, sort_order, is_active) VALUES
('Cleaning Services', 'Professional cleaning and maintenance services', NULL, 'cleaning', 1, true),
('Landscaping', 'Outdoor maintenance and landscaping services', NULL, 'landscape', 2, true),
('Maintenance & Repair', 'General maintenance and repair services', NULL, 'tools', 3, true),
('Specialized Services', 'Specialized and technical services', NULL, 'gear', 4, true),
('Supplies & Equipment', 'Cleaning supplies and equipment', NULL, 'box', 5, true),
('Commercial Cleaning', 'Commercial and industrial cleaning', 1, 'building', 1, true),
('Residential Cleaning', 'Home and residential cleaning', 1, 'home', 2, true),
('Lawn Care', 'Lawn maintenance and care', 2, 'grass', 1, true),
('Tree Services', 'Tree care and removal services', 2, 'tree', 2, true)
ON CONFLICT (name) DO NOTHING;

-- Sample services
INSERT INTO services (service_name, description, category_id, unit, price, requires_quote, is_emergency, min_notice_hours, status, tags, metadata, created_by) VALUES
('Office Building Cleaning', 'Complete office cleaning including floors, bathrooms, and common areas',
 (SELECT category_id FROM catalog_categories WHERE name = 'Commercial Cleaning'),
 'hourly', 25.00, false, false, 24, 'active',
 ARRAY['commercial', 'office', 'cleaning'],
 '{"frequency_options": ["daily", "weekly", "monthly"]}', 'ADM-001'),

('Carpet Deep Cleaning', 'Professional carpet cleaning with hot water extraction',
 (SELECT category_id FROM catalog_categories WHERE name = 'Commercial Cleaning'),
 'per_sqft', 0.75, false, false, 48, 'active',
 ARRAY['carpet', 'deep-clean', 'commercial'],
 '{"equipment": "truck-mounted", "drying_time": "4-6 hours"}', 'ADM-001'),

('Emergency Water Damage Cleanup', 'Immediate response for water damage restoration',
 (SELECT category_id FROM catalog_categories WHERE name = 'Specialized Services'),
 'per_job', 500.00, true, true, 2, 'active',
 ARRAY['emergency', 'water-damage', '24/7'],
 '{"response_time": "2 hours", "equipment_included": true}', 'ADM-001'),

('Weekly Lawn Mowing', 'Regular lawn mowing and edging service',
 (SELECT category_id FROM catalog_categories WHERE name = 'Lawn Care'),
 'per_visit', 45.00, false, false, 48, 'active',
 ARRAY['lawn', 'mowing', 'weekly'],
 '{"season": "March-November", "equipment_provided": true}', 'ADM-001'),

('Tree Removal Service', 'Professional tree removal with cleanup',
 (SELECT category_id FROM catalog_categories WHERE name = 'Tree Services'),
 'per_job', 750.00, true, false, 72, 'active',
 ARRAY['tree', 'removal', 'cleanup'],
 '{"permit_assistance": true, "stump_grinding": "additional"}', 'ADM-001'),

('Residential House Cleaning', 'Complete home cleaning service',
 (SELECT category_id FROM catalog_categories WHERE name = 'Residential Cleaning'),
 'per_visit', 85.00, false, false, 24, 'active',
 ARRAY['residential', 'house', 'cleaning'],
 '{"rooms_included": "all", "supplies_included": true}', 'ADM-001'),

('HVAC Maintenance', 'Heating and cooling system maintenance and repair',
 (SELECT category_id FROM catalog_categories WHERE name = 'Maintenance & Repair'),
 'per_job', 125.00, false, false, 24, 'active',
 ARRAY['hvac', 'maintenance', 'repair'],
 '{"seasonal_checkup": true, "filter_replacement": "included"}', 'ADM-001'),

('Post-Construction Cleanup', 'Detailed cleanup after construction or renovation',
 (SELECT category_id FROM catalog_categories WHERE name = 'Specialized Services'),
 'per_sqft', 1.25, false, false, 48, 'active',
 ARRAY['construction', 'cleanup', 'renovation'],
 '{"debris_removal": true, "deep_cleaning": true}', 'ADM-001')
ON CONFLICT (service_name) DO NOTHING;

-- Sample products
INSERT INTO products (product_name, description, category_id, sku, unit, price, weight_lbs, dimensions, hazmat, track_inventory, min_stock_level, status, tags, metadata, created_by) VALUES
('Industrial Floor Cleaner', 'Heavy-duty floor cleaning solution for commercial use',
 (SELECT category_id FROM catalog_categories WHERE name = 'Supplies & Equipment'),
 'IFC-001', 'gallon', 24.99, 8.5,
 '{"length": 6, "width": 6, "height": 12, "unit": "inches"}',
 false, true, 50, 'active',
 ARRAY['cleaner', 'industrial', 'floor'],
 '{"concentrate": true, "coverage": "5000 sqft per gallon"}', 'ADM-001'),

('Commercial Vacuum Cleaner', 'Heavy-duty commercial vacuum with HEPA filtration',
 (SELECT category_id FROM catalog_categories WHERE name = 'Supplies & Equipment'),
 'CVC-002', 'each', 299.99, 35.0,
 '{"length": 14, "width": 12, "height": 48, "unit": "inches"}',
 false, true, 10, 'active',
 ARRAY['vacuum', 'commercial', 'hepa'],
 '{"warranty": "3 years", "bag_capacity": "6 quart"}', 'ADM-001'),

('Disinfectant Spray', 'EPA-registered disinfectant for commercial use',
 (SELECT category_id FROM catalog_categories WHERE name = 'Supplies & Equipment'),
 'DS-003', 'case', 89.99, 25.0,
 '{"length": 12, "width": 8, "height": 10, "unit": "inches"}',
 true, true, 25, 'active',
 ARRAY['disinfectant', 'spray', 'epa'],
 '{"bottles_per_case": 12, "epa_number": "12345-67-890"}', 'ADM-001'),

('Microfiber Cleaning Cloths', 'Professional-grade microfiber cloths pack',
 (SELECT category_id FROM catalog_categories WHERE name = 'Supplies & Equipment'),
 'MFC-004', 'pack', 19.99, 2.0,
 '{"length": 10, "width": 8, "height": 3, "unit": "inches"}',
 false, true, 100, 'active',
 ARRAY['microfiber', 'cloths', 'pack'],
 '{"cloths_per_pack": 24, "washable": true, "colors": "assorted"}', 'ADM-001'),

('Pressure Washer Solution', 'Biodegradable pressure washer detergent',
 (SELECT category_id FROM catalog_categories WHERE name = 'Supplies & Equipment'),
 'PWS-005', 'gallon', 32.99, 8.8,
 '{"length": 6, "width": 6, "height": 12, "unit": "inches"}',
 false, true, 30, 'active',
 ARRAY['pressure-washer', 'detergent', 'biodegradable'],
 '{"dilution_ratio": "1:10", "eco_friendly": true}', 'ADM-001'),

('Safety Equipment Kit', 'Complete safety equipment for cleaning professionals',
 (SELECT category_id FROM catalog_categories WHERE name = 'Supplies & Equipment'),
 'SEK-006', 'kit', 45.99, 5.0,
 '{"length": 16, "width": 12, "height": 6, "unit": "inches"}',
 false, true, 20, 'active',
 ARRAY['safety', 'equipment', 'kit'],
 '{"includes": "gloves, goggles, masks, apron", "size": "universal"}', 'ADM-001')
ON CONFLICT (sku) DO NOTHING;