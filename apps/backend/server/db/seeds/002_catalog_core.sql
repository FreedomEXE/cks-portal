DO $$
BEGIN
  IF to_regclass('public.catalog_products') IS NULL OR to_regclass('public.catalog_services') IS NULL THEN
    RAISE NOTICE 'catalog tables not present; skipping catalog seed';
    RETURN;
  END IF;

  INSERT INTO catalog_products (
    product_id,
    name,
    description,
    image_url,
    tags,
    category,
    unit_of_measure,
    base_price,
    currency,
    sku,
    package_size,
    lead_time_days,
    reorder_point,
    attributes,
    metadata,
    is_active
  ) VALUES
    ('PRD-001', 'Janitorial Starter Kit', 'Complete kit with microfiber tools, neutral cleaner, and safety supplies for onboarding new centers.', NULL, ARRAY['janitorial','bundle'], 'supplies', 'kit', 189.00, 'USD', 'SKU-PRD-001', 'Kit: mop, bucket, cloths, neutral cleaner', 5, 15, jsonb_build_object('case_qty', 1), jsonb_build_object('category', 'janitorial'), TRUE),
    ('PRD-002', 'Microfiber Mop System', 'Commercial-grade microfiber flat mop with ergonomic handle and refill pads.', NULL, ARRAY['janitorial'], 'supplies', 'set', 45.00, 'USD', 'SKU-PRD-002', 'Set: frame + handle + 4 pads', 4, 12, jsonb_build_object('replacement_pad_sku', 'SKU-PRD-002A'), jsonb_build_object('category', 'janitorial'), TRUE),
    ('PRD-003', 'HEPA Vacuum Bags', 'Replacement HEPA vacuum bags compatible with CKS standard backpack vacuums (box of 10).', NULL, ARRAY['supplies','vacuum'], 'materials', 'box', 32.00, 'USD', 'SKU-PRD-003', 'Box of 10 HEPA bags', 7, 20, jsonb_build_object('compatible_model', 'CKS-BP200'), jsonb_build_object('category', 'maintenance'), TRUE),
    ('PRD-004', 'Citrus Degreaser Concentrate', 'Highly concentrated citrus-based degreaser for kitchens and maintenance bays.', NULL, ARRAY['chemicals','kitchen'], 'chemicals', 'gallon', 58.00, 'USD', 'SKU-PRD-004', '4 x 1 gallon concentrate', 6, 10, jsonb_build_object('dilution_ratio', '1:20'), jsonb_build_object('category', 'chemicals'), TRUE),
    ('PRD-005', 'Glass & Mirror Cleaner', 'Streak-free cleaner for glass, mirrors, and chrome fixtures (case of 6).', NULL, ARRAY['chemicals','front-of-house'], 'chemicals', 'case', 24.00, 'USD', 'SKU-PRD-005', '6 x 1 litre bottles', 3, 18, jsonb_build_object('ready_to_use', TRUE), jsonb_build_object('category', 'chemicals'), TRUE),
    ('PRD-006', 'High-Gloss Floor Finish (5 gal)', 'Metal-interlock finish for resilient flooring, ideal for quarterly refreshes.', NULL, ARRAY['chemicals','floor-care'], 'chemicals', 'pail', 82.00, 'USD', 'SKU-PRD-006', '5 gallon pail', 10, 8, jsonb_build_object('coverage_sqft', 2500), jsonb_build_object('category', 'floor-care'), TRUE),
    ('PRD-007', 'Contractor Trash Liners (55 gal)', 'Heavy-duty 3 mil liners for high-traffic sites (roll of 50).', NULL, ARRAY['supplies','waste'], 'supplies', 'roll', 38.00, 'USD', 'SKU-PRD-007', 'Roll of 50 liners', 3, 25, jsonb_build_object('gallon_capacity', 55), jsonb_build_object('category', 'supplies'), TRUE),
    ('PRD-008', 'Disinfectant Wipes Case', 'EPA-registered disinfectant wipes for high-touch wiping (6 canisters per case).', NULL, ARRAY['ppe','infection-control'], 'supplies', 'case', 54.00, 'USD', 'SKU-PRD-008', 'Case of 6 x 75 count canisters', 4, 16, jsonb_build_object('epa_registration', 'CKS-7852A'), jsonb_build_object('category', 'infection-control'), TRUE),
    ('PRD-009', 'Auto-Scrubber Pads (17 inches)', 'Medium-aggressive pads for daily scrubbing with auto-scrubbers (case of 5).', NULL, ARRAY['floor-care','equipment'], 'materials', 'case', 40.00, 'USD', 'SKU-PRD-009', 'Case of 5 pads (17 inches)', 5, 12, jsonb_build_object('pad_grade', 'medium'), jsonb_build_object('category', 'floor-care'), TRUE),
    ('PRD-010', 'Restroom Essentials Combo', 'Bundle of paper towels, toilet tissue, seat covers, and soap refills.', NULL, ARRAY['restroom','bundle'], 'supplies', 'kit', 96.00, 'USD', 'SKU-PRD-010', 'Complete restroom bundle', 5, 14, jsonb_build_object('bundle_items', 4), jsonb_build_object('category', 'restroom'), TRUE)
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    base_price = EXCLUDED.base_price,
    currency = EXCLUDED.currency,
    sku = EXCLUDED.sku,
    package_size = EXCLUDED.package_size,
    lead_time_days = EXCLUDED.lead_time_days,
    reorder_point = EXCLUDED.reorder_point,
    attributes = EXCLUDED.attributes,
    metadata = EXCLUDED.metadata,
    is_active = EXCLUDED.is_active;

  INSERT INTO catalog_services (
    service_id,
    name,
    description,
    image_url,
    tags,
    category,
    unit_of_measure,
    base_price,
    currency,
    duration_minutes,
    service_window,
    crew_required,
    attributes,
    metadata,
    is_active
  ) VALUES
    ('SRV-001', 'Nightly Janitorial Service', 'Crew-led nightly janitorial reset covering trash, restrooms, floors, and checkpoints.', NULL, ARRAY['janitorial','nightly'], 'janitorial', 'service', 250.00, 'USD', 180, 'Nightly after closing', 3, jsonb_build_object('includes_supply_restock', true), jsonb_build_object('category', 'janitorial'), TRUE),
    ('SRV-002', 'Quarterly Floor Refinish', 'Strip, neutralize, and refinish resilient floors with high-gloss finish.', NULL, ARRAY['floor-care'], 'floor-care', 'service', 620.00, 'USD', 420, 'Scheduled with manager approval', 4, jsonb_build_object('equipment', 'burnisher + scrubber'), jsonb_build_object('category', 'floor-care'), TRUE),
    ('SRV-003', 'HVAC Filter Replacement', 'Replace standard HVAC filters and inspect RTUs for dust/debris.', NULL, ARRAY['maintenance','hvac'], 'maintenance', 'service', 180.00, 'USD', 120, 'Weekdays 7am-5pm', 2, jsonb_build_object('filters_included', true), jsonb_build_object('category', 'maintenance'), TRUE),
    ('SRV-004', 'Deep Carpet Extraction', 'Hot water extraction for carpeted areas, includes pre-treatment and grooming.', NULL, ARRAY['floor-care','carpet'], 'floor-care', 'service', 420.00, 'USD', 240, 'Weekdays 6pm-2am', 3, jsonb_build_object('dry_time_hours', 6), jsonb_build_object('category', 'floor-care'), TRUE),
    ('SRV-005', 'Exterior Pressure Washing', 'Pressure wash exterior entrances, walkways, and loading pads.', NULL, ARRAY['exterior','pressure-wash'], 'exterior', 'service', 550.00, 'USD', 300, 'Weekends or off-hours', 3, jsonb_build_object('equipment', 'pressure rig + generator'), jsonb_build_object('category', 'exterior'), TRUE),
    ('SRV-006', 'Post-Event Reset', 'Crew reset after special events, including trash removal, spot cleaning, and disinfecting high-touch zones.', NULL, ARRAY['events','janitorial'], 'janitorial', 'service', 300.00, 'USD', 210, 'As scheduled post event', 2, jsonb_build_object('includes_waste_removal', true), jsonb_build_object('category', 'events'), TRUE),
    ('SRV-007', 'High Dusting Service', 'Lift-assisted high dusting for rafters, vents, and fixtures up to 30 ft.', NULL, ARRAY['maintenance','dusting'], 'maintenance', 'service', 275.00, 'USD', 150, 'Weekdays 5am-10am', 2, jsonb_build_object('max_height_ft', 30), jsonb_build_object('category', 'maintenance'), TRUE),
    ('SRV-008', 'Kitchen Degrease & Sanitize', 'Comprehensive BOH kitchen degrease focused on hoods, walls, and floors.', NULL, ARRAY['kitchen','degrease'], 'kitchen', 'service', 360.00, 'USD', 300, 'Weekdays 10pm-6am', 3, jsonb_build_object('hood_certified', true), jsonb_build_object('category', 'kitchen'), TRUE),
    ('SRV-009', 'Preventative Maintenance Inspection', 'PM inspection with punch list for janitorial equipment and consumables.', NULL, ARRAY['maintenance','inspection'], 'maintenance', 'service', 295.00, 'USD', 180, 'Coordinator scheduled', 2, jsonb_build_object('report_delivery', 'PDF + dashboard entry'), jsonb_build_object('category', 'maintenance'), TRUE),
    ('SRV-010', 'Emergency Spill Response', 'Rapid response team for chemical or bio spill containment and remediation.', NULL, ARRAY['emergency','hazmat'], 'emergency', 'service', 195.00, 'USD', 120, '24/7 on-call', 2, jsonb_build_object('ppe_level', 'hazmat'), jsonb_build_object('category', 'emergency'), TRUE)
  ON CONFLICT (service_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    base_price = EXCLUDED.base_price,
    currency = EXCLUDED.currency,
    duration_minutes = EXCLUDED.duration_minutes,
    service_window = EXCLUDED.service_window,
    crew_required = EXCLUDED.crew_required,
    attributes = EXCLUDED.attributes,
    metadata = EXCLUDED.metadata,
    is_active = EXCLUDED.is_active;
END $$;
