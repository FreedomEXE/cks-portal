#!/usr/bin/env tsx
import 'dotenv/config';
import { query } from '../server/db/connection';

async function backfillContractorAssignedToManager() {
  const result = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'contractor_assigned_to_manager',
       'Assigned ' || c.contractor_id || ' to ' || c.cks_manager,
       'ADMIN',
       'admin',
       c.contractor_id,
       'contractor',
       jsonb_build_object('contractorId', c.contractor_id, 'managerId', c.cks_manager),
       COALESCE(c.updated_at, c.created_at, NOW())
     FROM contractors c
     WHERE c.cks_manager IS NOT NULL AND c.cks_manager <> ''
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'contractor_assigned_to_manager'
           AND sa.target_type = 'contractor'
           AND UPPER(sa.target_id) = UPPER(c.contractor_id)
           AND sa.metadata ? 'managerId'
           AND UPPER(sa.metadata->>'managerId') = UPPER(c.cks_manager)
       )`
  );
  return result.rowCount || 0;
}

async function backfillCustomerAssignedToContractor() {
  const result = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'customer_assigned_to_contractor',
       'Assigned ' || cu.customer_id || ' to ' || cu.contractor_id,
       'ADMIN',
       'admin',
       cu.customer_id,
       'customer',
       jsonb_build_object('customerId', cu.customer_id, 'contractorId', cu.contractor_id),
       COALESCE(cu.updated_at, cu.created_at, NOW())
     FROM customers cu
     WHERE cu.contractor_id IS NOT NULL AND cu.contractor_id <> ''
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'customer_assigned_to_contractor'
           AND sa.target_type = 'customer'
           AND UPPER(sa.target_id) = UPPER(cu.customer_id)
           AND sa.metadata ? 'contractorId'
           AND UPPER(sa.metadata->>'contractorId') = UPPER(cu.contractor_id)
       )`
  );
  return result.rowCount || 0;
}

async function backfillCenterAssignedToCustomer() {
  const result = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'center_assigned_to_customer',
       'Assigned ' || ce.center_id || ' to ' || ce.customer_id,
       'ADMIN',
       'admin',
       ce.center_id,
       'center',
       jsonb_build_object('centerId', ce.center_id, 'customerId', ce.customer_id, 'contractorId', ce.contractor_id),
       COALESCE(ce.updated_at, ce.created_at, NOW())
     FROM centers ce
     WHERE ce.customer_id IS NOT NULL AND ce.customer_id <> ''
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'center_assigned_to_customer'
           AND sa.target_type = 'center'
           AND UPPER(sa.target_id) = UPPER(ce.center_id)
           AND sa.metadata ? 'customerId'
           AND UPPER(sa.metadata->>'customerId') = UPPER(ce.customer_id)
       )`
  );
  return result.rowCount || 0;
}

async function backfillCrewAssignedToCenter() {
  const result = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'crew_assigned_to_center',
       'Assigned ' || cr.crew_id || ' to ' || cr.assigned_center,
       'ADMIN',
       'admin',
       cr.crew_id,
       'crew',
       jsonb_build_object('crewId', cr.crew_id, 'centerId', cr.assigned_center),
       COALESCE(cr.updated_at, cr.created_at, NOW())
     FROM crew cr
     WHERE cr.assigned_center IS NOT NULL AND cr.assigned_center <> ''
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'crew_assigned_to_center'
           AND sa.target_type = 'crew'
           AND UPPER(sa.target_id) = UPPER(cr.crew_id)
           AND sa.metadata ? 'centerId'
           AND UPPER(sa.metadata->>'centerId') = UPPER(cr.assigned_center)
       )`
  );
  return result.rowCount || 0;
}

async function backfillOrderAssignedToWarehouse() {
  const result = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'order_assigned_to_warehouse',
       'Assigned ' || o.order_id || ' to ' || o.assigned_warehouse,
       'ADMIN',
       'admin',
       o.order_id,
       'order',
       jsonb_build_object('warehouseId', o.assigned_warehouse),
       COALESCE(o.updated_at, o.created_at, NOW())
     FROM orders o
     WHERE o.assigned_warehouse IS NOT NULL AND o.assigned_warehouse <> ''
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'order_assigned_to_warehouse'
           AND sa.target_type = 'order'
           AND UPPER(sa.target_id) = UPPER(o.order_id)
           AND sa.metadata ? 'warehouseId'
           AND UPPER(sa.metadata->>'warehouseId') = UPPER(o.assigned_warehouse)
       )`
  );
  return result.rowCount || 0;
}

async function backfillCertifications() {
  // Active certifications -> certified
  const certified = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'catalog_service_certified',
       'Certified ' || sc.user_id || ' for ' || sc.service_id,
       'ADMIN',
       'admin',
       sc.service_id,
       'catalogService',
       jsonb_build_object('userId', sc.user_id, 'role', sc.role, 'serviceId', sc.service_id),
       COALESCE(sc.created_at, NOW())
     FROM service_certifications sc
     WHERE sc.archived_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'catalog_service_certified'
           AND sa.target_type = 'catalogService'
           AND UPPER(sa.target_id) = UPPER(sc.service_id)
           AND sa.metadata ? 'userId'
           AND UPPER(sa.metadata->>'userId') = UPPER(sc.user_id)
           AND sa.metadata ? 'role'
           AND sa.metadata->>'role' = sc.role
       )`
  );

  // Archived certifications -> decertified
  const decertified = await query(
    `INSERT INTO system_activity (
       activity_type, description, actor_id, actor_role,
       target_id, target_type, metadata, created_at
     )
     SELECT
       'catalog_service_decertified',
       'Uncertified ' || sc.user_id || ' for ' || sc.service_id,
       'ADMIN',
       'admin',
       sc.service_id,
       'catalogService',
       jsonb_build_object('userId', sc.user_id, 'role', sc.role, 'serviceId', sc.service_id),
       COALESCE(sc.archived_at, sc.created_at, NOW())
     FROM service_certifications sc
     WHERE sc.archived_at IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM system_activity sa
         WHERE sa.activity_type = 'catalog_service_decertified'
           AND sa.target_type = 'catalogService'
           AND UPPER(sa.target_id) = UPPER(sc.service_id)
           AND sa.metadata ? 'userId'
           AND UPPER(sa.metadata->>'userId') = UPPER(sc.user_id)
           AND sa.metadata ? 'role'
           AND sa.metadata->>'role' = sc.role
       )`
  );

  return { certified: certified.rowCount || 0, decertified: decertified.rowCount || 0 };
}

async function main() {
  const results: Record<string, number> = {};
  results.contractor_assigned_to_manager = await backfillContractorAssignedToManager();
  results.customer_assigned_to_contractor = await backfillCustomerAssignedToContractor();
  results.center_assigned_to_customer = await backfillCenterAssignedToCustomer();
  results.crew_assigned_to_center = await backfillCrewAssignedToCenter();
  results.order_assigned_to_warehouse = await backfillOrderAssignedToWarehouse();
  const certs = await backfillCertifications();
  results.catalog_service_certified = certs.certified;
  results.catalog_service_decertified = certs.decertified;

  console.log('[backfill] Summary:', results);
}

main().catch((err) => {
  console.error('[backfill] Failed', err);
  process.exit(1);
});
