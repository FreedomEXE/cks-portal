-- Migration: 20260305_03_network_supply_list_products_and_visibility
-- 1. Add 16 missing products from the Canadian Cleaning Corporation Network supply list
-- 2. Reset MGR-001 product allowlist to ONLY show the 36 products on the spreadsheet
-- 3. Keep MGR-001 service allowlist at SRV-001 to SRV-042 (unchanged)

-- ============================================================
-- 1. INSERT MISSING PRODUCTS (PRD-154 to PRD-169)
-- ============================================================

INSERT INTO catalog_products (product_id, name, description, category, package_size, unit_of_measure, base_price, is_active)
VALUES
  ('PRD-154', 'Clorox Bleach', 'Clorox liquid bleach for disinfection and cleaning', 'cleaning-solutions', '3.58 L', 'unit', 11.49, true),
  ('PRD-155', 'Allens White Vinegar', 'Multi-purpose white vinegar for cleaning', 'cleaning-solutions', '4/Case', 'case', 26.99, true),
  ('PRD-156', 'Impact Commercial Dishwashing Machine Detergent', 'Commercial-grade dishwasher detergent', 'cleaning-solutions', '4 L', 'unit', 12.99, true),
  ('PRD-157', 'Impact Rinse Aid', 'Commercial dishwasher rinse aid', 'cleaning-solutions', '4 L', 'unit', 13.99, true),
  ('PRD-158', 'M2 Synray 16 oz. Mop Heads', 'Synthetic rayon mop head, 16 oz', 'cleaning-equipment', 'Each', 'unit', 5.99, true),
  ('PRD-159', '8 oz. Hot Drink Paper Cups', 'Disposable paper cups for hot beverages', 'kitchen-products', '1000/Case', 'case', 46.99, true),
  ('PRD-160', '9" Bagasse Plates', 'Eco-friendly compostable bagasse plates, 9 inch', 'kitchen-products', '500/Case', 'case', 46.99, true),
  ('PRD-161', 'Medium Weight Teaspoons', 'Disposable medium weight plastic teaspoons', 'kitchen-products', '1000/Case', 'case', 17.99, true),
  ('PRD-162', 'Medium Weight Forks', 'Disposable medium weight plastic forks', 'kitchen-products', '1000/Case', 'case', 17.99, true),
  ('PRD-163', 'Medium Weight Knives', 'Disposable medium weight plastic knives', 'kitchen-products', '1000/Case', 'case', 17.99, true),
  ('PRD-164', 'N062 Cascades Dinner Napkins 2 Ply', 'Cascades premium 2-ply dinner napkins', 'kitchen-products', '3000/Case', 'case', 79.99, true),
  ('PRD-165', 'Luncheon Napkin 1 Ply', 'Economy 1-ply luncheon napkins', 'kitchen-products', '6000/Case', 'case', 59.99, true),
  ('PRD-166', 'Junior Dispenser Napkin 1 Ply', 'Compact dispenser napkins, 1 ply', 'kitchen-products', '9000/Case', 'case', 39.99, true),
  ('PRD-167', 'Ziploc Bags Small (17.7 cm x 18.8 cm)', 'Resealable sandwich-size storage bags', 'kitchen-products', '60/Box', 'box', 9.65, true),
  ('PRD-168', 'Ziploc Bags Large (26.8 cm x 27.3 cm)', 'Resealable large storage bags', 'kitchen-products', '50/Box', 'box', 11.09, true),
  ('PRD-169', 'Baking Soda', 'Multi-purpose baking soda for cleaning and deodorizing', 'kitchen-products', '500 Grams', 'unit', 4.50, true)
