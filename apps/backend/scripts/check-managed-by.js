const { Client } = require('pg');
require('dotenv/config');

async function checkManagedBy() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check if managed_by column exists in catalog_services
    const columnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'catalog_services' AND column_name = 'managed_by'
    `);

    console.log('=== MANAGED_BY COLUMN CHECK ===');
    if (columnCheck.rows.length === 0) {
      console.log('❌ managed_by column DOES NOT EXIST in catalog_services');
    } else {
      console.log('✅ managed_by column exists in catalog_services');
    }

    // Check sample services
    const services = await client.query(`
      SELECT service_id, name, category
      FROM catalog_services
      LIMIT 5
    `);

    console.log('\n=== SAMPLE SERVICES ===');
    services.rows.forEach(s => {
      console.log(`${s.service_id}: ${s.name} (${s.category})`);
    });

    // Check SRV-004 specifically
    const srv004 = await client.query(`
      SELECT *
      FROM catalog_services
      WHERE service_id = 'SRV-004'
    `);

    console.log('\n=== SRV-004 DATA ===');
    console.log(JSON.stringify(srv004.rows[0], null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkManagedBy();
