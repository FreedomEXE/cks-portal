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
  ContractorRoleScopePayload,
  ContractorScopeCustomer,
  ContractorScopeCenter,
  ContractorScopeCrewMember,
  CustomerRoleScopePayload,
  CustomerScopeCenter,
  CustomerScopeCrewMember,
  CustomerScopeService,
  CenterRoleScopePayload,
  CenterScopeCrewMember,
  CenterScopeService,
  CrewRoleScopePayload,
  CrewScopeService,
  WarehouseRoleScopePayload,
  WarehouseScopeOrder,
  WarehouseScopeInventoryItem,
  HubScopeReference,
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
  // Assignment activities
  assignment_made: 'action',
  manager_assigned: 'action',
  contractor_assigned_to_manager: 'action',
  customer_assigned_to_contractor: 'action',
  center_assigned_to_customer: 'action',
  crew_assigned_to_center: 'action',
  order_assigned_to_warehouse: 'action',

  // Creation activities
  manager_created: 'action',
  contractor_created: 'action',
  customer_created: 'action',
  center_created: 'action',
  crew_created: 'action',
  warehouse_created: 'action',
  order_created: 'action',
  service_created: 'action',
  report_created: 'warning',
  feedback_created: 'info',

  // Success/completion activities
  order_delivered: 'success',
  order_completed: 'success',
  service_completed: 'success',
  order_accepted: 'success',
  order_approved: 'success',
  report_resolved: 'success',

  // Warning/error activities
  order_cancelled: 'warning',
  order_rejected: 'warning',
  order_failed: 'warning',
  service_cancelled: 'warning',
  support_ticket_updated: 'warning',

  // Update activities
  order_updated: 'info',
  service_updated: 'info',
  profile_updated: 'info',
  report_acknowledged: 'info',
  feedback_acknowledged: 'info',
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
    activityType: row.activity_type, // Preserve specific type like "crew_assigned_to_center"
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
       -- Exclude archive/delete activities (admin-only)
       activity_type NOT LIKE '%_archived'
       AND activity_type NOT LIKE '%_deleted'
       AND activity_type NOT LIKE '%_hard_deleted'
       AND activity_type NOT LIKE '%_restored'
     ) AND (
       -- Show creation activities ONLY if target is self
       (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where YOU are being assigned (target is self)
       (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where someone is assigned TO you (you're the parent)
       (
         (activity_type = 'contractor_assigned_to_manager' AND metadata ? 'managerId' AND UPPER(metadata->>'managerId') = $2)
       )
       OR
       -- Show other activity types (orders, services, creations, etc.) for ecosystem
       -- SAFE: Only if target is in ecosystem OR actor is self OR metadata references self
       -- Creation events now visible for ecosystem (scoped by idArray + dismissals)
       (
         activity_type NOT LIKE '%assigned%'
         AND activity_type != 'assignment_made'
       )
       AND (
         (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
         OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
         OR (metadata ? 'managerId' AND UPPER(metadata->>'managerId') = $2)
         OR (metadata ? 'cksManager' AND UPPER(metadata->>'cksManager') = $2)
       )
     )
     AND NOT EXISTS (
       SELECT 1 FROM activity_dismissals ad
       WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
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

async function getContractorRoleScope(cksCode: string): Promise<ContractorRoleScopePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const contractorResult = await query<{
    cks_manager: string | null;
    status: string | null
  }>(
    `SELECT cks_manager, status FROM contractors WHERE UPPER(contractor_id) = $1 LIMIT 1`,
    [normalizedCode],
  );

  if (!contractorResult.rowCount) {
    return null;
  }

  const contractorRow = contractorResult.rows[0];

  const [customerRows, centerRows, crewRows, serviceCount] = await Promise.all([
    query<{
      customer_id: string;
      name: string | null;
      main_contact: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT customer_id, name, main_contact, email, phone, address, status
       FROM customers
       WHERE UPPER(contractor_id) = $1
       ORDER BY customer_id`,
      [normalizedCode],
    ),
    query<{
      center_id: string;
      customer_id: string | null;
      name: string | null;
      main_contact: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT center_id, customer_id, name, main_contact, email, phone, address, status
       FROM centers
       WHERE UPPER(contractor_id) = $1
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
      `SELECT c.crew_id, c.assigned_center, c.name, c.email, c.phone, c.address, c.status
       FROM crew c
       INNER JOIN centers ct ON UPPER(c.assigned_center) = UPPER(ct.center_id)
       WHERE UPPER(ct.contractor_id) = $1
       ORDER BY c.crew_id`,
      [normalizedCode],
    ),
    // Services count - simplified query since services table structure is different
    query<{ count: string }>(
      `SELECT '0'::text AS count`,
      [],
    ),
  ]);

  const customers: ContractorScopeCustomer[] = customerRows.rows.map((row) => ({
    id: ensureId(row.customer_id, 'CUSTOMER'),
    role: 'customer',
    contractorId: normalizedCode,
    name: toNullableString(row.name),
    mainContact: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const centers: ContractorScopeCenter[] = centerRows.rows.map((row) => ({
    id: ensureId(row.center_id, 'CENTER'),
    role: 'center',
    contractorId: normalizedCode,
    customerId: toNullableString(row.customer_id ? normalizeIdentity(row.customer_id) : null),
    name: toNullableString(row.name),
    mainContact: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const crew: ContractorScopeCrewMember[] = crewRows.rows.map((row) => ({
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
    role: 'contractor',
    cksCode: normalizedCode,
    summary: {
      customerCount: customers.length,
      centerCount: centers.length,
      crewCount: crew.length,
      serviceCount: toCount(serviceCount.rows[0]),
      accountStatus: normalizeStatus(contractorRow.status),
    },
    relationships: {
      manager: null,  // Contractors don't see their manager
      customers,
      centers,
      crew,
    },
  };
}

async function getCustomerRoleScope(cksCode: string): Promise<CustomerRoleScopePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const customerResult = await query<{
    contractor_id: string | null;
    cks_manager: string | null;
    status: string | null
  }>(
    `SELECT contractor_id, cks_manager, status FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1`,
    [normalizedCode],
  );

  if (!customerResult.rowCount) {
    return null;
  }

  const customerRow = customerResult.rows[0];

  const [centerRows, crewRows, serviceRows] = await Promise.all([
    query<{
      center_id: string;
      contractor_id: string | null;
      name: string | null;
      main_contact: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT center_id, contractor_id, name, main_contact, email, phone, address, status
       FROM centers
       WHERE UPPER(customer_id) = $1
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
      `SELECT c.crew_id, c.assigned_center, c.name, c.email, c.phone, c.address, c.status
       FROM crew c
       INNER JOIN centers ct ON UPPER(c.assigned_center) = UPPER(ct.center_id)
       WHERE UPPER(ct.customer_id) = $1
       ORDER BY c.crew_id`,
      [normalizedCode],
    ),
    // Services - simplified query since services table structure is different
    query<{
      service_id: string;
      name: string | null;
      category: string | null;
      status: string | null;
    }>(
      `SELECT service_id, service_name AS name, category, status
       FROM services
       WHERE 1=0`,  // Temporary: return empty until we understand the correct relationships
      [],
    ),
  ]);

  const centers: CustomerScopeCenter[] = centerRows.rows.map((row) => ({
    id: ensureId(row.center_id, 'CENTER'),
    role: 'center',
    contractorId: toNullableString(row.contractor_id ? normalizeIdentity(row.contractor_id) : null),
    customerId: normalizedCode,
    name: toNullableString(row.name),
    mainContact: toNullableString(row.main_contact),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const crew: CustomerScopeCrewMember[] = crewRows.rows.map((row) => ({
    id: ensureId(row.crew_id, 'CREW'),
    role: 'crew',
    assignedCenter: toNullableString(row.assigned_center ? normalizeIdentity(row.assigned_center) : null),
    name: toNullableString(row.name),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const services: CustomerScopeService[] = serviceRows.rows.map((row) => ({
    id: ensureId(row.service_id, 'SERVICE'),
    role: 'service',
    name: toNullableString(row.name),
    category: toNullableString(row.category),
    status: toNullableString(row.status),
  }));

  return {
    role: 'customer',
    cksCode: normalizedCode,
    summary: {
      centerCount: centers.length,
      crewCount: crew.length,
      serviceCount: services.length,
      accountStatus: normalizeStatus(customerRow.status),
    },
    relationships: {
      manager: null,     // Customers don't see their manager
      contractor: null,  // Customers don't see their contractor
      centers,
      crew,
      services,
    },
  };
}

async function getCenterRoleScope(cksCode: string): Promise<CenterRoleScopePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const centerResult = await query<{
    contractor_id: string | null;
    customer_id: string | null;
    cks_manager: string | null;
    status: string | null
  }>(
    `SELECT contractor_id, customer_id, cks_manager, status FROM centers WHERE UPPER(center_id) = $1 LIMIT 1`,
    [normalizedCode],
  );

  if (!centerResult.rowCount) {
    return null;
  }

  const centerRow = centerResult.rows[0];

  const [crewRows, serviceRows, pendingRequests] = await Promise.all([
    query<{
      crew_id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string | null;
    }>(
      `SELECT crew_id, name, email, phone, address, status
       FROM crew
       WHERE UPPER(assigned_center) = $1
       ORDER BY crew_id`,
      [normalizedCode],
    ),
    // Services - simplified query since services table structure is different
    query<{
      service_id: string;
      name: string | null;
      category: string | null;
      status: string | null;
    }>(
      `SELECT service_id, service_name AS name, category, status
       FROM services
       WHERE 1=0`,  // Temporary: return empty until we understand the correct relationships
      [],
    ),
    // Pending requests - simplified for now
    query<{ count: string }>(
      `SELECT '0'::text AS count`,
      [],
    ),
  ]);

  const crew: CenterScopeCrewMember[] = crewRows.rows.map((row) => ({
    id: ensureId(row.crew_id, 'CREW'),
    role: 'crew',
    assignedCenter: normalizedCode,
    name: toNullableString(row.name),
    email: toNullableString(row.email),
    phone: toNullableString(row.phone),
    address: toNullableString(row.address),
    status: toNullableString(row.status),
  }));

  const services: CenterScopeService[] = serviceRows.rows.map((row) => ({
    id: ensureId(row.service_id, 'SERVICE'),
    role: 'service',
    name: toNullableString(row.name),
    category: toNullableString(row.category),
    status: toNullableString(row.status),
  }));

  return {
    role: 'center',
    cksCode: normalizedCode,
    summary: {
      crewCount: crew.length,
      activeServices: services.length,
      pendingRequests: toCount(pendingRequests.rows[0]),
      accountStatus: normalizeStatus(centerRow.status),
    },
    relationships: {
      manager: null,     // Centers don't see their manager
      contractor: null,  // Centers don't see their contractor
      customer: null,    // Centers don't see their customer
      crew,
      services,
    },
  };
}

async function getCrewRoleScope(cksCode: string): Promise<CrewRoleScopePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const crewResult = await query<{
    assigned_center: string | null;
    cks_manager: string | null;
    status: string | null
  }>(
    `SELECT assigned_center, cks_manager, status FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1`,
    [normalizedCode],
  );

  if (!crewResult.rowCount) {
    return null;
  }

  const crewRow = crewResult.rows[0];
  const centerCode = normalizeIdentity(crewRow.assigned_center);

  const [centerInfo, serviceRows, completedToday, trainings] = await Promise.all([
    centerCode ? query<{
      center_id: string;
      contractor_id: string | null;
      customer_id: string | null;
      name: string | null;
      email: string | null;
      phone: string | null;
      status: string | null;
    }>(
      `SELECT center_id, contractor_id, customer_id, name, email, phone, status
       FROM centers
       WHERE UPPER(center_id) = $1
       LIMIT 1`,
      [centerCode],
    ) : Promise.resolve({ rows: [], rowCount: 0 }),
    // Services - simplified query since services table structure is different
    query<{
      service_id: string;
      name: string | null;
      category: string | null;
      status: string | null;
    }>(
      `SELECT service_id, service_name AS name, category, status
       FROM services
       WHERE 1=0`,  // Temporary: return empty until we understand the correct relationships
      [],
    ),
    // Completed today - simplified for now
    query<{ count: string }>(
      `SELECT '0'::text AS count`,
      [],
    ),
    // Training count - simplified for now
    query<{ count: string }>(
      `SELECT '0'::text AS count`,
      [],
    ),
  ]);

  let center: HubScopeReference<'center'> | null = null;

  if (centerInfo.rowCount) {
    const centerRow = centerInfo.rows[0];
    center = {
      id: ensureId(centerRow.center_id, 'CENTER'),
      role: 'center',
      name: toNullableString(centerRow.name),
      status: toNullableString(centerRow.status),
      email: toNullableString(centerRow.email),
      phone: toNullableString(centerRow.phone),
    };
  }

  const services: CrewScopeService[] = serviceRows.rows.map((row) => ({
    id: ensureId(row.service_id, 'SERVICE'),
    role: 'service',
    name: toNullableString(row.name),
    category: toNullableString(row.category),
    status: toNullableString(row.status),
  }));

  return {
    role: 'crew',
    cksCode: normalizedCode,
    summary: {
      activeServices: services.length,
      completedToday: toCount(completedToday.rows[0]),
      trainings: toCount(trainings.rows[0]),
      accountStatus: normalizeStatus(crewRow.status),
    },
    relationships: {
      manager: null,     // Crew don't see their manager
      contractor: null,  // Crew don't see their contractor
      customer: null,    // Crew don't see their customer
      center,            // Crew CAN see their assigned center
      services,
    },
  };
}

async function getWarehouseRoleScope(cksCode: string): Promise<WarehouseRoleScopePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  const warehouseResult = await query<{
    manager_id: string | null;
    status: string | null
  }>(
    `SELECT manager_id, status FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
    [normalizedCode],
  );

  if (!warehouseResult.rowCount) {
    return null;
  }

  const warehouseRow = warehouseResult.rows[0];

  const [orderRows, inventoryRows, pendingOrders, scheduledDeliveries, lowStock] = await Promise.all([
    query<{
      order_id: string;
      name: string | null;
      status: string | null;
      destination: string | null;
    }>(
      `SELECT order_id, description AS name, status, destination_center AS destination
       FROM orders
       WHERE UPPER(warehouse_id) = $1
       AND LOWER(status) IN ('pending', 'processing', 'shipped')
       ORDER BY created_at DESC
       LIMIT 100`,
      [normalizedCode],
    ),
    query<{
      product_id: string;
      name: string | null;
      quantity: number | null;
      status: string | null;
    }>(
      `SELECT product_id, product_name AS name, quantity,
       CASE WHEN quantity > 0 THEN 'in-stock' ELSE 'out-of-stock' END AS status
       FROM inventory
       WHERE UPPER(warehouse_id) = $1
       ORDER BY product_id
       LIMIT 200`,
      [normalizedCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       WHERE UPPER(warehouse_id) = $1
       AND LOWER(status) = 'pending'`,
      [normalizedCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       WHERE UPPER(warehouse_id) = $1
       AND LOWER(status) = 'scheduled'`,
      [normalizedCode],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM inventory
       WHERE UPPER(warehouse_id) = $1
       AND quantity < minimum_stock_level`,
      [normalizedCode],
    ),
  ]);

  const orders: WarehouseScopeOrder[] = orderRows.rows.map((row) => ({
    id: ensureId(row.order_id, 'ORDER'),
    role: 'order',
    name: toNullableString(row.name),
    status: toNullableString(row.status),
    destination: toNullableString(row.destination),
  }));

  const inventory: WarehouseScopeInventoryItem[] = inventoryRows.rows.map((row) => ({
    id: ensureId(row.product_id, 'PRODUCT'),
    role: 'product',
    name: toNullableString(row.name),
    status: toNullableString(row.status),
    quantity: row.quantity ?? 0,
  }));

  return {
    role: 'warehouse',
    cksCode: normalizedCode,
    summary: {
      inventoryCount: inventory.length,
      pendingOrders: toCount(pendingOrders.rows[0]),
      deliveriesScheduled: toCount(scheduledDeliveries.rows[0]),
      lowStockItems: toCount(lowStock.rows[0]),
      accountStatus: normalizeStatus(warehouseRow.status),
    },
    relationships: {
      manager: null,  // Warehouses don't see their manager
      orders,
      inventory,
    },
  };
}

async function getContractorActivities(cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  const scope = await getContractorRoleScope(cksCode);
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
  // No manager reference anymore
  scope.relationships.customers.forEach((customer) => addId(customer.id));
  scope.relationships.centers.forEach((center) => {
    addId(center.id);
    addId(center.customerId);
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
       -- Exclude archive/delete activities (admin-only)
       activity_type NOT LIKE '%_archived'
       AND activity_type NOT LIKE '%_deleted'
       AND activity_type NOT LIKE '%_hard_deleted'
       AND activity_type NOT LIKE '%_restored'
     ) AND (
       -- Show creation activities ONLY if target is self
       (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where YOU are being assigned (target is self)
       (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where someone is assigned TO you (you're the parent)
       (
         (activity_type = 'customer_assigned_to_contractor' AND metadata ? 'contractorId' AND UPPER(metadata->>'contractorId') = $2)
       )
       OR
       -- Show other activity types (orders, services, creations, etc.) for ecosystem
       -- SAFE: Only if target is in ecosystem OR actor is self OR metadata references self
       -- Creation events now visible for ecosystem (scoped by idArray + dismissals)
       (
         activity_type NOT LIKE '%assigned%'
         AND activity_type != 'assignment_made'
       )
       AND (
         (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
         OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
         OR (metadata ? 'contractorId' AND UPPER(metadata->>'contractorId') = $2)
       )
     )
     AND NOT EXISTS (
       SELECT 1 FROM activity_dismissals ad
       WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [idArray, scope.cksCode],
  );

  const activities = activitiesResult.rows.map(mapActivityRow);

  return {
    role: 'contractor',
    cksCode: scope.cksCode,
    activities,
  };
}

async function getCustomerActivities(cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  const scope = await getCustomerRoleScope(cksCode);
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
  // No manager or contractor references anymore
  scope.relationships.centers.forEach((center) => {
    addId(center.id);
    addId(center.contractorId);
  });
  scope.relationships.crew.forEach((member) => {
    addId(member.id);
    addId(member.assignedCenter);
  });
  scope.relationships.services.forEach((service) => addId(service.id));

  const idArray = Array.from(ids);
  if (!idArray.length) {
    idArray.push(scope.cksCode);
  }

  const activitiesResult = await query<ActivityRow>(
    `SELECT activity_id, description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at
     FROM system_activity
     WHERE (
       -- Exclude archive/delete activities (admin-only)
       activity_type NOT LIKE '%_archived'
       AND activity_type NOT LIKE '%_deleted'
       AND activity_type NOT LIKE '%_hard_deleted'
       AND activity_type NOT LIKE '%_restored'
     ) AND (
       -- Show creation activities ONLY if target is self
       (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where YOU are being assigned (target is self)
       (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where someone is assigned TO you (you're the parent)
       (
         (activity_type = 'center_assigned_to_customer' AND metadata ? 'customerId' AND UPPER(metadata->>'customerId') = $2)
       )
       OR
       -- Show other activity types (orders, services, creations, etc.) for ecosystem
       -- SAFE: Only if target is in ecosystem OR actor is self OR metadata references self
       -- Creation events now visible for ecosystem (scoped by idArray + dismissals)
       (
         activity_type NOT LIKE '%assigned%'
         AND activity_type != 'assignment_made'
       )
       AND (
         (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
         OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
         OR (metadata ? 'customerId' AND UPPER(metadata->>'customerId') = $2)
       )
     )
     AND NOT EXISTS (
       SELECT 1 FROM activity_dismissals ad
       WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [idArray, scope.cksCode],
  );

  const activities = activitiesResult.rows.map(mapActivityRow);

  return {
    role: 'customer',
    cksCode: scope.cksCode,
    activities,
  };
}

async function getCenterActivities(cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  const scope = await getCenterRoleScope(cksCode);
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
  // No upward references anymore
  scope.relationships.crew.forEach((member) => addId(member.id));
  scope.relationships.services.forEach((service) => addId(service.id));

  const idArray = Array.from(ids);
  if (!idArray.length) {
    idArray.push(scope.cksCode);
  }

  const activitiesResult = await query<ActivityRow>(
    `SELECT activity_id, description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at
     FROM system_activity
     WHERE (
       -- Exclude archive/delete activities (admin-only)
       activity_type NOT LIKE '%_archived'
       AND activity_type NOT LIKE '%_deleted'
       AND activity_type NOT LIKE '%_hard_deleted'
       AND activity_type NOT LIKE '%_restored'
     ) AND (
       -- Show creation activities ONLY if target is self
       (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where YOU are being assigned (target is self)
       (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where someone is assigned TO you (you're the parent)
       (
         (activity_type = 'crew_assigned_to_center' AND metadata ? 'centerId' AND UPPER(metadata->>'centerId') = $2)
       )
       OR
       -- Show other activity types (orders, services, creations, etc.) for ecosystem
       -- SAFE: Only if target is in ecosystem OR actor is self OR metadata references self
       -- Creation events now visible for ecosystem (scoped by idArray + dismissals)
       (
         activity_type NOT LIKE '%assigned%'
         AND activity_type != 'assignment_made'
       )
       AND (
         (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
         OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
         OR (metadata ? 'centerId' AND UPPER(metadata->>'centerId') = $2)
       )
     )
     AND NOT EXISTS (
       SELECT 1 FROM activity_dismissals ad
       WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [idArray, scope.cksCode],
  );

  const activities = activitiesResult.rows.map(mapActivityRow);

  return {
    role: 'center',
    cksCode: scope.cksCode,
    activities,
  };
}

async function getCrewActivities(cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  const scope = await getCrewRoleScope(cksCode);
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
  // Crew can see their center
  addId(scope.relationships.center?.id);
  scope.relationships.services.forEach((service) => addId(service.id));

  const idArray = Array.from(ids);
  if (!idArray.length) {
    idArray.push(scope.cksCode);
  }

  const activitiesResult = await query<ActivityRow>(
    `SELECT activity_id, description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at
     FROM system_activity
     WHERE (
       -- Exclude archive/delete activities (admin-only)
       activity_type NOT LIKE '%_archived'
       AND activity_type NOT LIKE '%_deleted'
       AND activity_type NOT LIKE '%_hard_deleted'
       AND activity_type NOT LIKE '%_restored'
     ) AND (
       -- Show creation activities ONLY if target is self
       (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where YOU are being assigned (target is self)
       (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where you are assigned to a center (crew is in metadata)
       (activity_type = 'crew_assigned_to_center' AND metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
       OR
       -- Show other activity types (orders, services, creations, etc.) for ecosystem
       -- SAFE: Only if target is in ecosystem OR actor is self OR metadata references self
       -- Creation events now visible for ecosystem (scoped by idArray + dismissals)
       (
         activity_type NOT LIKE '%assigned%'
         AND activity_type != 'assignment_made'
       )
       AND (
         (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
         OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
         OR (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
       )
     )
     AND NOT EXISTS (
       SELECT 1 FROM activity_dismissals ad
       WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [idArray, scope.cksCode],
  );

  const activities = activitiesResult.rows.map(mapActivityRow);

  return {
    role: 'crew',
    cksCode: scope.cksCode,
    activities,
  };
}

async function getWarehouseActivities(cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  const scope = await getWarehouseRoleScope(cksCode);
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
  // No manager reference anymore
  scope.relationships.orders.forEach((order) => addId(order.id));
  scope.relationships.inventory.forEach((item) => addId(item.id));

  const idArray = Array.from(ids);
  if (!idArray.length) {
    idArray.push(scope.cksCode);
  }

  const activitiesResult = await query<ActivityRow>(
    `SELECT activity_id, description, activity_type, actor_id, actor_role, target_id, target_type, metadata, created_at
     FROM system_activity
     WHERE (
       -- Exclude archive/delete activities (admin-only)
       activity_type NOT LIKE '%_archived'
       AND activity_type NOT LIKE '%_deleted'
       AND activity_type NOT LIKE '%_hard_deleted'
       AND activity_type NOT LIKE '%_restored'
     ) AND (
       -- Show creation activities ONLY if target is self
       (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where YOU are being assigned (target is self)
       (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
       OR
       -- Show assignments where someone is assigned TO you (warehouse might have order assignments)
       (
         (activity_type = 'order_assigned_to_warehouse' AND metadata ? 'warehouseId' AND UPPER(metadata->>'warehouseId') = $2)
       )
       OR
       -- Show other activity types (orders, services, creations, etc.) for ecosystem
       -- SAFE: Only if target is in ecosystem OR actor is self OR metadata references self
       -- Creation events now visible for ecosystem (scoped by idArray + dismissals)
       (
         activity_type NOT LIKE '%assigned%'
         AND activity_type != 'assignment_made'
       )
       AND (
         (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
         OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
         OR (metadata ? 'warehouseId' AND UPPER(metadata->>'warehouseId') = $2)
       )
     )
     AND NOT EXISTS (
       SELECT 1 FROM activity_dismissals ad
       WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [idArray, scope.cksCode],
  );

  const activities = activitiesResult.rows.map(mapActivityRow);

  return {
    role: 'warehouse',
    cksCode: scope.cksCode,
    activities,
  };
}

export async function getRoleActivities(role: HubRole, cksCode: string): Promise<HubRoleActivitiesPayload | null> {
  switch (role) {
    case 'manager':
      return getManagerActivities(cksCode);
    case 'contractor':
      return getContractorActivities(cksCode);
    case 'customer':
      return getCustomerActivities(cksCode);
    case 'center':
      return getCenterActivities(cksCode);
    case 'crew':
      return getCrewActivities(cksCode);
    case 'warehouse':
      return getWarehouseActivities(cksCode);
    default:
      return null;
  }
}

export async function getRoleScope(role: HubRole, cksCode: string): Promise<HubRoleScopePayload | null> {
  switch (role) {
    case 'manager':
      return getManagerRoleScope(cksCode);
    case 'contractor':
      return getContractorRoleScope(cksCode);
    case 'customer':
      return getCustomerRoleScope(cksCode);
    case 'center':
      return getCenterRoleScope(cksCode);
    case 'crew':
      return getCrewRoleScope(cksCode);
    case 'warehouse':
      return getWarehouseRoleScope(cksCode);
    default:
      return null;
  }
}

