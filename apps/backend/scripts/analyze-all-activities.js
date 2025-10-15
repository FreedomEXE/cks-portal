const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function analyzeAllActivities() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // 1. Total count
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TOTAL ACTIVITIES:');
    console.log('═══════════════════════════════════════════════════════');
    const total = await client.query(`SELECT COUNT(*) as count FROM system_activity`);
    console.log(`Total activities in database: ${total.rows[0].count}\n`);

    // 2. Date range
    console.log('═══════════════════════════════════════════════════════');
    console.log('📅 DATE RANGE:');
    console.log('═══════════════════════════════════════════════════════');
    const dateRange = await client.query(`
      SELECT
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM system_activity
    `);
    console.log(`Earliest: ${dateRange.rows[0].earliest}`);
    console.log(`Latest: ${dateRange.rows[0].latest}\n`);

    // 3. Breakdown by activity_type
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 BREAKDOWN BY ACTIVITY TYPE:');
    console.log('═══════════════════════════════════════════════════════');
    const breakdown = await client.query(`
      SELECT
        activity_type,
        COUNT(*) as count
      FROM system_activity
      GROUP BY activity_type
      ORDER BY count DESC
    `);
    console.log(`Total unique activity types: ${breakdown.rowCount}\n`);
    breakdown.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.activity_type}: ${row.count}`);
    });

    // 4. Check for order-related activities
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📦 ORDER-RELATED ACTIVITIES:');
    console.log('═══════════════════════════════════════════════════════');
    const orderActivities = await client.query(`
      SELECT
        activity_type,
        COUNT(*) as count
      FROM system_activity
      WHERE activity_type LIKE '%order%'
      GROUP BY activity_type
      ORDER BY count DESC
    `);
    if (orderActivities.rowCount === 0) {
      console.log('⚠️  NO order-related activities found!\n');
    } else {
      console.log(`Found ${orderActivities.rowCount} order-related activity types:\n`);
      orderActivities.rows.forEach((row) => {
        console.log(`  ${row.activity_type}: ${row.count}`);
      });
    }

    // 5. Check for service-related activities
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔧 SERVICE-RELATED ACTIVITIES:');
    console.log('═══════════════════════════════════════════════════════');
    const serviceActivities = await client.query(`
      SELECT
        activity_type,
        COUNT(*) as count
      FROM system_activity
      WHERE activity_type LIKE '%service%'
      GROUP BY activity_type
      ORDER BY count DESC
    `);
    if (serviceActivities.rowCount === 0) {
      console.log('⚠️  NO service-related activities found!\n');
    } else {
      console.log(`Found ${serviceActivities.rowCount} service-related activity types:\n`);
      serviceActivities.rows.forEach((row) => {
        console.log(`  ${row.activity_type}: ${row.count}`);
      });
    }

    // 6. Sample of most recent 20 activities
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 MOST RECENT 20 ACTIVITIES:');
    console.log('═══════════════════════════════════════════════════════\n');
    const recent = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        created_at
      FROM system_activity
      ORDER BY created_at DESC
      LIMIT 20
    `);
    recent.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_type} (${row.target_id})`);
      console.log(`    Date: ${row.created_at.toISOString()}`);
      console.log('');
    });

    // 7. Activities by actor_role
    console.log('═══════════════════════════════════════════════════════');
    console.log('👥 ACTIVITIES BY ACTOR ROLE:');
    console.log('═══════════════════════════════════════════════════════');
    const byRole = await client.query(`
      SELECT
        actor_role,
        COUNT(*) as count
      FROM system_activity
      GROUP BY actor_role
      ORDER BY count DESC
    `);
    byRole.rows.forEach((row) => {
      console.log(`  ${row.actor_role || 'NULL'}: ${row.count}`);
    });

    // 8. Check if there are ANY activities with non-creation/assignment types
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔎 NON-CREATION/ASSIGNMENT ACTIVITIES:');
    console.log('═══════════════════════════════════════════════════════');
    const nonStandard = await client.query(`
      SELECT
        activity_type,
        COUNT(*) as count
      FROM system_activity
      WHERE activity_type NOT LIKE '%created%'
        AND activity_type NOT LIKE '%assigned%'
        AND activity_type != 'assignment_made'
        AND activity_type NOT LIKE '%archived%'
        AND activity_type NOT LIKE '%deleted%'
        AND activity_type NOT LIKE '%restored%'
      GROUP BY activity_type
      ORDER BY count DESC
    `);
    if (nonStandard.rowCount === 0) {
      console.log('⚠️  NO operational activities found (updates, completions, etc.)!\n');
      console.log('This suggests activities may not be getting recorded for:');
      console.log('  - Order updates/status changes');
      console.log('  - Service updates/status changes');
      console.log('  - Order completions/deliveries');
      console.log('  - Service completions');
      console.log('  - etc.\n');
    } else {
      console.log(`Found ${nonStandard.rowCount} operational activity types:\n`);
      nonStandard.rows.forEach((row) => {
        console.log(`  ${row.activity_type}: ${row.count}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

analyzeAllActivities();
