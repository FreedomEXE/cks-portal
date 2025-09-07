const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearUsers() {
  try {
    console.log('Adding archived_at columns if missing...');
    
    // Add archived_at column if missing
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'managers' AND column_name = 'archived_at') THEN
              ALTER TABLE managers ADD COLUMN archived_at TIMESTAMP NULL;
          END IF;
      END $$;
    `);
    
    console.log('Clearing existing users...');
    
    // Clear app_users mapping first
    await pool.query('DELETE FROM app_users WHERE role = \'manager\'');
    
    // Clear managers table  
    await pool.query('DELETE FROM managers');
    
    console.log('All users cleared successfully');
    
    // Verify empty
    const result = await pool.query('SELECT COUNT(*) as count FROM managers');
    console.log('Managers remaining:', result.rows[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

clearUsers();