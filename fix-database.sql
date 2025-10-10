-- Run this in Beekeeper to fix missing columns/tables
-- Safe to run multiple times (idempotent)

BEGIN;

-- 1. Fix orders table - add missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='description') THEN
        ALTER TABLE orders ADD COLUMN description TEXT;
        UPDATE orders SET description = COALESCE(title, 'Order') WHERE description IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='destination_center') THEN
        ALTER TABLE orders ADD COLUMN destination_center TEXT;
        UPDATE orders SET destination_center = destination WHERE destination_center IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='warehouse_id') THEN
        ALTER TABLE orders ADD COLUMN warehouse_id TEXT;
        UPDATE orders SET warehouse_id = assigned_warehouse WHERE warehouse_id IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_warehouse_id ON orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_orders_destination_center ON orders(destination_center);

-- 2. Fix warehouses table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='warehouses' AND column_name='status') THEN
        ALTER TABLE warehouses ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='warehouses' AND column_name='manager_id') THEN
        ALTER TABLE warehouses ADD COLUMN manager_id TEXT;
    END IF;
END $$;

-- 3. Fix crew table - add manager reference
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='crew' AND column_name='cks_manager') THEN
        ALTER TABLE crew ADD COLUMN cks_manager TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crew_cks_manager ON crew(cks_manager);

-- 4. Create inventory tables if missing
CREATE TABLE IF NOT EXISTS inventory_items (
    warehouse_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (warehouse_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_wh ON inventory_items(warehouse_id);

-- Create inventory view (backend expects this)
CREATE OR REPLACE VIEW inventory AS
SELECT
    warehouse_id,
    item_id AS product_id,
    item_name AS product_name,
    quantity_on_hand AS quantity,
    min_stock_level AS minimum_stock_level
FROM inventory_items;

COMMIT;

-- Verify the changes
SELECT 'Orders columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('description', 'destination_center', 'warehouse_id');

SELECT 'Warehouses columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'warehouses' AND column_name IN ('status', 'manager_id');

SELECT 'Crew columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'crew' AND column_name = 'cks_manager';

SELECT 'Inventory check:' as info;
SELECT COUNT(*) as inventory_items_count FROM inventory_items;
