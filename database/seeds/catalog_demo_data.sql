-- Demo catalog seed data
INSERT INTO catalog_items (item_code, name, item_type, description, image_url, tags, unit_of_measure, base_price, currency, metadata)
VALUES
  ('PRD-GLOVES-001', 'Nitrile Gloves', 'product', 'Powder-free nitrile examination gloves (box of 100).', NULL, ARRAY['ppe','medical'], 'box', 12.50, 'USD', jsonb_build_object('sku', 'PRD1001')),
  ('PRD-TESTKIT-001', 'Antigen Test Kit', 'product', 'Rapid antigen testing kit for onsite screening.', NULL, ARRAY['testing','diagnostics'], 'kit', 38.00, 'USD', jsonb_build_object('sku', 'PRD1010')),
  ('PRD-MASKS-001', '3-Ply Masks', 'product', 'Disposable 3-ply face masks (pack of 50).', NULL, ARRAY['ppe'], 'pack', 9.99, 'USD', jsonb_build_object('sku', 'PRD1020')),
  ('PRD-SANITIZER-001', 'Hand Sanitizer', 'product', '80% alcohol hand sanitizer, 500ml bottles.', NULL, ARRAY['hygiene'], 'bottle', 4.75, 'USD', jsonb_build_object('sku', 'PRD1030')),
  ('SRV-CLEAN-001', 'Equipment Deep Clean', 'service', 'Comprehensive cleaning and disinfection for medical equipment.', NULL, ARRAY['cleaning','maintenance'], 'service', 185.00, 'USD', jsonb_build_object('category', 'cleaning')),
  ('SRV-TRAIN-001', 'Onsite Training Session', 'service', 'Half-day operational training for center staff.', NULL, ARRAY['training'], 'session', 450.00, 'USD', jsonb_build_object('category', 'training')),
  ('SRV-AUDIT-001', 'Inventory Audit', 'service', 'Full-day onsite inventory audit with reconciliation report.', NULL, ARRAY['audit','inventory'], 'engagement', 620.00, 'USD', jsonb_build_object('category', 'audit'))
ON CONFLICT (item_code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  unit_of_measure = EXCLUDED.unit_of_measure,
  base_price = EXCLUDED.base_price,
  currency = EXCLUDED.currency,
  metadata = EXCLUDED.metadata,
  is_active = TRUE,
  updated_at = NOW();

-- Product detail enrichment
INSERT INTO catalog_product_details (item_id, sku, package_size, lead_time_days, reorder_point, attributes)
SELECT id, metadata->>'sku',
       CASE item_code
         WHEN 'PRD-GLOVES-001' THEN 'Box of 100'
         WHEN 'PRD-TESTKIT-001' THEN 'Single kit'
         WHEN 'PRD-MASKS-001' THEN 'Pack of 50'
         WHEN 'PRD-SANITIZER-001' THEN '500ml bottle'
         ELSE NULL
       END,
       CASE item_code
         WHEN 'PRD-GLOVES-001' THEN 5
         WHEN 'PRD-TESTKIT-001' THEN 7
         WHEN 'PRD-MASKS-001' THEN 3
         WHEN 'PRD-SANITIZER-001' THEN 2
         ELSE NULL
       END,
       CASE item_code
         WHEN 'PRD-GLOVES-001' THEN 20
         WHEN 'PRD-TESTKIT-001' THEN 10
         WHEN 'PRD-MASKS-001' THEN 30
         WHEN 'PRD-SANITIZER-001' THEN 25
         ELSE NULL
       END,
       jsonb_build_object('compliance', 'CKS-2025')
FROM catalog_items
WHERE item_code IN ('PRD-GLOVES-001','PRD-TESTKIT-001','PRD-MASKS-001','PRD-SANITIZER-001')
ON CONFLICT (item_id) DO UPDATE
SET
  sku = EXCLUDED.sku,
  package_size = EXCLUDED.package_size,
  lead_time_days = EXCLUDED.lead_time_days,
  reorder_point = EXCLUDED.reorder_point,
  attributes = EXCLUDED.attributes;

-- Service detail enrichment
INSERT INTO catalog_service_details (item_id, duration_minutes, service_window, attributes)
SELECT id,
       CASE item_code
         WHEN 'SRV-CLEAN-001' THEN 120
         WHEN 'SRV-TRAIN-001' THEN 240
         WHEN 'SRV-AUDIT-001' THEN 480
         ELSE NULL
       END,
       CASE item_code
         WHEN 'SRV-CLEAN-001' THEN 'Mon-Fri, 8am-6pm'
         WHEN 'SRV-TRAIN-001' THEN 'Scheduled by manager'
         WHEN 'SRV-AUDIT-001' THEN 'Requires 2 week notice'
         ELSE NULL
       END,
       jsonb_build_object('required_staff', CASE item_code WHEN 'SRV-TRAIN-001' THEN 2 ELSE 1 END)
FROM catalog_items
WHERE item_code IN ('SRV-CLEAN-001','SRV-TRAIN-001','SRV-AUDIT-001')
ON CONFLICT (item_id) DO UPDATE
SET
  duration_minutes = EXCLUDED.duration_minutes,
  service_window = EXCLUDED.service_window,
  attributes = EXCLUDED.attributes;