ON CONFLICT (product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  package_size = EXCLUDED.package_size,
  unit_of_measure = EXCLUDED.unit_of_measure,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active;

-- Set images for the new products (same category-based images)
UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=640&h=480&fit=crop&auto=format'
WHERE product_id IN ('PRD-154', 'PRD-155', 'PRD-156', 'PRD-157') AND (image_url IS NULL OR image_url = '');

UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=640&h=480&fit=crop&auto=format'
WHERE product_id = 'PRD-158' AND (image_url IS NULL OR image_url = '');

UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=640&h=480&fit=crop&auto=format'
WHERE product_id IN ('PRD-159', 'PRD-160', 'PRD-161', 'PRD-162', 'PRD-163', 'PRD-164', 'PRD-165', 'PRD-166', 'PRD-167', 'PRD-168', 'PRD-169') AND (image_url IS NULL OR image_url = '');

UPDATE catalog_products SET image_url = 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=640&h=480&fit=crop&auto=format'
WHERE product_id IN ('PRD-158') AND (image_url IS NULL OR image_url = '');

-- ============================================================
-- 2. RESET MGR-001 PRODUCT ALLOWLIST TO MATCH SPREADSHEET ONLY
-- ============================================================
-- The spreadsheet has exactly 37 line items mapping to 36 unique product IDs
-- (Vinyl Gloves Medium/Large both map to PRD-092)

-- Clear existing product allowlist for MGR-001
DELETE FROM catalog_ecosystem_visibility_items
WHERE ecosystem_manager_id = 'MGR-001' AND item_type = 'product';

-- Insert only the 36 products from the Network supply list
INSERT INTO catalog_ecosystem_visibility_items (ecosystem_manager_id, item_type, item_code)
VALUES
  -- GARBAGE BAGS (2 items from spreadsheet)
  ('MGR-001', 'product', 'PRD-001'),  -- 22X24 Black Garbage Bags Regular
  ('MGR-001', 'product', 'PRD-006'),  -- 35X47 Black Garbage Bags Strong
  -- GARBAGE BAGS (clear variants, 2 items)
  ('MGR-001', 'product', 'PRD-012'),  -- 22X24 Clear Garbage Bags Regular
  ('MGR-001', 'product', 'PRD-015'),  -- 35X47 Clear Garbage Bags Strong
  -- CHEMICALS (14 items)
  ('MGR-001', 'product', 'PRD-024'),  -- Lemon Neutral Cleaner
  ('MGR-001', 'product', 'PRD-033'),  -- Windex Original
  ('MGR-001', 'product', 'PRD-154'),  -- Clorox Bleach (NEW)
  ('MGR-001', 'product', 'PRD-044'),  -- Clean Sensation HE Liquid Laundry Detergent
  ('MGR-001', 'product', 'PRD-052'),  -- Bounce Sheets
  ('MGR-001', 'product', 'PRD-062'),  -- 03024 Dawn Professional Pot and Pan Detergent
  ('MGR-001', 'product', 'PRD-070'),  -- Soft Soap Aloe Vera Moisturizing Hand Soap
  ('MGR-001', 'product', 'PRD-155'),  -- Allens White Vinegar (NEW)
  ('MGR-001', 'product', 'PRD-156'),  -- Impact Commercial Dishwashing Machine Detergent (NEW)
  ('MGR-001', 'product', 'PRD-157'),  -- Impact Rinse Aid (NEW)
  -- CLEANING EQUIPMENT (9 items)
  ('MGR-001', 'product', 'PRD-158'),  -- M2 Synray 16 oz. Mop Heads (NEW)
  ('MGR-001', 'product', 'PRD-078'),  -- Angle Broom
  ('MGR-001', 'product', 'PRD-092'),  -- Vinyl Gloves 4 Mil (covers Medium + Large)
  ('MGR-001', 'product', 'PRD-094'),  -- Green Scouring Pads
  ('MGR-001', 'product', 'PRD-095'),  -- Green/Yellow Sponge
  ('MGR-001', 'product', 'PRD-097'),  -- Hard Toilet Brush with Cup
  ('MGR-001', 'product', 'PRD-101'),  -- Blue Shoe Cover
  ('MGR-001', 'product', 'PRD-080'),  -- Globe Lobby Dust Pan
  -- FACIAL TISSUE (1 item)
  ('MGR-001', 'product', 'PRD-134'),  -- Snow Soft Facial 100 Sheets
  -- KITCHEN PRODUCTS (12 items)
  ('MGR-001', 'product', 'PRD-139'),  -- Aluminum Foil Paper 45 cm X 100 m
  ('MGR-001', 'product', 'PRD-159'),  -- 8 oz. Hot Drink Paper Cups (NEW)
  ('MGR-001', 'product', 'PRD-160'),  -- 9" Bagasse Plates (NEW)
  ('MGR-001', 'product', 'PRD-161'),  -- Medium Weight Teaspoons (NEW)
  ('MGR-001', 'product', 'PRD-162'),  -- Medium Weight Forks (NEW)
  ('MGR-001', 'product', 'PRD-163'),  -- Medium Weight Knives (NEW)
  ('MGR-001', 'product', 'PRD-164'),  -- N062 Cascades Dinner Napkins 2 Ply (NEW)
  ('MGR-001', 'product', 'PRD-165'),  -- Luncheon Napkin 1 Ply (NEW)
  ('MGR-001', 'product', 'PRD-166'),  -- Junior Dispenser Napkin 1 Ply (NEW)
  ('MGR-001', 'product', 'PRD-167'),  -- Ziploc Bags Small (NEW)
  ('MGR-001', 'product', 'PRD-168'),  -- Ziploc Bags Large (NEW)
  ('MGR-001', 'product', 'PRD-169'),  -- Baking Soda (NEW)
  -- SAFETY PRODUCTS (1 item)
  ('MGR-001', 'product', 'PRD-147')   -- Yellow Dish Gloves
ON CONFLICT (ecosystem_manager_id, item_type, item_code) DO NOTHING;

-- ============================================================
-- 3. VERIFY: Service allowlist stays as-is (SRV-001 to SRV-042)
-- ============================================================
-- No changes needed for services. The existing allowlist for MGR-001
-- already includes SRV-001 through SRV-042 from the previous migration.
