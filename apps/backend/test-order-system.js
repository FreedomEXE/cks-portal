#!/usr/bin/env node
const { Pool } = require('pg');

async function testOrderSystem() {
  const pool = new Pool({
    connectionString: 'postgresql://cks_portal_db_user:SN6DBtsYKzDjo9JbfzdDbcoTOda6AH4X@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing Order System Migration...\n');

    // Check if columns were renamed
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name IN ('creator_id', 'creator_role', 'created_by', 'created_by_role')
      ORDER BY column_name
    `);

    console.log('Orders table columns:');
    columnsResult.rows.forEach(row => console.log(`  - ${row.column_name}`));

    // Check order_participants structure
    const participantsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'order_participants'
      ORDER BY ordinal_position
    `);

    console.log('\norder_participants table columns:');
    participantsResult.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    // Check migration status
    const migrationsResult = await pool.query(`
      SELECT name, applied_at
      FROM schema_migrations
      ORDER BY applied_at DESC
      LIMIT 5
    `);
    console.log('\nRecent migrations:');
    migrationsResult.rows.forEach(row =>
      console.log(`  - ${row.name} (${row.applied_at})`)
    );

    // Check if any orders exist
    const ordersCount = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`\nTotal orders in database: ${ordersCount.rows[0].count}`);

    // Check a sample order if any exist
    if (ordersCount.rows[0].count > 0) {
      const sampleOrder = await pool.query(`
        SELECT order_id, status, creator_id, creator_role, destination, destination_role
        FROM orders
        LIMIT 1
      `);
      console.log('\nSample order:');
      console.log(sampleOrder.rows[0]);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n⚠️  Migration may not have been applied yet.');
      console.log('Run: cd apps/backend && npx dotenv-cli -e .env -- npm run migrate');
    }
  } finally {
    await pool.end();
  }
}

testOrderSystem();