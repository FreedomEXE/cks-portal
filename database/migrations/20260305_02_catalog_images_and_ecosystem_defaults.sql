-- Migration: 20260305_02_catalog_images_and_ecosystem_defaults
-- 1. Set category-based image URLs for all catalog products and services
-- 2. Configure MGR-001 (Canadian Cleaning Corp / Network) ecosystem visibility defaults
--    - Allowlist: PRD-001 to PRD-153 (products) and SRV-001 to SRV-042 (field services)
--    - Warehouse services (SRV-101 to SRV-108) excluded from this ecosystem's allowlist
--      but warehouses bypass ecosystem visibility entirely (handled in app code)

-- ============================================================
-- 1. PRODUCT IMAGE URLs (by category)
-- ============================================================

-- garbage-bags (trash/waste)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=640&h=480&fit=crop&auto=format'
WHERE category = 'garbage-bags' AND (image_url IS NULL OR image_url = '');

-- garbage-bags-clear
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=640&h=480&fit=crop&auto=format'
WHERE category = 'garbage-bags-clear' AND (image_url IS NULL OR image_url = '');

-- cleaning-solutions (chemicals, liquid cleaners)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=640&h=480&fit=crop&auto=format'
WHERE category = 'cleaning-solutions' AND (image_url IS NULL OR image_url = '');

-- cleaning-equipment (mops, gloves, janitorial tools)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=640&h=480&fit=crop&auto=format'
WHERE category = 'cleaning-equipment' AND (image_url IS NULL OR image_url = '');

-- roll-towels (paper towel rolls)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=640&h=480&fit=crop&auto=format'
WHERE category = 'roll-towels' AND (image_url IS NULL OR image_url = '');

-- folded-towels (multifold, singlefold paper towels)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=640&h=480&fit=crop&auto=format'
WHERE category = 'folded-towels' AND (image_url IS NULL OR image_url = '');

-- bathroom-tissue (toilet paper)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1584556326561-c8746083993b?w=640&h=480&fit=crop&auto=format'
WHERE category = 'bathroom-tissue' AND (image_url IS NULL OR image_url = '');

-- facial-tissue (tissue boxes)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=640&h=480&fit=crop&auto=format'
WHERE category = 'facial-tissue' AND (image_url IS NULL OR image_url = '');

-- kitchen-towels
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=640&h=480&fit=crop&auto=format'
WHERE category = 'kitchen-towels' AND (image_url IS NULL OR image_url = '');

-- kitchen-products (foil, wrap, cups)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=640&h=480&fit=crop&auto=format'
WHERE category = 'kitchen-products' AND (image_url IS NULL OR image_url = '');

-- safety-products (PPE, masks, glasses)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=640&h=480&fit=crop&auto=format'
WHERE category = 'safety-products' AND (image_url IS NULL OR image_url = '');

-- hygiene-products (sanitary supplies)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=640&h=480&fit=crop&auto=format'
WHERE category = 'hygiene-products' AND (image_url IS NULL OR image_url = '');


-- ============================================================
-- 2. SERVICE IMAGE URLs (by category)
-- ============================================================

-- ceilings-pipes-and-stairs (high dusting, cobweb removal)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=640&h=480&fit=crop&auto=format'
WHERE category = 'ceilings-pipes-and-stairs' AND (image_url IS NULL OR image_url = '');

-- walls (wall cleaning, power washing)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=640&h=480&fit=crop&auto=format'
WHERE category = 'walls' AND (image_url IS NULL OR image_url = '');

-- window (window cleaning, glass)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=640&h=480&fit=crop&auto=format'
WHERE category = 'window' AND (image_url IS NULL OR image_url = '');

-- furnitures (couch, mattress cleaning)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=640&h=480&fit=crop&auto=format'
WHERE category = 'furnitures' AND (image_url IS NULL OR image_url = '');

-- floors (polishing, scrubbing, waxing)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=640&h=480&fit=crop&auto=format'
WHERE category = 'floors' AND (image_url IS NULL OR image_url = '');

-- carpets-rugs (carpet cleaning, steam)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=480&fit=crop&auto=format'
WHERE category = 'carpets-rugs' AND (image_url IS NULL OR image_url = '');

