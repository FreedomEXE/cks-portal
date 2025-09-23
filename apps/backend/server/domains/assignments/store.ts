import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { AuditContext } from '../provisioning';

export interface UnassignedContractor {
  id: string;
  companyName: string;
  email: string | null;
  phone: string | null;
}

export interface UnassignedCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface UnassignedCenter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface UnassignedCrewMember {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
}

export interface AssignmentResult {
  id: string;
  name: string;
  assignedId: string;
  assignedName: string;
}

interface ActivityPayload {
  activityType: string;
  description: string;
  actor: AuditContext;
  targetId: string;
  targetType: string;
  metadata?: Record<string, unknown>;
}

function formatPrefixedId(value: string | null | undefined, fallbackPrefix: string): string {
  if (!value) {
    return `${fallbackPrefix}-???`;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return `${fallbackPrefix}-???`;
  }
  const match = trimmed.match(/^([A-Za-z]+)-?(\d+)$/);
  if (match) {
    const prefix = match[1].toUpperCase();
    const digits = match[2].padStart(3, '0');
    return `${prefix}-${digits}`;
  }
  return trimmed.toUpperCase();
}

async function recordActivity(payload: ActivityPayload): Promise<void> {
  const actorId = normalizeIdentity(payload.actor.actorId) ?? 'ADMIN';
  const actorRole = payload.actor.actorRole || 'admin';
  try {
    await query(
      `INSERT INTO system_activity (
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())`,
      [
        payload.activityType,
        payload.description,
        actorId,
        actorRole,
        payload.targetId,
        payload.targetType,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
      ],
    );
  } catch (error) {
    console.warn('[activity] Failed to record assignment activity', {
      activityType: payload.activityType,
      targetId: payload.targetId,
      error,
    });
  }
}

export async function listUnassignedContractors(limit = 250): Promise<UnassignedContractor[]> {
  const result = await query<{
    contractor_id: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  }>(
    `SELECT contractor_id, company_name, email, phone
     FROM contractors
     WHERE (cks_manager IS NULL OR cks_manager = '')
       AND (archived_at IS NULL)
     ORDER BY contractor_id
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: formatPrefixedId(row.contractor_id, 'CON'),
    companyName: row.company_name ?? formatPrefixedId(row.contractor_id, 'CON'),
    email: row.email,
    phone: row.phone,
  }));
}

export async function listUnassignedCustomers(limit = 250): Promise<UnassignedCustomer[]> {
  const result = await query<{
    customer_id: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  }>(
    `SELECT customer_id, company_name, email, phone
     FROM customers
     WHERE (contractor_id IS NULL OR contractor_id = '')
       AND (archived_at IS NULL)
     ORDER BY customer_id
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: formatPrefixedId(row.customer_id, 'CUS'),
    name: row.company_name ?? formatPrefixedId(row.customer_id, 'CUS'),
    email: row.email,
    phone: row.phone,
  }));
}

export async function listUnassignedCenters(limit = 250): Promise<UnassignedCenter[]> {
  const result = await query<{
    center_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  }>(
    `SELECT center_id, name, email, phone
     FROM centers
     WHERE (customer_id IS NULL OR customer_id = '')
       AND (archived_at IS NULL)
     ORDER BY center_id
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: formatPrefixedId(row.center_id, 'CEN'),
    name: row.name ?? formatPrefixedId(row.center_id, 'CEN'),
    email: row.email,
    phone: row.phone,
  }));
}

export async function listUnassignedCrew(limit = 250): Promise<UnassignedCrewMember[]> {
  const result = await query<{
    crew_id: string;
    name: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
  }>(
    `SELECT crew_id, name, role, email, phone
     FROM crew
     WHERE (assigned_center IS NULL OR assigned_center = '')
       AND (archived_at IS NULL)
     ORDER BY crew_id
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: formatPrefixedId(row.crew_id, 'CRW'),
    name: row.name ?? formatPrefixedId(row.crew_id, 'CRW'),
    role: row.role,
    email: row.email,
    phone: row.phone,
  }));
}

