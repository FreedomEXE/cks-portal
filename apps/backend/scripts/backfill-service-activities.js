const { Client } = require('pg');
require('dotenv/config');

/**
 * Backfill Service Activities
 *
 * This script creates historical activity records for existing services
 * based on their current status and metadata in the orders table.
 *
 * What it backfills:
 * - service_started (for services with actual_start_time)
 * - service_completed (for services with status='completed')
 * - service_cancelled (for services with metadata.serviceCancelledAt)
 * - service_verified (for services with metadata.serviceVerifiedAt)
 */

async function backfillServiceActivities() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    let totalInserted = 0;

    // Get all services with their order metadata (including archived)
    console.log('Fetching services and order metadata...');
    const services = await client.query(`
      SELECT
        s.service_id,
        s.status,
        s.actual_start_time,
        s.actual_end_time,
        s.managed_by,
        s.created_at,
        o.metadata,
        o.order_id
      FROM services s
      LEFT JOIN orders o ON o.transformed_id = s.service_id
      ORDER BY s.created_at ASC
    `);

    console.log(`Found ${services.rows.length} services to process\n`);

    for (const svc of services.rows) {
      const serviceId = svc.service_id;
      const metadata = svc.metadata || {};
      const actorId = svc.managed_by || metadata.serviceStartedBy || metadata.serviceCancelledBy || 'SYSTEM';

      console.log(`Processing ${serviceId} (status: ${svc.status})...`);

      // Check if we already have activities for this service (avoid duplicates)
      const existingCheck = await client.query(
        `SELECT COUNT(*) as count FROM system_activity
         WHERE target_id = $1 AND activity_type IN ('service_started', 'service_completed', 'service_cancelled', 'service_verified')`,
        [serviceId]
      );

      if (parseInt(existingCheck.rows[0].count) > 0) {
        console.log(`  ⏭️  Skipping (already has activity records)`);
        continue;
      }

      // Backfill service_started
      if (svc.actual_start_time) {
        const startedAt = new Date(svc.actual_start_time);
        await client.query(
          `INSERT INTO system_activity
           (activity_type, description, actor_id, actor_role, target_id, target_type, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'service_started',
            `Started Service ${serviceId}`,
            actorId,
            'warehouse',
            serviceId,
            'service',
            JSON.stringify({ backfilled: true, notes: metadata.serviceStartNotes || null }),
            startedAt
          ]
        );
        console.log(`  ✅ Created service_started activity (${startedAt.toISOString()})`);
        totalInserted++;
      }

      // Backfill service_completed
      if (svc.status === 'completed' && svc.actual_end_time) {
        const completedAt = new Date(svc.actual_end_time);
        await client.query(
          `INSERT INTO system_activity
           (activity_type, description, actor_id, actor_role, target_id, target_type, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'service_completed',
            `Completed Service ${serviceId}`,
            actorId,
            'warehouse',
            serviceId,
            'service',
            JSON.stringify({ backfilled: true, notes: metadata.serviceCompleteNotes || null }),
            completedAt
          ]
        );
        console.log(`  ✅ Created service_completed activity (${completedAt.toISOString()})`);
        totalInserted++;
      }

      // Backfill service_cancelled
      if (metadata.serviceCancelledAt) {
        const cancelledAt = new Date(metadata.serviceCancelledAt);
        const cancelledBy = metadata.serviceCancelledBy || actorId;
        await client.query(
          `INSERT INTO system_activity
           (activity_type, description, actor_id, actor_role, target_id, target_type, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'service_cancelled',
            `Cancelled Service ${serviceId}`,
            cancelledBy,
            'warehouse',
            serviceId,
            'service',
            JSON.stringify({ backfilled: true, reason: metadata.serviceCancellationReason || null }),
            cancelledAt
          ]
        );
        console.log(`  ✅ Created service_cancelled activity (${cancelledAt.toISOString()})`);
        totalInserted++;
      }

      // Backfill service_verified
      if (metadata.serviceVerifiedAt) {
        const verifiedAt = new Date(metadata.serviceVerifiedAt);
        const verifiedBy = metadata.serviceVerifiedBy || actorId;
        await client.query(
          `INSERT INTO system_activity
           (activity_type, description, actor_id, actor_role, target_id, target_type, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'service_verified',
            `Verified Service ${serviceId}`,
            verifiedBy,
            'warehouse',
            serviceId,
            'service',
            JSON.stringify({ backfilled: true, notes: metadata.serviceVerifyNotes || null }),
            verifiedAt
          ]
        );
        console.log(`  ✅ Created service_verified activity (${verifiedAt.toISOString()})`);
        totalInserted++;
      }

      if (svc.actual_start_time || svc.status === 'completed' || metadata.serviceCancelledAt || metadata.serviceVerifiedAt) {
        console.log(`  Processed ${serviceId}`);
      } else {
        console.log(`  ⏭️  No actions to backfill for ${serviceId}`);
      }
    }

    console.log(`\n✅ Backfill complete! Inserted ${totalInserted} activity records.`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

backfillServiceActivities();
