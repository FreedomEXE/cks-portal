-- Align orders.status check constraint with current service/product flows

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      -- Product order statuses
      'pending_warehouse',
      'awaiting_delivery',
      'delivered',

      -- Service order statuses (current)
      'pending_customer',
      'pending_contractor',
      'pending_manager',
      'manager_accepted',
      'crew_requested',
      'crew_assigned',
      'service_created',

      -- Common terminal statuses
      'cancelled',
      'rejected',

      -- Legacy/compat values preserved for backward compatibility
      'pending',
      'in-progress',
      'approved',
      'pending_crew',
      'service_in_progress',
      'service_completed',
      'service-created'
    )
  );

