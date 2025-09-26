import { query } from '../apps/backend/server/db/connection';

async function listAllUsers() {
  try {
    console.log('\n=== ADMIN USERS ===');
    const adminUsers = await query(`
      SELECT clerk_user_id, cks_code, role, status, full_name, email, territory, created_at
      FROM admin_users
      ORDER BY created_at DESC
    `);

    if (adminUsers.rows.length > 0) {
      console.table(adminUsers.rows);
    } else {
      console.log('No admin users found');
    }

    console.log('\n=== MANAGERS ===');
    const managers = await query(`
      SELECT manager_id as code, name, email, status, created_at
      FROM managers
      ORDER BY created_at DESC
    `);

    if (managers.rows.length > 0) {
      console.table(managers.rows);
    } else {
      console.log('No managers found');
    }

    console.log('\n=== CONTRACTORS ===');
    const contractors = await query(`
      SELECT contractor_id as code, name, contact_person, email, status, created_at
      FROM contractors
      ORDER BY created_at DESC
    `);

    if (contractors.rows.length > 0) {
      console.table(contractors.rows);
    } else {
      console.log('No contractors found');
    }

    console.log('\n=== CUSTOMERS ===');
    const customers = await query(`
      SELECT customer_id as code, name, main_contact, email, status, created_at
      FROM customers
      ORDER BY created_at DESC
    `);

    if (customers.rows.length > 0) {
      console.table(customers.rows);
    } else {
      console.log('No customers found');
    }

    console.log('\n=== CREW ===');
    const crew = await query(`
      SELECT crew_id as code, name, email, status, created_at
      FROM crew
      ORDER BY created_at DESC
    `);

    if (crew.rows.length > 0) {
      console.table(crew.rows);
    } else {
      console.log('No crew found');
    }

    console.log('\n=== WAREHOUSES ===');
    const warehouses = await query(`
      SELECT warehouse_id as code, name, main_contact, email, status, created_at
      FROM warehouses
      ORDER BY created_at DESC
    `);

    if (warehouses.rows.length > 0) {
      console.table(warehouses.rows);
    } else {
      console.log('No warehouses found');
    }

    console.log('\n=== CENTERS ===');
    const centers = await query(`
      SELECT center_id as code, name, main_contact, email, created_at
      FROM centers
      ORDER BY created_at DESC
    `);

    if (centers.rows.length > 0) {
      console.table(centers.rows);
    } else {
      console.log('No centers found');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total admin users: ${adminUsers.rowCount}`);
    console.log(`Total managers: ${managers.rowCount}`);
    console.log(`Total contractors: ${contractors.rowCount}`);
    console.log(`Total customers: ${customers.rowCount}`);
    console.log(`Total crew: ${crew.rowCount}`);
    console.log(`Total warehouses: ${warehouses.rowCount}`);
    console.log(`Total centers: ${centers.rowCount}`);
    console.log(`Grand total: ${
      (adminUsers.rowCount || 0) +
      (managers.rowCount || 0) +
      (contractors.rowCount || 0) +
      (customers.rowCount || 0) +
      (crew.rowCount || 0) +
      (warehouses.rowCount || 0) +
      (centers.rowCount || 0)
    } users`);

    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

listAllUsers();
