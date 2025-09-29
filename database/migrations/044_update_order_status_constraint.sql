-- Update the status check constraint to allow new status values

-- Drop the old constraint
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all status values
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      -- Product order statuses
      'pending_warehouse',
      'awaiting_delivery',
      'delivered',
      -- Service order statuses
      'pending_manager',
      'pending_contractor',
      'pending_crew',
      'service_in_progress',
      'service_completed',
      -- Common terminal statuses
      'cancelled',
      'rejected',
      -- Legacy statuses (kept for backward compatibility)
      'pending',
      'in-progress',
      'approved',
      'service-created'
    )
  );