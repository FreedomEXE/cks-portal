const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://cks_portal_user_2v9:ytvHYQqzSbgb1g8Kfvt0TgMDCUPYPWTQ@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db",
  ssl: { rejectUnauthorized: false },
  max: 2
});

async function addArchivedColumn() {
  try {
    console.log('Adding archived_at column to managers table...');
    
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'managers' AND column_name = 'archived_at') THEN
              ALTER TABLE managers ADD COLUMN archived_at TIMESTAMP NULL;
          END IF;
      END $$;
    `);
    
    console.log('archived_at column added successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

addArchivedColumn();