/**
 * Backfill Archive Metadata for Catalog Services and Products
 *
 * Sets archived_at/archived_by/deletion_scheduled for existing archived rows
 * that only have is_active = FALSE.
 */

require('dotenv').config();
const { Client } = require('pg');

async function backfillCatalogServices(client) {
  console.log('\n[1/2] Backfilling catalog_services...');

  const result = await client.query(`
    UPDATE catalog_services
    SET archived_at = COALESCE(archived_at, updated_at),
        archived_by = COALESCE(archived_by, 'ADMIN'),
        deletion_scheduled = COALESCE(deletion_scheduled, updated_at + interval '30 days')
    WHERE is_active = FALSE
      AND archived_at IS NULL
    RETURNING service_id, name, archived_at
  `);

  console.log(`   ✅ Updated ${result.rowCount} catalog services`);

  if (result.rows.length > 0) {
    console.log('   Sample rows:');
    result.rows.slice(0, 5).forEach(row => {
      console.log(`     - ${row.service_id}: ${row.name} (archived: ${row.archived_at})`);
    });
  }

  return result.rowCount;
}

async function backfillCatalogProducts(client) {
  console.log('\n[2/2] Backfilling catalog_products...');

  // First, identify products that should be archived (from archived_entities or inventory)
  const archivedProductsResult = await client.query(`
    SELECT DISTINCT ae.entity_id
    FROM archived_entities ae
    WHERE ae.entity_type = 'product'
      AND ae.restored_at IS NULL
  `);

  const archivedProductIds = archivedProductsResult.rows.map(r => r.entity_id);

  if (archivedProductIds.length === 0) {
    console.log('   ℹ️  No archived products found in archived_entities');
    return 0;
  }

  console.log(`   Found ${archivedProductIds.length} archived products to sync`);

  // Update catalog_products for these archived products
  const result = await client.query(`
    UPDATE catalog_products
    SET is_active = FALSE,
        archived_at = COALESCE(archived_at, updated_at),
        archived_by = COALESCE(archived_by, 'ADMIN'),
        deletion_scheduled = COALESCE(deletion_scheduled, updated_at + interval '30 days')
    WHERE product_id = ANY($1::text[])
      AND (is_active = TRUE OR archived_at IS NULL)
    RETURNING product_id, name, archived_at
  `, [archivedProductIds]);

  console.log(`   ✅ Updated ${result.rowCount} catalog products`);

  if (result.rows.length > 0) {
    console.log('   Sample rows:');
    result.rows.slice(0, 5).forEach(row => {
      console.log(`     - ${row.product_id}: ${row.name} (archived: ${row.archived_at})`);
    });
  }

  return result.rowCount;
}

async function main() {
  console.log('='.repeat(60));
  console.log('BACKFILL CATALOG ARCHIVE METADATA');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const servicesCount = await backfillCatalogServices(client);
    const productsCount = await backfillCatalogProducts(client);

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`  Services updated: ${servicesCount}`);
    console.log(`  Products updated: ${productsCount}`);
    console.log(`  Total: ${servicesCount + productsCount}`);
    console.log('='.repeat(60));

    console.log('\n✅ Backfill complete!');
  } catch (error) {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
