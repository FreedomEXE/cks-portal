const { Pool } = require('pg');
require('dotenv').config();

async function fixColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('Fixing missing columns...');

    // Fix crew table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'crew'
            AND column_name = 'emergency_contact'
        ) THEN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'crew'
              AND column_name = 'role'
          ) THEN
            ALTER TABLE crew RENAME COLUMN role TO emergency_contact;
          ELSE
            ALTER TABLE crew ADD COLUMN emergency_contact VARCHAR(255);
          END IF;
        END IF;
      END $$;
    `);
    console.log('✓ Fixed crew.emergency_contact column');

    // Fix warehouses table
    await pool.query(`
      ALTER TABLE warehouses
        ADD COLUMN IF NOT EXISTS main_contact VARCHAR(255);
    `);
    console.log('✓ Fixed warehouses.main_contact column');

    // Fix managers table
    await pool.query(`
      ALTER TABLE managers
        ADD COLUMN IF NOT EXISTS role VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255),
        ADD COLUMN IF NOT EXISTS address VARCHAR(255);
    `);
    console.log('✓ Fixed managers profile columns');

    console.log('All columns fixed successfully!');
  } catch (error) {
    console.error('Error fixing columns:', error.message);
  } finally {
    await pool.end();
  }
}

fixColumns();