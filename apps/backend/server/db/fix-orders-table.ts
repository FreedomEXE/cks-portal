import { query } from './connection';

export async function fixOrdersTable() {
  try {
    const columnsToAdd = [
      { name: 'order_type', definition: "TEXT CHECK (order_type IN ('service','product'))" },
      { name: 'title', definition: 'TEXT' },
      { name: 'next_actor_role', definition: 'VARCHAR(50)' },
      { name: 'created_by', definition: 'VARCHAR(50)' },
      { name: 'created_by_role', definition: 'VARCHAR(50)' },
      { name: 'customer_id', definition: 'VARCHAR(50)' },
      { name: 'center_id', definition: 'VARCHAR(50)' },
      { name: 'contractor_id', definition: 'VARCHAR(50)' },
      { name: 'manager_id', definition: 'VARCHAR(50)' },
      { name: 'crew_id', definition: 'VARCHAR(50)' },
      { name: 'assigned_warehouse', definition: 'VARCHAR(50)' },
      { name: 'destination', definition: 'VARCHAR(50)' },
      { name: 'destination_role', definition: 'VARCHAR(50)' },
      { name: 'requested_date', definition: 'TIMESTAMP' },
      { name: 'expected_date', definition: 'TIMESTAMP' },
      { name: 'service_start_date', definition: 'TIMESTAMP' },
      { name: 'delivery_date', definition: 'TIMESTAMP' },
      { name: 'total_amount', definition: 'NUMERIC(12,2)' },
      { name: 'currency', definition: "CHAR(3) DEFAULT 'USD'" },
      { name: 'transformed_id', definition: 'VARCHAR(64)' },
      { name: 'rejection_reason', definition: 'TEXT' },
      { name: 'notes', definition: 'TEXT' },
      { name: 'metadata', definition: "JSONB DEFAULT '{}'::jsonb" },
      { name: 'created_at', definition: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', definition: 'TIMESTAMP DEFAULT NOW()' }
    ];

    for (const col of columnsToAdd) {
      try {
        await query(`
          ALTER TABLE orders
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.definition}
        `, []);
        console.log(`Added/verified column ${col.name} in orders table`);
      } catch (err) {
        console.log(`Column ${col.name} already exists or couldn't be added`);
      }
    }

    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `, []);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by)
    `, []);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_center ON orders(center_id)
    `, []);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)
    `, []);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_warehouse ON orders(assigned_warehouse)
    `, []);

    console.log('Orders table structure fixed');
  } catch (error) {
    console.error('Error fixing orders table:', error);
  }
}
