const { Client } = require('pg');

async function checkRelationships() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('\n=== Manager MGR-012 Ecosystem ===');

  const customers = await client.query(`SELECT customer_id, name, cks_manager FROM customers WHERE cks_manager = 'MGR-012'`);
  console.log('Customers:', customers.rows);

  const contractors = await client.query(`SELECT contractor_id, name, cks_manager FROM contractors WHERE cks_manager = 'MGR-012'`);
  console.log('Contractors:', contractors.rows);

  const centers = await client.query(`SELECT center_id, name, cks_manager FROM centers WHERE cks_manager = 'MGR-012'`);
  console.log('Centers:', centers.rows);

  const crew = await client.query(`SELECT crew_id, name, cks_manager, assigned_center FROM crew WHERE cks_manager = 'MGR-012'`);
  console.log('Crew:', crew.rows);

  console.log('\n=== Recent Product Orders (creator info) ===');
  const orders = await client.query(`
    SELECT order_id, creator_id, creator_role, customer_id, center_id, contractor_id, crew_id, destination
    FROM orders
    WHERE order_type = 'product'
    ORDER BY created_at DESC
    LIMIT 5
  `);
  console.table(orders.rows);

  await client.end();
}

checkRelationships().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
