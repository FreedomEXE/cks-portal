import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubRole } from '../profile/types';
import type {
  HubActivityItem,
  HubRoleActivitiesPayload,
  HubRoleScopePayload,
  ManagerRoleScopePayload,
  ManagerScopeCenter,
  ManagerScopeContractor,
  ManagerScopeCrewMember,
  ManagerScopeCustomer,
} from './types';

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toCount(row: { count?: string | number } | undefined): number {
  if (!row) {
    return 0;
  }
  const value = typeof row.count === 'number' ? row.count : Number(row.count ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

function toIsoString(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function normalizeStatus(status: string | null): string | null {
  if (!status) {
    return null;
  }
  const trimmed = status.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  if (trimmed === 'assigned' || trimmed === 'operational') {
    return 'active';
  }
  return trimmed;
}

function ensureId(value: string | null | undefined, fallbackPrefix: string): string {
  const normalized = normalizeIdentity(value ?? null);
  if (normalized) {
    return normalized;
  }
  if (!value) {
    return `${fallbackPrefix}-UNKNOWN`;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return `${fallbackPrefix}-UNKNOWN`;
  }
  return trimmed.toUpperCase();
}
const activityTypeCategory: Record<string, string> = {
  assignment_made: 'action',
  support_ticket_updated: 'warning',
  manager_assigned: 'info',
};

type ActivityRow = {
  activity_id: number;
  description: string;
  activity_type: string;
  actor_id: string | null;
  actor_role: string | null;
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string | null;
};

function mapActivityRow(row: ActivityRow): HubActivityItem {
  return {
    id: String(row.activity_id),
    description: row.description,
    category: activityTypeCategory[row.activity_type] ?? 'info',
    actorId: toNullableString(row.actor_id),
    actorRole: toNullableString(row.actor_role),
    targetId: toNullableString(row.target_id),
    targetType: toNullableString(row.target_type),
    metadata: row.metadata ?? null,
    createdAt: toIsoString(row.created_at),
  };
}



async function getManagerRoleScope(cksCode: string): Promise<ManagerRoleScopePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const managerResult = await query<{ status: string | null }>(
    `SELECT status FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1`,
    [normalizedCode],
  );

  if (!managerResult.rowCount) {
    return null;
  }

  const [contractorRows, customerRows, centerRows, crewRows, pendingOrdersCount] = await Promise.all([
    query<{
      contractor_id: string;
      name: string | null;
      contact_person: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT contractor_id, name, contact_person, email, phone, address, status
       FROM contractors
       WHERE UPPER(cks_manager) = $1
       ORDER BY contractor_id`,
      [normalizedCode],
    ),
    query<{
      customer_id: string;
      contractor_id: string | null;
      name: string | null;
      main_contact: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT customer_id, contractor_id, name, main_contact, email, phone, address, status
       FROM customers
       WHERE UPPER(cks_manager) = $1
       ORDER BY customer_id`,
      [normalizedCode],
    ),
    query<{
      center_id: string;
      contractor_id: string | null;
      customer_id: string | null;
      name: string | null;
      main_contact: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT center_id, contractor_id, customer_id, name, main_contact, email, phone, address, status
       FROM centers
       WHERE UPPER(cks_manager) = $1
       ORDER BY center_id`,
      [normalizedCode],
    ),
    query<{
      crew_id: string;
      assigned_center: string | null;
      name: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT crew_id, assigned_center, name, email, phone, address, status
       FROM crew
       WHERE UPPER(cks_manager) = $1
       ORDER BY crew_id`,
      [normalizedCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       WHERE UPPER(customer_id) IN (
         SELECT UPPER(customer_id)
         FROM customers
         WHERE UPPER(cks_manager) = $1
       )
       AND LOWER(status) IN ('pending', 'requested', 'in-progress')`,
      [normalizedCode],
    ),
  ]);

  const contractors: ManagerScopeContractor[] = contractorRows.rows.map((row) => ({
    id: ensureId(row.contractor_id, 'CONTRACTOR'),
    role: 'contractor',
    name: toNullableString(row.name),
    contactPerson: toNullableString(row.contact_person),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const customers: ManagerScopeCustomer[] = customerRows.rows.map((row) => ({
    id: ensureId(row.customer_id, 'CUSTOMER'),
    role: 'customer',
    contractorId: toNullableString(row.contractor_id ? normalizeIdentity(row.contractor_id) : null),
    name: toNullableString(row.name),
    mainContact: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const centers: ManagerScopeCenter[] = centerRows.rows.map((row) => ({
    id: ensureId(row.center_id, 'CENTER'),
    role: 'center',
    contractorId: toNullableString(row.contractor_id ? normalizeIdentity(row.contractor_id) : null),
    customerId: toNullableString(row.customer_id ? normalizeIdentity(row.customer_id) : null),
    name: toNullableString(row.name),
    mainContact: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const crew: ManagerScopeCrewMember[] = crewRows.rows.map((row) => ({
    id: ensureId(row.crew_id, 'CREW'),
    role: 'crew',
    assignedCenter: toNullableString(row.assigned_center ? normalizeIdentity(row.assigned_center) : null),
    name: toNullableString(row.name),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  return {
    role: 'manager',
    cksCode: normalizedCode,
    summary: {
      contractorCount: contractors.length,
      customerCount: customers.length,
      centerCount: centers.length,
      crewCount: crew.length,
      pendingOrders: toCount(pendingOrdersCount.rows[0]),
      accountStatus: normalizeStatus(managerResult.rows[0]?.status ?? null),
    },
    relationships: {
      contractors,
      customers,
      centers,
      crew,
    },
  };
}


async function getManagerActivities(cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  const scope = await getManagerRoleScope(cksCode);
  if (!scope) {
    return null;
  }

  const ids = new Set<string>();
  const addId = (value: string | null | undefined) => {
    const normalized = normalizeIdentity(value ?? null);
    if (normalized && !normalized.endsWith('-UNKNOWN')) {
      ids.add(normalized);
    }
  };

  addId(scope.cksCode);
  scope.relationships.contractors.forEach((contractor) => addId(contractor.id));
  scope.relationships.customers.forEach((customer) => {
    addId(customer.id);
    addId(customer.contractorId);
  });
  scope.relationships.centers.forEach((center) => {
    addId(center.id);
    addId(center.customerId);
    addId(center.contractorId);
  });
  scope.relationships.crew.forEach((member) => {
    addId(member.id);
    addId(member.assignedCenter);
  });

  const idArray = Array.from(ids);
  if (!idArray.length) {
    idArray.push(scope.cksCode);
  }

  const activitiesResult = await query<ActivityRow>(
    `SELECT activity_id, description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at
     FROM system_activity
     WHERE (
       actor_id IS NOT NULL AND UPPER(actor_id) = ANY($1::text[])
     ) OR (
       target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[])
     ) OR (
       metadata ? 'managerId' AND UPPER(metadata->>'managerId') = $2
     ) OR (
       metadata ? 'cksManager' AND UPPER(metadata->>'cksManager') = $2
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [idArray, scope.cksCode],
  );

  const activities = activitiesResult.rows.map(mapActivityRow);

  return {
    role: 'manager',
    cksCode: scope.cksCode,
    activities,
  };
}

export async function getRoleActivities(role: HubRole, cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  if (role === 'manager') {
    return getManagerActivities(cksCode);
  }
  return null;
}

export async function getRoleScope(role: HubRole, cksCode: string): Promise<HubRoleScopePayload | null> {
  if (role === 'manager') {
    return getManagerRoleScope(cksCode);
  }
  return null;
}

