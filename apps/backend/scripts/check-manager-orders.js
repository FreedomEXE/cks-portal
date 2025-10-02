const { Client } = require('pg');

async function checkOrders() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('\n=== Recent Product Orders ===');
  const orders = await client.query(`
    SELECT order_id, creator_id, creator_role, customer_id, center_id, contractor_id, manager_id, crew_id, destination
    FROM orders
    WHERE order_type = 'product'
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.table(orders.rows);

  console.log('\n=== Manager Ecosystem (MGR-012) ===');
  const customers = await client.query(`SELECT customer_id, name FROM customers WHERE manager_id = 'MGR-012'`);
  console.log('Customers:', customers.rows);

  const contractors = await client.query(`SELECT contractor_id, name FROM contractors WHERE manager_id = 'MGR-012'`);
  console.log('Contractors:', contractors.rows);

  const centers = await client.query(`SELECT center_id, name FROM centers WHERE manager_id = 'MGR-012'`);
  console.log('Centers:', centers.rows);

  if (centers.rows.length > 0) {
    const centerIds = centers.rows.map(c => c.center_id);
    const crew = await client.query(`SELECT crew_id, name, center_id FROM crew WHERE center_id = ANY($1::text[])`, [centerIds]);
    console.log('Crew at those centers:', crew.rows);
  }

  await client.end();
}

checkOrders().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
