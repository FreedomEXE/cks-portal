const { Client } = require('pg');

async function checkReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check reports
    console.log('=== REPORTS ===');
    const reports = await client.query(`
      SELECT report_id, title, type, center_id, customer_id, created_by_id, created_by_role, cks_manager, created_at
      FROM reports
      WHERE archived_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`Found ${reports.rows.length} reports:`);
    reports.rows.forEach(row => {
      console.log(`  - ${row.report_id}: ${row.title}`);
      console.log(`    Created by: ${row.created_by_role} ${row.created_by_id}`);
      console.log(`    Center: ${row.center_id}, Customer: ${row.customer_id}`);
      console.log(`    cks_manager: ${row.cks_manager}`);
      console.log(`    Created: ${row.created_at}`);
    });

    console.log('\n=== FEEDBACK ===');
    const feedback = await client.query(`
      SELECT feedback_id, title, kind, center_id, customer_id, created_by_id, created_by_role, cks_manager, created_at
      FROM feedback
      WHERE archived_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`Found ${feedback.rows.length} feedback items:`);
    feedback.rows.forEach(row => {
      console.log(`  - ${row.feedback_id}: ${row.title}`);
      console.log(`    Created by: ${row.created_by_role} ${row.created_by_id}`);
      console.log(`    Center: ${row.center_id}, Customer: ${row.customer_id}`);
      console.log(`    cks_manager: ${row.cks_manager}`);
      console.log(`    Created: ${row.created_at}`);
    });

    // Check a sample center to see what manager it belongs to
    console.log('\n=== CHECKING CENTER DATA ===');
    const centers = await client.query(`
      SELECT center_id, name, cks_manager
      FROM centers
      LIMIT 5
    `);
    console.log(`Sample centers:`);
    centers.rows.forEach(row => {
      console.log(`  - ${row.center_id}: ${row.name || 'N/A'} -> Manager: ${row.cks_manager || 'NULL'}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkReports();
