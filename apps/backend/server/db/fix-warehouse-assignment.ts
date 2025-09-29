import { query } from './connection';

async function fixWarehouseAssignment() {
  console.log('Updating warehouse assignments from WAR-001 to WHS-004...');

  try {
    const result = await query(
      `UPDATE orders
       SET assigned_warehouse = 'WHS-004'
       WHERE assigned_warehouse = 'WAR-001'
       RETURNING order_id`
    );

    console.log(`Updated ${result.rows.length} orders:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.order_id}`);
    });

    console.log('\nWarehouse assignment fix complete!');
  } catch (error) {
    console.error('Error updating warehouse assignments:', error);
    throw error;
  }
}

if (require.main === module) {
  fixWarehouseAssignment()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { fixWarehouseAssignment };