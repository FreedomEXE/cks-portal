-- Orders domain core tables
CREATE SEQUENCE IF NOT EXISTS order_product_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS order_service_sequence START 1;

CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(64) PRIMARY KEY,
  order_type TEXT NOT NULL CHECK (order_type IN ('service','product')),
  title TEXT,
  status TEXT NOT NULL,
  next_actor_role TEXT,
  created_by TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  customer_id TEXT,
  center_id TEXT,
  contractor_id TEXT,
  manager_id TEXT,
  crew_id TEXT,
  assigned_warehouse TEXT,
  destination TEXT,\r\n  destination_role TEXT,
  requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_date TIMESTAMPTZ,
  service_start_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  total_amount NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  transformed_id TEXT,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  catalog_item_id BIGINT REFERENCES catalog_items(id),
  catalog_item_code VARCHAR(32),
  name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product','service')),
  description TEXT,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_of_measure TEXT,
  unit_price NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  total_price NUMERIC(12,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, line_number)
);

CREATE TABLE IF NOT EXISTS order_participants (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  cks_code TEXT NOT NULL,
  participation_type TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, role, cks_code)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_center ON orders(center_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_contractor ON orders(contractor_id);
CREATE INDEX IF NOT EXISTS idx_orders_manager ON orders(manager_id);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse ON orders(assigned_warehouse);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_participants_code ON order_participants(cks_code);
CREATE INDEX IF NOT EXISTS idx_order_participants_role ON order_participants(role);

CREATE OR REPLACE FUNCTION set_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_orders_updated_at ON orders;
CREATE TRIGGER trig_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_updated_at();
