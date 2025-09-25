import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { query } from './server/db/connection';

dotenv.config({ path: resolve(__dirname, '.env') });

async function checkSchema() {
  console.log('Checking database schema...\n');

  try {
    // Check products table columns
    const productsSchema = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    console.log('Products table columns:');
    productsSchema.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Check if products table exists and has data
    const productsCount = await query(`SELECT COUNT(*) as count FROM products`);
    console.log(`\nProducts table has ${productsCount.rows[0].count} rows\n`);

    // Check reports-related tables
    const tablesExist = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('reports', 'feedback', 'warehouses')
    `);

    console.log('Existing tables:');
    tablesExist.rows.forEach((t: any) => console.log(`  - ${t.table_name}`));

    // Check warehouses table columns if it exists
    const warehouseExists = tablesExist.rows.some((t: any) => t.table_name === 'warehouses');
    if (warehouseExists) {
      const warehouseSchema = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'warehouses'
        ORDER BY ordinal_position
      `);
      console.log('\nWarehouses table columns:');
      warehouseSchema.rows.forEach((col: any) => console.log(`  - ${col.column_name}`));
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();