require('dotenv').config();
const { Client } = require('pg');

async function checkFKDependencies() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Query to find all foreign keys referencing orders, services, and products tables
    const query = `
      SELECT
        tc.constraint_name,
        tc.table_name AS dependent_table,
        kcu.column_name AS dependent_column,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name IN ('orders', 'services', 'inventory_items', 'products', 'catalog_services')
      ORDER BY ccu.table_name, tc.table_name;
    `;

    const res = await client.query(query);

    console.log('\n=== Foreign Key Dependencies ===\n');

    // Group by referenced table
    const grouped = {};
    for (const row of res.rows) {
      if (!grouped[row.referenced_table]) {
        grouped[row.referenced_table] = [];
      }
      grouped[row.referenced_table].push({
        dependent_table: row.dependent_table,
        dependent_column: row.dependent_column,
        referenced_column: row.referenced_column
      });
    }

    for (const [refTable, deps] of Object.entries(grouped)) {
      console.log(`\n${refTable.toUpperCase()}:`);
      for (const dep of deps) {
        console.log(`  - ${dep.dependent_table}.${dep.dependent_column} → ${refTable}.${dep.referenced_column}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkFKDependencies();
