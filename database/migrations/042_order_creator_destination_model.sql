-- Migration to implement creator/destination model for orders
-- This aligns with the ORDER_DATA_MODEL.md specification

-- Step 1: Rename existing fields for clarity
ALTER TABLE orders
  RENAME COLUMN created_by TO creator_id;
ALTER TABLE orders
  RENAME COLUMN created_by_role TO creator_role;

-- Step 2: Make creator fields NOT NULL since every order must have a creator
ALTER TABLE orders
  ALTER COLUMN creator_id SET NOT NULL;
ALTER TABLE orders
  ALTER COLUMN creator_role SET NOT NULL;

-- Step 3: Add next_actor_id field to track specific actor (not just role)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS next_actor_id TEXT;

-- Step 4: Update order_participants table structure
-- First drop the old structure if it exists
ALTER TABLE order_participants
  DROP COLUMN IF EXISTS role;
ALTER TABLE order_participants
  DROP COLUMN IF EXISTS cks_code;

-- Add the new columns following the data model spec
ALTER TABLE order_participants
  ADD COLUMN IF NOT EXISTS participant_id TEXT NOT NULL;
ALTER TABLE order_participants
  ADD COLUMN IF NOT EXISTS participant_role TEXT NOT NULL;
ALTER TABLE order_participants
  ALTER COLUMN participation_type TYPE TEXT;

-- Update the participation_type check constraint
ALTER TABLE order_participants
  DROP CONSTRAINT IF EXISTS order_participants_participation_type_check;
ALTER TABLE order_participants
  ADD CONSTRAINT order_participants_participation_type_check
  CHECK (participation_type IN ('creator', 'destination', 'actor', 'watcher'));

-- Drop and recreate the unique constraint with new columns
ALTER TABLE order_participants
  DROP CONSTRAINT IF EXISTS order_participants_order_id_role_cks_code_key;
ALTER TABLE order_participants
  ADD CONSTRAINT order_participants_unique
  UNIQUE (order_id, participant_id, participant_role);

-- Step 5: Update indexes
DROP INDEX IF EXISTS idx_orders_created_by;
CREATE INDEX IF NOT EXISTS idx_orders_creator ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_destination ON orders(destination);

-- Step 6: Add index for order_participants
CREATE INDEX IF NOT EXISTS idx_order_participants_order ON order_participants(order_id);
CREATE INDEX IF NOT EXISTS idx_order_participants_participant ON order_participants(participant_id);

-- Note: We're keeping customer_id, center_id, etc. for now to avoid breaking existing queries
-- These will be removed in a future migration after all code is updated