CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(20) PRIMARY KEY,
  customer_id VARCHAR(20) NOT NULL,
  center_id VARCHAR(20),
  service_id VARCHAR(20),
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP,
  total_amount DECIMAL(10,2),
  order_kind VARCHAR(20) NOT NULL DEFAULT 'one_time' CHECK (order_kind IN ('one_time','recurring')),
  recurrence_interval VARCHAR(20),
  created_by_role VARCHAR(20),
  created_by_id VARCHAR(60),
  status VARCHAR(30) DEFAULT 'submitted' CHECK (
    status IN ('draft','submitted','contractor_pending','contractor_approved','contractor_denied','scheduling_pending','scheduled','in_progress','completed','shipped','delivered','closed','cancelled')
  ),
  notes TEXT,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product','service','supply')),
  item_id VARCHAR(40) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
  approval_id SERIAL PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL,
  approver_type VARCHAR(20) NOT NULL CHECK (approver_type IN ('contractor','manager','admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  note TEXT,
  decided_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FKs
ALTER TABLE orders
  ADD CONSTRAINT IF NOT EXISTS fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON UPDATE CASCADE,
  ADD CONSTRAINT IF NOT EXISTS fk_orders_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON UPDATE CASCADE,
  ADD CONSTRAINT IF NOT EXISTS fk_orders_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON UPDATE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT IF NOT EXISTS fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

ALTER TABLE approvals
  ADD CONSTRAINT IF NOT EXISTS fk_approvals_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;
