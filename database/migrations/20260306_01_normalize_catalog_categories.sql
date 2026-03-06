-- Migration: 20260306_01_normalize_catalog_categories
-- Purpose:
--   1) Collapse legacy garbage bag product categories into "garbage-bags"
--   2) Ensure Daily Maintaining Cleaning service is categorized as "daily"
-- Idempotent: YES

-- 1) Products: normalize "garbage-bags-clear" style variants into "garbage-bags"
UPDATE catalog_products
SET
  category = 'garbage-bags',
  metadata = CASE
    WHEN metadata IS NULL THEN jsonb_build_object('category', 'garbage-bags')
    ELSE jsonb_set(metadata, '{category}', '"garbage-bags"'::jsonb, true)
  END,
  updated_at = NOW()
WHERE (
  regexp_replace(lower(coalesce(category, '')), '[^a-z0-9]+', '-', 'g') = 'garbage-bags-clear'
  OR regexp_replace(lower(coalesce(metadata->>'category', '')), '[^a-z0-9]+', '-', 'g') = 'garbage-bags-clear'
  OR regexp_replace(lower(coalesce(category, '')), '[^a-z0-9]+', '-', 'g') = 'garbage-bags'
);

-- 2) Services: enforce SRV-001 as "daily"
UPDATE catalog_services
SET
  category = 'daily',
  metadata = CASE
    WHEN metadata IS NULL THEN jsonb_build_object('category', 'daily')
    ELSE jsonb_set(metadata, '{category}', '"daily"'::jsonb, true)
  END,
  updated_at = NOW()
WHERE
  upper(service_id) = 'SRV-001'
  OR regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g') = 'daily-maintaining-cleaning';
