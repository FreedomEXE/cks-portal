#!/usr/bin/env node
const { Pool } = require('pg');

async function testNewOrderSystem() {
  const pool = new Pool({
    connectionString: 'postgresql://cks_portal_db_user:SN6DBtsYKzDjo9JbfzdDbcoTOda6AH4X@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing New Order System...\n');

    // 1. Verify schema changes
    console.log('1. Checking schema changes:');
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name IN ('creator_id', 'creator_role', 'next_actor_id')
      ORDER BY column_name
    `);
    console.log('New columns in orders table:');
    columnsResult.rows.forEach(row => console.log(`  ✓ ${row.column_name}`));

    // 2. Check order_participants structure
    const participantsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'order_participants'
      AND column_name IN ('participant_id', 'participant_role', 'participation_type')
    `);
    console.log('\nNew columns in order_participants:');
    participantsResult.rows.forEach(row => console.log(`  ✓ ${row.column_name}`));

    // 3. Test creating a product order (Center creates order for Warehouse)
    console.log('\n2. Testing product order creation:');
    const orderId = `CEN-010-PO-${String(Date.now()).slice(-6)}`;

    await pool.query('BEGIN');

    // Insert test order
    await pool.query(`
      INSERT INTO orders (
        order_id, order_type, title, status, next_actor_role,
        creator_id, creator_role, destination, destination_role,
        requested_date, currency
      ) VALUES (
        $1, 'product', 'Test Product Order', 'pending_warehouse', 'warehouse',
        'CEN-010', 'center', 'WH-001', 'warehouse',
        NOW(), 'USD'
      )
    `, [orderId]);

    // Insert participants
    await pool.query(`
      INSERT INTO order_participants (order_id, participant_id, participant_role, participation_type)
      VALUES
        ($1, 'CEN-010', 'center', 'creator'),
        ($1, 'WH-001', 'warehouse', 'actor')
    `, [orderId]);

    // Skip order items for now - focus on core order functionality
    console.log(`  ✓ Created order: ${orderId}`);

    // Query it back
    const orderResult = await pool.query(`
      SELECT o.order_id, o.status, o.creator_id, o.creator_role,
             o.destination, o.destination_role, o.next_actor_role
      FROM orders o
      WHERE o.order_id = $1
    `, [orderId]);

    console.log('  Order details:');
    const order = orderResult.rows[0];
    console.log(`    - Status: ${order.status}`);
    console.log(`    - Creator: ${order.creator_id} (${order.creator_role})`);
    console.log(`    - Destination: ${order.destination} (${order.destination_role})`);
    console.log(`    - Next Actor: ${order.next_actor_role}`);

    // Check participants
    const participantsCheckResult = await pool.query(`
      SELECT participant_id, participant_role, participation_type
      FROM order_participants
      WHERE order_id = $1
      ORDER BY participation_type
    `, [orderId]);

    console.log('  Participants:');
    participantsCheckResult.rows.forEach(p =>
      console.log(`    - ${p.participant_id} (${p.participant_role}): ${p.participation_type}`)
    );

    await pool.query('COMMIT');
    console.log('\n✅ Order system test successful!');

    // Clean up test data
    await pool.query('DELETE FROM orders WHERE order_id = $1', [orderId]);
    console.log('  (Test data cleaned up)');

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Test failed:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

testNewOrderSystem();