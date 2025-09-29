-- Add missing columns to order_items table to match code expectations
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS catalog_item_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS catalog_item_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);