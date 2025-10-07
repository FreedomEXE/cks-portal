-- Add warehouse service order statuses

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      -- Product order statuses
      'pending_warehouse',
      'awaiting_delivery',
      'delivered',

      -- Service order statuses (manager-managed)
      'pending_customer',
      'pending_contractor',
      'pending_manager',
      'manager_accepted',
      'crew_requested',
      'crew_assigned',
      'service_created',

      -- Service order statuses (warehouse-managed)
      'warehouse_accepted',

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
