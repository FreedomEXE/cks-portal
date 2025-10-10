const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMigrations() {
  try {
    const result = await pool.query('SELECT name FROM schema_migrations ORDER BY applied_at DESC LIMIT 15');
    console.log('Recent migrations:');
    result.rows.forEach(row => console.log(`  ${row.name}`));

    // Check if order_participants table exists and has cks_code column
    const tableCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'order_participants'
      ORDER BY ordinal_position
    `);
    console.log('\norder_participants columns:');
    tableCheck.rows.forEach(row => console.log(`  ${row.column_name}`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkMigrations();
