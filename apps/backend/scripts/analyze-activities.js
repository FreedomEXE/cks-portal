const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function analyzeActivities() {
  // Check if we need SSL (Render) or not (local)
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // 1. Total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM system_activity');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TOTAL ACTIVITIES:', countResult.rows[0].total);
    console.log('═══════════════════════════════════════════════════════\n');

    // 2. Date range
    const dateRange = await client.query(`
      SELECT
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM system_activity
    `);
    console.log('📅 DATE RANGE:');
    console.log('Oldest:', dateRange.rows[0].oldest);
    console.log('Newest:', dateRange.rows[0].newest);
    console.log('');

    // 3. Activity types breakdown
    const typesResult = await client.query(`
      SELECT
        activity_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM system_activity
      GROUP BY activity_type
      ORDER BY count DESC
    `);
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 ACTIVITY TYPES BREAKDOWN:');
    console.log('═══════════════════════════════════════════════════════');
    typesResult.rows.forEach(row => {
      console.log(`${row.activity_type.padEnd(35)} ${String(row.count).padStart(6)} (${row.percentage}%)`);
    });
    console.log('');

    // 4. Actor roles breakdown
    const rolesResult = await client.query(`
      SELECT
        COALESCE(actor_role, 'NULL/SYSTEM') as actor_role,
        COUNT(*) as count
      FROM system_activity
      GROUP BY actor_role
      ORDER BY count DESC
    `);
    console.log('═══════════════════════════════════════════════════════');
    console.log('👤 ACTOR ROLES BREAKDOWN:');
    console.log('═══════════════════════════════════════════════════════');
    rolesResult.rows.forEach(row => {
      console.log(`${row.actor_role.padEnd(20)} ${String(row.count).padStart(6)}`);
    });
    console.log('');

    // 5. Sample activities by type (5 most common types)
    const topTypes = typesResult.rows.slice(0, 5).map(r => r.activity_type);

    for (const activityType of topTypes) {
      const samples = await client.query(`
        SELECT
          activity_id,
          description,
          actor_role,
          actor_id,
          target_id,
          target_type,
          created_at
        FROM system_activity
        WHERE activity_type = $1
        ORDER BY created_at DESC
        LIMIT 3
      `, [activityType]);

      console.log('═══════════════════════════════════════════════════════');
      console.log(`📝 SAMPLE: ${activityType} (${samples.rows.length} shown)`);
      console.log('═══════════════════════════════════════════════════════');
      samples.rows.forEach((sample, idx) => {
        console.log(`\n[${idx + 1}] ID: ${sample.activity_id}`);
        console.log(`    Description: "${sample.description}"`);
        console.log(`    Actor: ${sample.actor_role || 'system'} (${sample.actor_id || 'N/A'})`);
        console.log(`    Target: ${sample.target_type || 'N/A'} (${sample.target_id || 'N/A'})`);
        console.log(`    Created: ${sample.created_at}`);
      });
      console.log('');
    }

    // 6. Unique descriptions count
    const uniqueDescriptions = await client.query(`
      SELECT COUNT(DISTINCT description) as unique_count
      FROM system_activity
    `);
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 DESCRIPTION ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Unique descriptions:', uniqueDescriptions.rows[0].unique_count);
    console.log('');

    // 7. Most recent 10 activities across all types
    const recentAll = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_role,
        actor_id,
        target_id,
        created_at
      FROM system_activity
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('═══════════════════════════════════════════════════════');
    console.log('🕐 MOST RECENT 10 ACTIVITIES (ALL TYPES):');
    console.log('═══════════════════════════════════════════════════════');
    recentAll.rows.forEach((act, idx) => {
      console.log(`\n[${idx + 1}] ${act.activity_type}`);
      console.log(`    "${act.description}"`);
      console.log(`    ${act.actor_role || 'system'} (${act.actor_id || 'N/A'}) → ${act.target_id || 'N/A'}`);
      console.log(`    ${act.created_at}`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

analyzeActivities();
