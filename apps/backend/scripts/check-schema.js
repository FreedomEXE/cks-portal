const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('\n=== Centers Table Columns ===');
  const centersSchema = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'centers'
    ORDER BY ordinal_position
  `);
  console.table(centersSchema.rows);

  console.log('\n=== Customers Table Columns ===');
  const customersSchema = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'customers'
    ORDER BY ordinal_position
  `);
  console.table(customersSchema.rows);

  console.log('\n=== Contractors Table Columns ===');
  const contractorsSchema = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'contractors'
    ORDER BY ordinal_position
  `);
  console.table(contractorsSchema.rows);

  console.log('\n=== Crew Table Columns ===');
  const crewSchema = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'crew'
    ORDER BY ordinal_position
  `);
  console.table(crewSchema.rows);

  await client.end();
}

checkSchema().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
