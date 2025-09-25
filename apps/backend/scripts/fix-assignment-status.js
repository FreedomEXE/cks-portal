const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function fixAssignmentStatus() {
  try {
    console.log('Fixing assignment status for existing records...');

    // Update contractors with managers to 'assigned' status
    const contractorsResult = await query(`
      UPDATE contractors
      SET status = 'assigned'
      WHERE cks_manager IS NOT NULL
        AND cks_manager != ''
        AND (status IS NULL OR status = 'unassigned')
      RETURNING contractor_id
    `);
    console.log(`Updated ${contractorsResult.rowCount} contractors to 'assigned' status`);

    // Update contractors without managers to 'unassigned' status
    const unassignedContractorsResult = await query(`
      UPDATE contractors
      SET status = 'unassigned'
      WHERE (cks_manager IS NULL OR cks_manager = '')
        AND status IS NULL
      RETURNING contractor_id
    `);
    console.log(`Updated ${unassignedContractorsResult.rowCount} contractors to 'unassigned' status`);

    // Update customers with contractors to 'assigned' status
    const customersResult = await query(`
      UPDATE customers
      SET status = 'assigned'
      WHERE contractor_id IS NOT NULL
        AND contractor_id != ''
        AND (status IS NULL OR status = 'unassigned')
      RETURNING customer_id
    `);
    console.log(`Updated ${customersResult.rowCount} customers to 'assigned' status`);

    // Update customers without contractors to 'unassigned' status
    const unassignedCustomersResult = await query(`
      UPDATE customers
      SET status = 'unassigned'
      WHERE (contractor_id IS NULL OR contractor_id = '')
        AND status IS NULL
      RETURNING customer_id
    `);
    console.log(`Updated ${unassignedCustomersResult.rowCount} customers to 'unassigned' status`);

    // Update centers with customers to 'assigned' status
    const centersResult = await query(`
      UPDATE centers
      SET status = 'assigned'
      WHERE customer_id IS NOT NULL
        AND customer_id != ''
        AND (status IS NULL OR status = 'unassigned')
      RETURNING center_id
    `);
    console.log(`Updated ${centersResult.rowCount} centers to 'assigned' status`);

    // Update centers without customers to 'unassigned' status
    const unassignedCentersResult = await query(`
      UPDATE centers
      SET status = 'unassigned'
      WHERE (customer_id IS NULL OR customer_id = '')
        AND status IS NULL
      RETURNING center_id
    `);
    console.log(`Updated ${unassignedCentersResult.rowCount} centers to 'unassigned' status`);

    // Update crew with centers to 'assigned' status
    const crewResult = await query(`
      UPDATE crew
      SET status = 'assigned'
      WHERE assigned_center IS NOT NULL
        AND assigned_center != ''
        AND (status IS NULL OR status = 'unassigned')
      RETURNING crew_id
    `);
    console.log(`Updated ${crewResult.rowCount} crew members to 'assigned' status`);

    // Update crew without centers to 'unassigned' status
    const unassignedCrewResult = await query(`
      UPDATE crew
      SET status = 'unassigned'
      WHERE (assigned_center IS NULL OR assigned_center = '')
        AND status IS NULL
      RETURNING crew_id
    `);
    console.log(`Updated ${unassignedCrewResult.rowCount} crew members to 'unassigned' status`);

    console.log('Assignment status fix completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing assignment status:', error);
    await pool.end();
    process.exit(1);
  }
}

fixAssignmentStatus();