async function fetchContractor(contractorId: string) {
  const result = await query<{
    contractor_id: string;
    company_name: string | null;
  }>(
    `SELECT contractor_id, company_name
     FROM contractors
     WHERE UPPER(contractor_id) = $1
       AND archived_at IS NULL
     LIMIT 1`,
    [contractorId],
  );
  return result.rows[0] ?? null;
}

async function fetchManager(managerId: string) {
  const result = await query<{
    manager_id: string;
    manager_name: string | null;
  }>(
    `SELECT manager_id, manager_name
     FROM managers
     WHERE UPPER(manager_id) = $1
       AND archived_at IS NULL
     LIMIT 1`,
    [managerId],
  );
  return result.rows[0] ?? null;
}

async function fetchCustomer(customerId: string) {
  const result = await query<{
    customer_id: string;
    company_name: string | null;
    contractor_id: string | null;
  }>(
    `SELECT customer_id, company_name, contractor_id
     FROM customers
     WHERE UPPER(customer_id) = $1
       AND archived_at IS NULL
     LIMIT 1`,
    [customerId],
  );
  return result.rows[0] ?? null;
}

async function fetchCenter(centerId: string) {
  const result = await query<{
    center_id: string;
    name: string | null;
    contractor_id: string | null;
  }>(
    `SELECT center_id, name, contractor_id
     FROM centers
     WHERE UPPER(center_id) = $1
       AND archived_at IS NULL
     LIMIT 1`,
    [centerId],
  );
  return result.rows[0] ?? null;
}

async function fetchCrewMember(crewId: string) {
  const result = await query<{
    crew_id: string;
    name: string | null;
  }>(
    `SELECT crew_id, name
     FROM crew
     WHERE UPPER(crew_id) = $1
       AND archived_at IS NULL
     LIMIT 1`,
    [crewId],
  );
  return result.rows[0] ?? null;
}

export async function assignContractorToManager(
  contractorIdInput: string,
  managerIdInput: string,
  actor: AuditContext,
): Promise<AssignmentResult> {
  const contractorLookup = normalizeIdentity(contractorIdInput);
  const managerLookup = normalizeIdentity(managerIdInput);
  if (!contractorLookup || !managerLookup) {
    throw new Error('Invalid contractor or manager ID');
  }

  const contractor = await fetchContractor(contractorLookup);
  if (!contractor) {
    throw new Error('Contractor not found');
  }
  const manager = await fetchManager(managerLookup);
  if (!manager) {
    throw new Error('Manager not found');
  }

  await query(
    `UPDATE contractors
     SET cks_manager = $1,
         updated_at = NOW()
     WHERE contractor_id = $2`,
    [manager.manager_id, contractor.contractor_id],
  );

  await recordActivity({
    actor,
    activityType: 'contractor_assigned_to_manager',
    description: `Assigned ${contractor.contractor_id} to manager ${manager.manager_id}`,
    targetId: contractor.contractor_id,
    targetType: 'contractor',
    metadata: {
      contractorId: contractor.contractor_id,
      contractorName: contractor.company_name,
      managerId: manager.manager_id,
      managerName: manager.manager_name,
    },
  });

  return {
    id: contractor.contractor_id,
    name: contractor.company_name ?? contractor.contractor_id,
    assignedId: manager.manager_id,
    assignedName: manager.manager_name ?? manager.manager_id,
  };
}

