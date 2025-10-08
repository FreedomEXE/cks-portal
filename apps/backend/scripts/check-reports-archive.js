const { Client } = require('pg');

async function checkReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check if archive columns exist
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reports'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
      ORDER BY column_name
    `);
    console.log('Archive columns in reports table:');
    columnsResult.rows.forEach(row => console.log(`  - ${row.column_name}`));

    // Check all reports
    const allReportsResult = await client.query(`
      SELECT report_id, title, archived_at
      FROM reports
      ORDER BY report_id
    `);
    console.log(`\nTotal reports: ${allReportsResult.rows.length}`);
    allReportsResult.rows.forEach(row => {
      console.log(`  ${row.report_id}: ${row.title} (archived: ${row.archived_at || 'no'})`);
    });

    // Check archived reports specifically
    const archivedResult = await client.query(`
      SELECT report_id, title, archived_at, archived_by, archive_reason
      FROM reports
      WHERE archived_at IS NOT NULL
    `);
    console.log(`\nArchived reports: ${archivedResult.rows.length}`);
    archivedResult.rows.forEach(row => {
      console.log(`  ${row.report_id}: ${row.title}`);
      console.log(`    archived_at: ${row.archived_at}`);
      console.log(`    archived_by: ${row.archived_by || 'NULL'}`);
      console.log(`    archive_reason: ${row.archive_reason || 'NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkReports();
