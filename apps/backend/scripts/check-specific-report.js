const { Client } = require('pg');

async function checkSpecificReport(reportId) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const reportRes = await client.query(
      `SELECT report_id, title, status, report_category, related_entity_id, created_by_role, created_by_id, cks_manager, created_at
       FROM reports WHERE report_id = $1`,
      [reportId]
    );

    if (reportRes.rows.length === 0) {
      console.log(`Report not found: ${reportId}`);
      return;
    }

    const report = reportRes.rows[0];
    console.log('\n=== Report ===');
    console.table([report]);

    const relatedId = report.related_entity_id;
    if (!relatedId) {
      console.log('\nNo related_entity_id set for this report.');
    } else {
      console.log(`\nrelated_entity_id => ${relatedId}`);
    }

    if (report.report_category === 'service' && relatedId) {
      const svcRes = await client.query(
        `SELECT service_id, managed_by FROM services WHERE UPPER(service_id) = UPPER($1)`,
        [relatedId]
      );
      console.log('\n=== Matching services (by service_id) ===');
      console.table(svcRes.rows);
    }

    if (report.report_category === 'order' && relatedId) {
      const orderRes = await client.query(
        `SELECT order_id, order_type, assigned_warehouse, transformed_id FROM orders WHERE UPPER(order_id) = UPPER($1)`,
        [relatedId]
      );
      console.log('\n=== Matching order ===');
      console.table(orderRes.rows);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

const id = process.argv[2] || 'CON-010-RPT-005';
checkSpecificReport(id);
