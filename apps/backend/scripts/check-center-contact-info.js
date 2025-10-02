const { Client } = require('pg');

async function checkCenterContactInfo() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const query = `
      SELECT center_id, name, address, phone, email
      FROM centers
      WHERE UPPER(center_id) = 'CEN-010'
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log('No center found with ID CEN-010');
    } else {
      console.log('Center CEN-010 Contact Information:');
      console.log('=====================================');
      const center = result.rows[0];
      console.log(`Center ID: ${center.center_id}`);
      console.log(`Name: ${center.name}`);
      console.log(`Address: ${center.address || '(not populated)'}`);
      console.log(`Phone: ${center.phone || '(not populated)'}`);
      console.log(`Email: ${center.email || '(not populated)'}`);
      console.log('=====================================\n');

      // Check which fields are populated
      const populated = [];
      const missing = [];

      if (center.address) populated.push('address');
      else missing.push('address');

      if (center.phone) populated.push('phone');
      else missing.push('phone');

      if (center.email) populated.push('email');
      else missing.push('email');

      console.log(`Populated fields: ${populated.length > 0 ? populated.join(', ') : 'none'}`);
      console.log(`Missing fields: ${missing.length > 0 ? missing.join(', ') : 'none'}`);
    }

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

checkCenterContactInfo();
