import { query } from './connection';

export async function seedCatalogData() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const seedEnabled = String(process.env.CKS_ENABLE_CATALOG_SEED ?? '') === 'true' || !isProd;

    if (!seedEnabled) {
      console.log('Catalog seeding disabled; skipping sample catalog data.');
      return;
    }

    // Check if catalog_products already has data
    const productCount = await query(`SELECT COUNT(*) as count FROM catalog_products`, []);

    if (productCount.rows[0].count > 0) {
      console.log(`Catalog already has ${productCount.rows[0].count} products, skipping seed`);
      return;
    }

    console.log('Seeding catalog with sample products...');

    // Insert sample products
    await query(`
      INSERT INTO catalog_products (
        product_id, name, description, image_url, tags, category,
        unit_of_measure, base_price, currency, sku, package_size,
        lead_time_days, reorder_point, attributes, metadata, is_active
      ) VALUES
        ('PRD-001', 'Janitorial Starter Kit', 'Complete kit with microfiber tools, neutral cleaner, and safety supplies for onboarding new centers.', NULL, ARRAY['janitorial','bundle'], 'supplies', 'kit', 189.00, 'USD', 'SKU-PRD-001', 'Kit: mop, bucket, cloths, neutral cleaner', 5, 15, '{"case_qty": 1}'::jsonb, '{"category": "janitorial"}'::jsonb, TRUE),
        ('PRD-002', 'Microfiber Mop System', 'Commercial-grade microfiber flat mop with ergonomic handle and refill pads.', NULL, ARRAY['janitorial'], 'supplies', 'set', 45.00, 'USD', 'SKU-PRD-002', 'Set: frame + handle + 4 pads', 4, 12, '{"replacement_pad_sku": "SKU-PRD-002A"}'::jsonb, '{"category": "janitorial"}'::jsonb, TRUE),
        ('PRD-003', 'HEPA Vacuum Bags', 'Replacement HEPA vacuum bags compatible with CKS standard backpack vacuums (box of 10).', NULL, ARRAY['supplies','vacuum'], 'materials', 'box', 32.00, 'USD', 'SKU-PRD-003', 'Box of 10 HEPA bags', 7, 20, '{"compatible_model": "CKS-BP200"}'::jsonb, '{"category": "maintenance"}'::jsonb, TRUE),
        ('PRD-004', 'Citrus Degreaser Concentrate', 'Highly concentrated citrus-based degreaser for kitchens and maintenance bays.', NULL, ARRAY['chemicals','kitchen'], 'chemicals', 'gallon', 58.00, 'USD', 'SKU-PRD-004', '4 x 1 gallon concentrate', 6, 10, '{"dilution_ratio": "1:20"}'::jsonb, '{"category": "chemicals"}'::jsonb, TRUE),
        ('PRD-005', 'Glass & Mirror Cleaner', 'Streak-free cleaner for glass, mirrors, and chrome fixtures (case of 6).', NULL, ARRAY['chemicals','front-of-house'], 'chemicals', 'case', 24.00, 'USD', 'SKU-PRD-005', '6 x 1 litre bottles', 3, 18, '{"ready_to_use": true}'::jsonb, '{"category": "chemicals"}'::jsonb, TRUE),
        ('PRD-006', 'High-Gloss Floor Finish (5 gal)', 'Metal-interlock finish for resilient flooring, ideal for quarterly refreshes.', NULL, ARRAY['chemicals','floor-care'], 'chemicals', 'pail', 82.00, 'USD', 'SKU-PRD-006', '5 gallon pail', 10, 8, '{"coverage_sqft": 2500}'::jsonb, '{"category": "floor-care"}'::jsonb, TRUE),
        ('PRD-007', 'Contractor Trash Liners (55 gal)', 'Heavy-duty 3 mil liners for high-traffic sites (roll of 50).', NULL, ARRAY['supplies','waste'], 'supplies', 'roll', 38.00, 'USD', 'SKU-PRD-007', 'Roll of 50 liners', 3, 25, '{"gallon_capacity": 55}'::jsonb, '{"category": "supplies"}'::jsonb, TRUE),
        ('PRD-008', 'Disinfectant Wipes Case', 'EPA-registered disinfectant wipes for high-touch wiping (6 canisters per case).', NULL, ARRAY['ppe','infection-control'], 'supplies', 'case', 54.00, 'USD', 'SKU-PRD-008', 'Case of 6 x 75 count canisters', 4, 16, '{"epa_registration": "CKS-7852A"}'::jsonb, '{"category": "infection-control"}'::jsonb, TRUE),
        ('PRD-009', 'Auto-Scrubber Pads (17 inches)', 'Medium-aggressive pads for daily scrubbing with auto-scrubbers (case of 5).', NULL, ARRAY['floor-care','equipment'], 'materials', 'case', 40.00, 'USD', 'SKU-PRD-009', 'Case of 5 pads (17 inches)', 5, 12, '{"pad_grade": "medium"}'::jsonb, '{"category": "floor-care"}'::jsonb, TRUE),
        ('PRD-010', 'Restroom Essentials Combo', 'Bundle of paper towels, toilet tissue, seat covers, and soap refills.', NULL, ARRAY['restroom','bundle'], 'supplies', 'kit', 96.00, 'USD', 'SKU-PRD-010', 'Complete restroom bundle', 5, 14, '{"bundle_items": 4}'::jsonb, '{"category": "restroom"}'::jsonb, TRUE)
      ON CONFLICT (product_id) DO NOTHING
    `, []);

    // Insert sample services
    await query(`
      INSERT INTO catalog_services (
        service_id, name, description, image_url, tags, category,
        unit_of_measure, base_price, currency, duration_minutes,
        service_window, crew_required, attributes, metadata, is_active
      ) VALUES
        ('SRV-001', 'Daily Cleaning Service', 'Standard daily cleaning for offices and common areas', NULL, ARRAY['cleaning','daily'], 'cleaning', 'hour', 45.00, 'USD', 120, 'evening', 2, '{"frequency": "daily"}'::jsonb, '{"category": "cleaning"}'::jsonb, TRUE),
        ('SRV-002', 'Deep Clean Service', 'Comprehensive deep cleaning service for thorough sanitization', NULL, ARRAY['cleaning','deep'], 'cleaning', 'service', 350.00, 'USD', 240, 'weekend', 4, '{"frequency": "monthly"}'::jsonb, '{"category": "cleaning"}'::jsonb, TRUE),
        ('SRV-003', 'Floor Stripping & Waxing', 'Professional floor stripping and waxing service', NULL, ARRAY['floor-care','specialty'], 'floor-care', 'sq-ft', 0.35, 'USD', 360, 'overnight', 3, '{"equipment_required": true}'::jsonb, '{"category": "floor-care"}'::jsonb, TRUE),
        ('SRV-004', 'Window Cleaning', 'Interior and exterior window cleaning service', NULL, ARRAY['cleaning','windows'], 'cleaning', 'service', 200.00, 'USD', 180, 'morning', 2, '{"height_limit": "3_story"}'::jsonb, '{"category": "specialty"}'::jsonb, TRUE),
        ('SRV-005', 'Carpet Cleaning', 'Hot water extraction carpet cleaning', NULL, ARRAY['carpet','specialty'], 'floor-care', 'sq-ft', 0.25, 'USD', 240, 'daytime', 2, '{"drying_time": "4_hours"}'::jsonb, '{"category": "floor-care"}'::jsonb, TRUE)
      ON CONFLICT (service_id) DO NOTHING
    `, []);

    const finalProductCount = await query(`SELECT COUNT(*) as count FROM catalog_products`, []);
    const serviceCount = await query(`SELECT COUNT(*) as count FROM catalog_services`, []);

    console.log(`Catalog seeded with ${finalProductCount.rows[0].count} products and ${serviceCount.rows[0].count} services`);

    // Record creation activities for any new rows (idempotent)
    await query(
      `INSERT INTO system_activity (
         activity_type, description, actor_id, actor_role,
         target_id, target_type, metadata, created_at
       )
       SELECT
         'product_created',
         'Seeded ' || p.product_id,
         'ADMIN',
         'admin',
         p.product_id,
         'product',
         jsonb_build_object('productName', p.name, 'origin', 'seed'),
         COALESCE(p.created_at, NOW())
       FROM catalog_products p
       WHERE NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'product_created'
           AND UPPER(sa.target_id) = UPPER(p.product_id)
           AND sa.target_type = 'product'
       )`,
      [],
    );

    await query(
      `INSERT INTO system_activity (
         activity_type, description, actor_id, actor_role,
         target_id, target_type, metadata, created_at
       )
       SELECT
         'catalog_service_created',
         'Seeded ' || s.service_id,
         'ADMIN',
         'admin',
         s.service_id,
         'catalogService',
         jsonb_build_object('serviceName', s.name, 'origin', 'seed'),
         COALESCE(s.created_at, NOW())
       FROM catalog_services s
       WHERE NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'catalog_service_created'
           AND UPPER(sa.target_id) = UPPER(s.service_id)
           AND sa.target_type = 'catalogService'
       )`,
      [],
    );
  } catch (error) {
    console.error('Error seeding catalog data:', error);
    // Don't throw - allow the app to start even if seeding fails
  }
}
