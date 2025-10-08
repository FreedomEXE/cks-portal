const { Client } = require('pg');

async function checkStatuses() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected\n');

    // Check current report statuses
    const reportsResult = await client.query(`
      SELECT report_id, status, created_at, updated_at
      FROM reports
      WHERE archived_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('=== Recent Reports ===');
    reportsResult.rows.forEach(row => {
      console.log(`${row.report_id}: status='${row.status}' (created: ${row.created_at})`);
    });

    // Check feedback statuses
    const feedbackResult = await client.query(`
      SELECT feedback_id, status, created_at
      FROM feedback
      WHERE archived_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\n=== Recent Feedback ===');
    feedbackResult.rows.forEach(row => {
      console.log(`${row.feedback_id}: status='${row.status}' (created: ${row.created_at})`);
    });

    console.log('\n✓ Check complete');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkStatuses();