-- rubber (anti-fatigue mats)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640&h=480&fit=crop&auto=format'
WHERE category = 'rubber' AND (image_url IS NULL OR image_url = '');

-- parking (pressure washing, degreasing)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=640&h=480&fit=crop&auto=format'
WHERE category = 'parking' AND (image_url IS NULL OR image_url = '');

-- staircase (stair cleaning, handrail disinfection)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=640&h=480&fit=crop&auto=format'
WHERE category = 'staircase' AND (image_url IS NULL OR image_url = '');

-- restrooms (deep cleaning)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=640&h=480&fit=crop&auto=format'
WHERE category = 'restrooms' AND (image_url IS NULL OR image_url = '');

-- kitchens (appliance cleaning)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=640&h=480&fit=crop&auto=format'
WHERE category = 'kitchens' AND (image_url IS NULL OR image_url = '');

-- baseboards
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=640&h=480&fit=crop&auto=format'
WHERE category = 'baseboards' AND (image_url IS NULL OR image_url = '');

-- elevators
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=640&h=480&fit=crop&auto=format'
WHERE category = 'elevators' AND (image_url IS NULL OR image_url = '');

-- garbage-chute
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=640&h=480&fit=crop&auto=format'
WHERE category = 'garbage-chute' AND (image_url IS NULL OR image_url = '');

-- compactor
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=640&h=480&fit=crop&auto=format'
WHERE category = 'compactor' AND (image_url IS NULL OR image_url = '');

-- outdoor-garbage-bins
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=640&h=480&fit=crop&auto=format'
WHERE category = 'outdoor-garbage-bins' AND (image_url IS NULL OR image_url = '');

-- indoor-garbage-bins
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=640&h=480&fit=crop&auto=format'
WHERE category = 'indoor-garbage-bins' AND (image_url IS NULL OR image_url = '');

-- exterior (driveways, sidewalks power washing)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=640&h=480&fit=crop&auto=format'
WHERE category = 'exterior' AND (image_url IS NULL OR image_url = '');

-- warehouse (warehouse services SRV-101 to SRV-108)
UPDATE catalog_services SET image_url = 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=640&h=480&fit=crop&auto=format'
WHERE category = 'warehouse' AND (image_url IS NULL OR image_url = '');


-- ============================================================
-- 3. ECOSYSTEM VISIBILITY DEFAULTS FOR MGR-001 (Network / Canadian Cleaning Corp)
-- ============================================================

-- Set allowlist mode for products under MGR-001
INSERT INTO catalog_ecosystem_visibility_policies (ecosystem_manager_id, item_type, visibility_mode)
VALUES ('MGR-001', 'product', 'allowlist')
ON CONFLICT (ecosystem_manager_id, item_type) DO UPDATE
  SET visibility_mode = 'allowlist';

-- Set allowlist mode for services under MGR-001
INSERT INTO catalog_ecosystem_visibility_policies (ecosystem_manager_id, item_type, visibility_mode)
VALUES ('MGR-001', 'service', 'allowlist')
ON CONFLICT (ecosystem_manager_id, item_type) DO UPDATE
  SET visibility_mode = 'allowlist';

-- Insert all 153 products into MGR-001 allowlist (PRD-001 to PRD-153)
INSERT INTO catalog_ecosystem_visibility_items (ecosystem_manager_id, item_type, item_code)
SELECT 'MGR-001', 'product', product_id
FROM catalog_products
WHERE product_id ~ '^PRD-\d{3}$'
  AND CAST(SUBSTRING(product_id FROM 5) AS INTEGER) BETWEEN 1 AND 153
ON CONFLICT (ecosystem_manager_id, item_type, item_code) DO NOTHING;

-- Insert all 42 field services into MGR-001 allowlist (SRV-001 to SRV-042)
INSERT INTO catalog_ecosystem_visibility_items (ecosystem_manager_id, item_type, item_code)
SELECT 'MGR-001', 'service', service_id
FROM catalog_services
WHERE service_id ~ '^SRV-0\d{2}$'
  AND CAST(SUBSTRING(service_id FROM 5) AS INTEGER) BETWEEN 1 AND 42
ON CONFLICT (ecosystem_manager_id, item_type, item_code) DO NOTHING;
