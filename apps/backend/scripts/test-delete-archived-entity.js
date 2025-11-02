require('dotenv').config();
const { Client } = require('pg');

async function testDeleteArchivedEntity(entityType, entityId) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log(`\n=== Testing Delete of ${entityType}: ${entityId} ===\n`);

    // Map entity types to table names
    const tableMap = {
      service: { table: 'services', idColumn: 'service_id' },
      order: { table: 'orders', idColumn: 'order_id' }
    };

    const config = tableMap[entityType];
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Check current state
    const checkResult = await client.query(
      `SELECT * FROM ${config.table} WHERE ${config.idColumn} = $1`,
      [entityId]
    );

    if (checkResult.rows.length === 0) {
      console.log('❌ Entity not found');
      await client.query('ROLLBACK');
      return;
    }

    console.log('Entity found:');
    console.log(`  archived_at: ${checkResult.rows[0].archived_at}`);
    console.log(`  archived_by: ${checkResult.rows[0].archived_by || checkResult.rows[0].metadata?.archivedBy}`);

    // For orders, check and delete dependent rows first
    if (entityType === 'order') {
      const itemsResult = await client.query(
        'SELECT COUNT(*) FROM order_items WHERE order_id = $1',
        [entityId]
      );
      console.log(`\nOrder has ${itemsResult.rows[0].count} order_items`);

      if (parseInt(itemsResult.rows[0].count) > 0) {
        console.log('Deleting order_items...');
        await client.query('DELETE FROM order_items WHERE order_id = $1', [entityId]);
        console.log('✅ order_items deleted');
      }

      const participantsResult = await client.query(
        'SELECT COUNT(*) FROM order_participants WHERE order_id = $1',
        [entityId]
      );
      console.log(`Order has ${participantsResult.rows[0].count} order_participants`);

      if (parseInt(participantsResult.rows[0].count) > 0) {
        console.log('Deleting order_participants...');
        await client.query('DELETE FROM order_participants WHERE order_id = $1', [entityId]);
        console.log('✅ order_participants deleted');
      }
    }

    // Now delete the main entity
    console.log(`\nDeleting ${entityType} from ${config.table}...`);
    const deleteResult = await client.query(
      `DELETE FROM ${config.table} WHERE ${config.idColumn} = $1`,
      [entityId]
    );

    if (deleteResult.rowCount === 1) {
      console.log(`✅ ${entityType} deleted successfully!`);
    } else {
      console.log(`❌ Delete failed - ${deleteResult.rowCount} rows affected`);
    }

    // ROLLBACK to not actually delete
    console.log('\n⚠️  ROLLING BACK (test only - no actual delete)\n');
    await client.query('ROLLBACK');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

// Test with one of the archived service orders
const entityType = process.argv[2] || 'order';
const entityId = process.argv[3] || 'CEN-010-SO-045';

testDeleteArchivedEntity(entityType, entityId);
