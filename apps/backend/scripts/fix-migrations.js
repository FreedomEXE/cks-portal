const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrationsToMark = [
  '040_orders.sql',
  '041_catalog_split.sql',
  '042_fix_catalog_orders_schema.sql',
  '042_order_creator_destination_model.sql',
  '043_fix_customer_id_constraint.sql',
  '044_update_order_status_constraint.sql',
  '045_fix_order_items_table.sql',
  '047_cleanup_warehouses.sql',
  '050_assignments.sql',
  '060_inventory.sql',
  '070_deliveries.sql',
  '080_reports.sql'
];

async function markMigrationsAsApplied() {
  try {
    for (const migration of migrationsToMark) {
      await pool.query(
        `INSERT INTO schema_migrations (name, applied_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
        [migration]
      );
      console.log(`Marked ${migration} as applied`);
    }
    console.log('\nDone! Now run the regular migration script to apply remaining migrations.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

markMigrationsAsApplied();