export async function assignCustomerToContractor(
  customerIdInput: string,
  contractorIdInput: string,
  actor: AuditContext,
): Promise<AssignmentResult> {
  const customerLookup = normalizeIdentity(customerIdInput);
  const contractorLookup = normalizeIdentity(contractorIdInput);
  if (!customerLookup || !contractorLookup) {
    throw new Error('Invalid customer or contractor ID');
  }

  const customer = await fetchCustomer(customerLookup);
  if (!customer) {
    throw new Error('Customer not found');
  }
  const contractor = await fetchContractor(contractorLookup);
  if (!contractor) {
    throw new Error('Contractor not found');
  }

  await query(
    `UPDATE customers
     SET contractor_id = $1,
         updated_at = NOW()
     WHERE customer_id = $2`,
    [contractor.contractor_id, customer.customer_id],
  );

  await recordActivity({
    actor,
    activityType: 'customer_assigned_to_contractor',
    description: `Assigned ${customer.customer_id} to contractor ${contractor.contractor_id}`,
    targetId: customer.customer_id,
    targetType: 'customer',
    metadata: {
      customerId: customer.customer_id,
      customerName: customer.company_name,
      contractorId: contractor.contractor_id,
      contractorName: contractor.company_name,
    },
  });

  return {
    id: customer.customer_id,
    name: customer.company_name ?? customer.customer_id,
    assignedId: contractor.contractor_id,
    assignedName: contractor.company_name ?? contractor.contractor_id,
  };
}

export async function assignCenterToCustomer(
  centerIdInput: string,
  customerIdInput: string,
  actor: AuditContext,
): Promise<AssignmentResult> {
  const centerLookup = normalizeIdentity(centerIdInput);
  const customerLookup = normalizeIdentity(customerIdInput);
  if (!centerLookup || !customerLookup) {
    throw new Error('Invalid center or customer ID');
  }

  const center = await fetchCenter(centerLookup);
  if (!center) {
    throw new Error('Center not found');
  }
  const customer = await fetchCustomer(customerLookup);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const contractorId = customer.contractor_id;

  await query(
    `UPDATE centers
     SET customer_id = $1,
         contractor_id = COALESCE($2, contractor_id),
         updated_at = NOW()
     WHERE center_id = $3`,
    [customer.customer_id, contractorId, center.center_id],
  );

  await recordActivity({
    actor,
    activityType: 'center_assigned_to_customer',
    description: `Assigned ${center.center_id} to customer ${customer.customer_id}`,
    targetId: center.center_id,
    targetType: 'center',
    metadata: {
      centerId: center.center_id,
      centerName: center.name,
      customerId: customer.customer_id,
      customerName: customer.company_name,
      contractorId,
    },
  });

  return {
    id: center.center_id,
    name: center.name ?? center.center_id,
    assignedId: customer.customer_id,
    assignedName: customer.company_name ?? customer.customer_id,
  };
}

export async function assignCrewToCenter(
  crewIdInput: string,
  centerIdInput: string,
  actor: AuditContext,
): Promise<AssignmentResult> {
  const crewLookup = normalizeIdentity(crewIdInput);
  const centerLookup = normalizeIdentity(centerIdInput);
  if (!crewLookup || !centerLookup) {
    throw new Error('Invalid crew or center ID');
  }

  const crew = await fetchCrewMember(crewLookup);
  if (!crew) {
    throw new Error('Crew member not found');
  }
  const center = await fetchCenter(centerLookup);
  if (!center) {
    throw new Error('Center not found');
  }

  await query(
    `UPDATE crew
     SET assigned_center = $1,
         updated_at = NOW()
     WHERE crew_id = $2`,
    [center.center_id, crew.crew_id],
  );

  await recordActivity({
    actor,
    activityType: 'crew_assigned_to_center',
    description: `Assigned ${crew.crew_id} to center ${center.center_id}`,
    targetId: crew.crew_id,
    targetType: 'crew',
    metadata: {
      crewId: crew.crew_id,
      crewName: crew.name,
      centerId: center.center_id,
      centerName: center.name,
    },
  });

  return {
    id: crew.crew_id,
    name: crew.name ?? crew.crew_id,
    assignedId: center.center_id,
    assignedName: center.name ?? center.center_id,
  };
}
