const { Client } = require('pg');

// Simulate the getManagerForUser function for 'center' role
async function getManagerForCenter(centerCode) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const normalized = centerCode.toUpperCase();
    console.log(`Looking up manager for center: ${normalized}`);

    const result = await client.query(
      'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
      [normalized]
    );

    console.log(`Query result:`, result.rows);

    if (result.rows[0]?.cks_manager) {
      const managerCode = result.rows[0].cks_manager.toUpperCase();
      console.log(`Found manager: ${managerCode}`);
      return managerCode;
    }

    console.log(`No manager found`);
    return null;

  } finally {
    await client.end();
  }
}

// Simulate the ecosystem reports query
async function getEcosystemReports(centerCode) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const managerCode = await getManagerForCenter(centerCode);

    if (!managerCode) {
      console.log('\nNo manager found - would return empty results');
      return { reports: [], feedback: [] };
    }

    console.log(`\nQuerying reports WHERE UPPER(cks_manager) = UPPER('${managerCode}')`);

    const reportsResult = await client.query(
      `SELECT report_id, title, cks_manager
       FROM reports
       WHERE UPPER(cks_manager) = UPPER($1) AND archived_at IS NULL
       ORDER BY created_at DESC`,
      [managerCode]
    );

    console.log(`Found ${reportsResult.rows.length} reports:`);
    reportsResult.rows.forEach(row => {
      console.log(`  - ${row.report_id}: ${row.title} (manager: ${row.cks_manager})`);
    });

    const feedbackResult = await client.query(
      `SELECT feedback_id, title, cks_manager
       FROM feedback
       WHERE UPPER(cks_manager) = UPPER($1) AND archived_at IS NULL
       ORDER BY created_at DESC`,
      [managerCode]
    );

    console.log(`Found ${feedbackResult.rows.length} feedback items:`);
    feedbackResult.rows.forEach(row => {
      console.log(`  - ${row.feedback_id}: ${row.title} (manager: ${row.cks_manager})`);
    });

    return {
      reports: reportsResult.rows,
      feedback: feedbackResult.rows
    };

  } finally {
    await client.end();
  }
}

console.log('=== Testing Hub Reports Endpoint Logic for CEN-010 ===\n');
getEcosystemReports('CEN-010')
  .then(() => console.log('\nTest completed successfully'))
  .catch(err => console.error('Error:', err));
