#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

async function checkArchivedUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n=== Checking Archived Users ===\n');

    // Check each table
    const tables = [
      { table: 'managers', idCol: 'manager_id', nameCol: 'manager_name' },
      { table: 'contractors', idCol: 'contractor_id', nameCol: 'company_name' },
      { table: 'customers', idCol: 'customer_id', nameCol: 'company_name' },
      { table: 'centers', idCol: 'center_id', nameCol: 'name' },
      { table: 'crew', idCol: 'crew_id', nameCol: 'name' }
    ];

    for (const { table, idCol, nameCol } of tables) {
      const result = await pool.query(
        `SELECT ${idCol}, ${nameCol}, archived_at, archived_by
         FROM ${table}
         WHERE archived_at IS NOT NULL
         ORDER BY archived_at DESC`
      );

      console.log(`\n${table.toUpperCase()}:`);
      if (result.rows.length === 0) {
        console.log('  No archived records');
      } else {
        result.rows.forEach(row => {
          console.log(`  - ${row[idCol]}: ${row[nameCol] || 'No name'}`);
          console.log(`    Archived: ${row.archived_at}`);
          console.log(`    By: ${row.archived_by}`);
        });
      }
    }

    // Check the archived_entities view
    console.log('\n=== Archived Entities View ===');
    const viewResult = await pool.query(
      `SELECT * FROM archived_entities ORDER BY archived_at DESC LIMIT 10`
    );

    if (viewResult.rows.length === 0) {
      console.log('No records in archived_entities view');
    } else {
      console.log(`Found ${viewResult.rows.length} records:`);
      viewResult.rows.forEach(row => {
        console.log(`  - ${row.entity_type} ${row.entity_id}: ${row.name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkArchivedUsers();