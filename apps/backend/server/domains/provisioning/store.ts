import { query } from '../../db/connection';
import { nextIdentityId, normalizeIdentity } from '../identity';
import {
  managerCreateSchema,
  contractorCreateSchema,
  customerCreateSchema,
  centerCreateSchema,
  crewCreateSchema,
  warehouseCreateSchema,
} from './validators';

export interface AuditContext {
  actorId: string;
  actorRole: string;
  actorName?: string | null;
}

export interface ManagerRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  territory: string | null;
  role: string | null;
  reportsTo: string | null;
  address: string | null;
  status: string;
}

export interface ContractorRecord {
  id: string;
  name: string;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  managerId: string | null;
}

export interface CustomerRecord {
  id: string;
  name: string;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  contractorId: string | null;
}

export interface CenterRecord {
  id: string;
  name: string;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  customerId: string | null;
  contractorId: string | null;
}

export interface CrewRecord {
  id: string;
  name: string;
  emergencyContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  assignedCenter: string | null;
}

export interface WarehouseRecord {
  id: string;
  name: string;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  warehouseType: string | null;
  managerId: string | null;
}

interface ActivityPayload {
  activityType: string;
  description: string;
  actor: AuditContext;
  targetId: string;
  targetType: string;
  metadata?: Record<string, unknown>;
}

function toNullable(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toNullableLower(value?: string | null): string | null {
  const normalized = toNullable(value);
  return normalized ? normalized.toLowerCase() : null;
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
    console.warn('[activity] Failed to record activity', {
      activityType: payload.activityType,
      targetId: payload.targetId,
      error,
    });
  }
}

export async function createManager(
  input: unknown,
  actor: AuditContext,
): Promise<ManagerRecord> {
  const payload = managerCreateSchema.parse(input);
  const id = await nextIdentityId('manager');

  const result = await query<{
    manager_id: string;
    manager_name: string;
    email: string | null;
    phone: string | null;
    territory: string | null;
    role: string | null;
    reports_to: string | null;
    address: string | null;
    status: string;
  }>(
    `INSERT INTO managers (
      manager_id,
      manager_name,
      email,
      phone,
      territory,
      role,
      reports_to,
      address,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING manager_id, manager_name, email, phone, territory, role, reports_to, address, status`,
    [
      id,
      payload.fullName.trim(),
      payload.email.trim().toLowerCase(),
      payload.phone.trim(),
      toNullable(payload.territory),
      payload.role,
      payload.reportsTo ?? null,
      payload.address.trim(),
      'active',
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert manager record');
  }

  await recordActivity({
    actor,
    activityType: 'manager_created',
    description: `Manager ${id} created`,
    targetId: id,
    targetType: 'manager',
    metadata: {
      name: payload.fullName.trim(),
      role: payload.role,
      reportsTo: payload.reportsTo,
    },
  });

  return {
    id,
    name: row.manager_name,
    email: row.email,
    phone: row.phone,
    territory: row.territory,
    role: row.role,
    reportsTo: row.reports_to,
    address: row.address,
    status: row.status,
  };
}

export async function createContractor(
  input: unknown,
  actor: AuditContext,
): Promise<ContractorRecord> {
  const payload = contractorCreateSchema.parse(input);
  const id = await nextIdentityId('contractor');

  const result = await query<{
    contractor_id: string;
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    cks_manager: string | null;
  }>(
    `INSERT INTO contractors (
      contractor_id,
      company_name,
      contact_person,
      email,
      phone,
      address,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING contractor_id, company_name, contact_person, email, phone, address, status, cks_manager`,
    [
      id,
      payload.name.trim(),
      payload.mainContact.trim(),
      payload.email.trim().toLowerCase(),
      payload.phone.trim(),
      payload.address.trim(),
      'unassigned',
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert contractor record');
  }

  await recordActivity({
    actor,
    activityType: 'contractor_created',
    description: `Contractor ${id} created`,
    targetId: id,
    targetType: 'contractor',
    metadata: { name: payload.name.trim() },
  });

  return {
    id,
    name: row.company_name,
    mainContact: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status,
    managerId: row.cks_manager,
  };
}


export async function createCustomer(
  input: unknown,
  actor: AuditContext,
): Promise<CustomerRecord> {
  const payload = customerCreateSchema.parse(input);
  const id = await nextIdentityId('customer');

  const result = await query<{
    customer_id: string;
    company_name: string;
    main_contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string | null;
    contractor_id: string | null;
  }>(
    `INSERT INTO customers (
      customer_id,
      company_name,
      main_contact,
      email,
      phone,
      address,
      status,
      contractor_id,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NOW(), NOW())
    RETURNING customer_id, company_name, main_contact, email, phone, address, status, contractor_id`,
    [
      id,
      payload.name.trim(),
      payload.mainContact.trim(),
      payload.email.trim().toLowerCase(),
      payload.phone.trim(),
      payload.address.trim(),
      'unassigned',
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert customer record');
  }

  await recordActivity({
    actor,
    activityType: 'customer_created',
    description: `Customer ${id} created`,
    targetId: id,
    targetType: 'customer',
    metadata: { name: payload.name.trim() },
  });

  return {
    id,
    name: row.company_name,
    mainContact: row.main_contact,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status ?? 'unassigned',
    contractorId: row.contractor_id,
  };
}


export async function createCenter(
  input: unknown,
  actor: AuditContext,
): Promise<CenterRecord> {
  const payload = centerCreateSchema.parse(input);
  const id = await nextIdentityId('center');

  const result = await query<{
    center_id: string;
    name: string;
    main_contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string | null;
    customer_id: string | null;
    contractor_id: string | null;
  }>(
    `INSERT INTO centers (
      center_id,
      name,
      main_contact,
      email,
      phone,
      address,
      status,
      customer_id,
      contractor_id,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NOW(), NOW())
    RETURNING center_id, name, main_contact, email, phone, address, status, customer_id, contractor_id`,
    [
      id,
      payload.name.trim(),
      payload.mainContact.trim(),
      payload.email.trim().toLowerCase(),
      payload.phone.trim(),
      payload.address.trim(),
      'unassigned',
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert center record');
  }

  await recordActivity({
    actor,
    activityType: 'center_created',
    description: `Center ${id} created`,
    targetId: id,
    targetType: 'center',
    metadata: { name: payload.name.trim() },
  });

  return {
    id,
    name: row.name,
    mainContact: row.main_contact,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status ?? 'unassigned',
    customerId: row.customer_id,
    contractorId: row.contractor_id,
  };
}


export async function createCrew(
  input: unknown,
  actor: AuditContext,
): Promise<CrewRecord> {
  const payload = crewCreateSchema.parse(input);
  const id = await nextIdentityId('crew');

  const result = await query<{
    crew_id: string;
    name: string;
    emergency_contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    assigned_center: string | null;
  }>(
    `INSERT INTO crew (
      crew_id,
      name,
      emergency_contact,
      email,
      phone,
      address,
      status,
      assigned_center,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NOW(), NOW())
    RETURNING crew_id, name, emergency_contact, email, phone, address, status, assigned_center`,
    [
      id,
      payload.name.trim(),
      payload.emergencyContact.trim(),
      payload.email.trim().toLowerCase(),
      payload.phone.trim(),
      payload.address.trim(),
      'unassigned',
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert crew record');
  }

  await recordActivity({
    actor,
    activityType: 'crew_created',
    description: `Crew ${id} created`,
    targetId: id,
    targetType: 'crew',
    metadata: { name: payload.name.trim() },
  });

  return {
    id,
    name: row.name,
    emergencyContact: row.emergency_contact,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status,
    assignedCenter: row.assigned_center,
  };
}


export async function createWarehouse(
  input: unknown,
  actor: AuditContext,
): Promise<WarehouseRecord> {
  const payload = warehouseCreateSchema.parse(input);
  const id = await nextIdentityId('warehouse');

  const result = await query<{
    warehouse_id: string;
    warehouse_name: string;
    main_contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string | null;
    warehouse_type: string | null;
    manager_id: string | null;
  }>(
    `INSERT INTO warehouses (
      warehouse_id,
      warehouse_name,
      main_contact,
      email,
      phone,
      address,
      status,
      warehouse_type,
      manager_id,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING warehouse_id, warehouse_name, main_contact, email, phone, address, status, warehouse_type, manager_id`,
    [
      id,
      payload.name.trim(),
      payload.mainContact.trim(),
      payload.email.trim().toLowerCase(),
      payload.phone.trim(),
      payload.address.trim(),
      'operational',
      toNullable(payload.warehouseType),
      normalizeIdentity(payload.managerId ?? null),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert warehouse record');
  }

  await recordActivity({
    actor,
    activityType: 'warehouse_created',
    description: `Warehouse ${id} created`,
    targetId: id,
    targetType: 'warehouse',
    metadata: { name: payload.name.trim() },
  });

  return {
    id,
    name: row.warehouse_name,
    mainContact: row.main_contact,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status ?? 'operational',
    warehouseType: row.warehouse_type,
    managerId: row.manager_id,
  };
}


