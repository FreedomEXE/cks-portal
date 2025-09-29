-- Add missing line_number column to order_items if it doesn't exist
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS line_number INTEGER NOT NULL DEFAULT 1;

-- Add unique constraint if it doesn't exist
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_order_id_line_number_key;
ALTER TABLE order_items
  ADD CONSTRAINT order_items_order_id_line_number_unique
  UNIQUE(order_id, line_number);