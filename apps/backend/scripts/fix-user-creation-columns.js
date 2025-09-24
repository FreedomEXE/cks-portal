const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '..', '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`ERROR: .env.local not found at ${envPath}`);
  process.exit(1);
}
require('dotenv').config({ path: envPath });

async function fixColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');
    console.log('Started transaction');

    // Fix centers table
    console.log('\n1. Fixing centers table...');
    try {
      await client.query(`ALTER TABLE centers ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned'`);
      console.log('   ✓ Added status column to centers');
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.includes('already exists')) {
        console.log('   ! status column already exists (benign):', msg);
      } else {
        console.error('   ✗ Error adding status column to centers:', err);
        throw err;
      }
    }

    try {
      await client.query(`ALTER TABLE centers ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(50)`);
      console.log('   ✓ Added contractor_id column to centers');
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.includes('already exists')) {
        console.log('   ! contractor_id column already exists (benign):', msg);
      } else {
        console.error('   ✗ Error adding contractor_id column to centers:', err);
        throw err;
      }
    }

    // Fix crew table
    console.log('\n2. Fixing crew table...');
    try {
      await client.query(`ALTER TABLE crew ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'unassigned'`);
      console.log('   ✓ Added status column to crew');
    } catch (err) {
      console.log('   ! status column might already exist:', err.message);
    }

    // Check if emergency_contact exists, if not check for role and rename it
    const crewColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'crew' AND column_name IN ('emergency_contact', 'role')
    `);
    const hasEmergencyContact = crewColumns.rows.some(r => r.column_name === 'emergency_contact');
    const hasRole = crewColumns.rows.some(r => r.column_name === 'role');
    if (!hasEmergencyContact) {
      if (hasRole) {
        try {
          await client.query(`ALTER TABLE crew RENAME COLUMN role TO emergency_contact`);
          console.log('   ✓ Renamed role to emergency_contact in crew table');
        } catch (err) {
          console.error('   ✗ Failed to rename role column:', err.message);
          throw err;
        }
      } else {
        try {
          await client.query(`ALTER TABLE crew ADD COLUMN emergency_contact VARCHAR(255)`);
          console.log('   ✓ Added emergency_contact column to crew');
        } catch (err) {
          console.error('   ✗ Failed to add emergency_contact column:', err.message);
          throw err;
        }
      }
    } else {
      console.log('   ✓ emergency_contact column already exists in crew');
    }

    // Fix warehouses table
    console.log('\n3. Fixing warehouses table...');
    try {
      await client.query(`ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS main_contact VARCHAR(255)`);
      console.log('   ✓ Added main_contact column to warehouses');
    } catch (err) {
      console.log('   ! main_contact column might already exist:', err.message);
    }

    try {
      await client.query(`ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'active'`);
      console.log('   ✓ Added status column to warehouses');
    } catch (err) {
      console.log('   ! status column might already exist:', err.message);
    }

    // Verify the fixes
    console.log('\n4. Verifying columns...');
    const centersCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'centers' AND column_name IN ('status', 'contractor_id')
    `);
    console.log('   Centers columns:', centersCheck.rows.map(r => r.column_name).join(', '));

    const crewCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'crew' AND column_name IN ('status', 'emergency_contact')
    `);
    console.log('   Crew columns:', crewCheck.rows.map(r => r.column_name).join(', '));

    const warehousesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'warehouses' AND column_name IN ('status', 'main_contact')
    `);
    console.log('   Warehouses columns:', warehousesCheck.rows.map(r => r.column_name).join(', '));

    console.log('\n✅ Database schema fixes completed successfully!');

    // Commit transaction
    await client.query('COMMIT');
    console.log('Transaction committed');
  } catch (err) {
    console.error('Error:', err);
    // Rollback transaction on error
    try {
      await client.query('ROLLBACK');
      console.log('Transaction rolled back');
    } catch (rollbackErr) {
      console.error('Failed to rollback:', rollbackErr);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixColumns();

