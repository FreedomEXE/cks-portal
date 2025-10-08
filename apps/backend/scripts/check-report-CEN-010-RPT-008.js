const { Client } = require('pg');

async function checkReport() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected\n');

    // Check the report status
    const reportResult = await client.query(`
      SELECT report_id, status, created_by_id, created_by_role, cks_manager, created_at
      FROM reports
      WHERE report_id = $1
    `, ['CEN-010-RPT-008']);

    console.log('=== Report Details ===');
    if (reportResult.rows.length === 0) {
      console.log('Report not found!');
    } else {
      const report = reportResult.rows[0];
      console.log(`Report ID: ${report.report_id}`);
      console.log(`Status: ${report.status}`);
      console.log(`Created By: ${report.created_by_id} (${report.created_by_role})`);
      console.log(`CKS Manager: ${report.cks_manager}`);
      console.log(`Created At: ${report.created_at}`);
    }

    console.log('\n✓ Check complete');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkReport();
