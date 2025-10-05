const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect()
  .then(() => client.query('SELECT order_id, status, transformed_id, metadata, title FROM orders WHERE order_id = $1', ['CEN-010-SO-015']))
  .then(res => {
    console.log(JSON.stringify(res.rows[0], null, 2));
    return client.end();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
