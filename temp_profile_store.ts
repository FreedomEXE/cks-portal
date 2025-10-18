import { query } from "../../db/connection";
import { normalizeIdentity } from "../identity";
import type { HubProfilePayload, HubRelatedContact, HubRole } from "./types";

interface CustomerRow {
  customer_id: string;
  name: string | null;
  main_contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  cks_manager: string | null;
  contractor_id: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface ManagerRow {
  manager_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  territory: string | null;
  reports_to: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface ContractorRow {
  contractor_id: string;
  name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  cks_manager: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface CenterRow {
  center_id: string;
  name: string | null;
  main_contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  cks_manager: string | null;
  contractor_id: string | null;
  customer_id: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface CrewRow {
  crew_id: string;
  name: string | null;
  status: string | null;
  emergency_contact: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  assigned_center: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface WarehouseRow {
  warehouse_id: string;
  name: string | null;
  main_contact: string | null;
  manager_id: string | null;
  warehouse_type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  capacity: string | number | null;
  current_utilization: string | number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

function toIso(input: Date | string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  const value = input instanceof Date ? input : new Date(input);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function toNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) {
    return null;
  }
  const value = typeof input === "number" ? input : Number(input);
  return Number.isNaN(value) ? null : value;
}

function mapContact(options: {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}): HubRelatedContact {
  return {
    id: options.id,
    name: options.name,
    email: options.email,
    phone: options.phone,
  };
}

async function loadManagerContact(managerId: string | null): Promise<HubRelatedContact | null> {
  if (!managerId) {
    return null;
  }
  const normalized = normalizeIdentity(managerId);
  if (!normalized) {
    return null;
  }
  const result = await query<ManagerRow>(
    `SELECT manager_id, name, email, phone
     FROM managers
     WHERE UPPER(manager_id) = $1
     LIMIT 1`,
    [normalized],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return mapContact({
    id: row.manager_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
  });
}

// Lightweight helper to read a manager's territory for related profiles
async function loadManagerTerritory(managerId: string | null): Promise<string | null> {
  if (!managerId) {
    return null;
  }
  const normalized = normalizeIdentity(managerId);
  if (!normalized) {
    return null;
  }
  const result = await query<ManagerRow>(
    `SELECT manager_id, name, email, phone, territory
     FROM managers
     WHERE UPPER(manager_id) = $1
     LIMIT 1`,
    [normalized],
  );
  const row = result.rows[0];
  return row ? (row as any).territory ?? null : null;
}

async function loadContractorContact(contractorId: string | null): Promise<HubRelatedContact | null> {
  if (!contractorId) {
    return null;
  }
  const normalized = normalizeIdentity(contractorId);
  if (!normalized) {
    return null;
  }
  const result = await query<ContractorRow>(
    `SELECT contractor_id, name, contact_person, email, phone
     FROM contractors
     WHERE UPPER(contractor_id) = $1
     LIMIT 1`,
    [normalized],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  const name = row.name ?? row.contact_person;
  return mapContact({
    id: row.contractor_id,
    name: name ?? row.contractor_id,
    email: row.email,
    phone: row.phone,
  });
}

async function loadCustomerContact(customerId: string | null): Promise<HubRelatedContact | null> {
  if (!customerId) {
    return null;
  }
  const normalized = normalizeIdentity(customerId);
  if (!normalized) {
    return null;
  }
  const result = await query<CustomerRow>(
    `SELECT customer_id, name, main_contact, email, phone
     FROM customers
     WHERE UPPER(customer_id) = $1
     LIMIT 1`,
    [normalized],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return mapContact({
    id: row.customer_id,
    name: row.name ?? row.customer_id,
    email: row.email,
    phone: row.phone,
  });
}

interface CenterDetails {
  contact: HubRelatedContact | null;
  managerId: string | null;
  contractorId: string | null;
  customerId: string | null;
  address: string | null;
}

async function loadCenterDetails(centerId: string | null): Promise<CenterDetails | null> {
  if (!centerId) {
    return null;
  }
  const normalized = normalizeIdentity(centerId);
  if (!normalized) {
    return null;
  }
  const result = await query<CenterRow>(
    `SELECT center_id, name, main_contact, email, phone, address, cks_manager, contractor_id, customer_id
     FROM centers
     WHERE UPPER(center_id) = $1
     LIMIT 1`,
    [normalized],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    contact: mapContact({
      id: row.center_id,
      name: row.name ?? row.center_id,
      email: row.email,
      phone: row.phone,
    }),
    managerId: row.cks_manager ?? null,
    contractorId: row.contractor_id ?? null,
    customerId: row.customer_id ?? null,
    address: row.address ?? null,
  };
}

async function getCustomerProfile(cksCode: string): Promise<HubProfilePayload | null> {
  const result = await query<CustomerRow>(
    `SELECT customer_id, name, main_contact, email, phone, address, status,
            cks_manager, contractor_id, created_at, updated_at
     FROM customers
     WHERE UPPER(customer_id) = $1
     LIMIT 1`,
    [cksCode],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const manager = await loadManagerContact(row.cks_manager);
  const contractor = await loadContractorContact(row.contractor_id);

  return {
    role: "customer",
    cksCode: row.customer_id,
    name: row.name ?? row.customer_id,
    status: row.status ?? null,
    mainContact: row.main_contact ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    manager,
    contractor,
    metadata: {
      contractorId: row.contractor_id ?? null,
      managerId: row.cks_manager ?? null,
    },
  };
}

async function getManagerProfile(cksCode: string): Promise<HubProfilePayload | null> {
  const result = await query<ManagerRow>(
    `SELECT manager_id, name, email, phone, address, status, territory, reports_to, created_at, updated_at
     FROM managers
     WHERE UPPER(manager_id) = $1
     LIMIT 1`,
    [cksCode],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const reportsTo = await loadManagerContact(row.reports_to);

  return {
    role: "manager",
    cksCode: row.manager_id,
    name: row.name ?? row.manager_id,
    status: row.status ?? null,
    mainContact: row.name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    manager: reportsTo,
    metadata: {
      reportsTo: row.reports_to ?? null,
      territory: row.territory ?? null,
    },
  };
}

async function getContractorProfile(cksCode: string): Promise<HubProfilePayload | null> {
  const result = await query<ContractorRow>(
    `SELECT contractor_id, name, contact_person, email, phone, address, status, cks_manager, created_at, updated_at
     FROM contractors
     WHERE UPPER(contractor_id) = $1
     LIMIT 1`,
    [cksCode],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const manager = await loadManagerContact(row.cks_manager);

  return {
    role: "contractor",
    cksCode: row.contractor_id,
    name: row.name ?? row.contractor_id,
    status: row.status ?? null,
    mainContact: row.contact_person ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    manager,
    metadata: {
      managerId: row.cks_manager ?? null,
    },
  };
}

async function getCenterProfile(cksCode: string): Promise<HubProfilePayload | null> {
  const result = await query<CenterRow>(
    `SELECT center_id, name, main_contact, email, phone, address, cks_manager, contractor_id, customer_id, created_at, updated_at
     FROM centers
     WHERE UPPER(center_id) = $1
     LIMIT 1`,
    [cksCode],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const manager = await loadManagerContact(row.cks_manager);
  const contractor = await loadContractorContact(row.contractor_id);
  const customer = await loadCustomerContact(row.customer_id);

  return {
    role: "center",
    cksCode: row.center_id,
    name: row.name ?? row.center_id,
    status: null,
    mainContact: row.main_contact ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    manager,
    contractor,
    customer,
    metadata: {
      managerId: row.cks_manager ?? null,
      contractorId: row.contractor_id ?? null,
      customerId: row.customer_id ?? null,
    },
  };
}

async function getCrewProfile(cksCode: string): Promise<HubProfilePayload | null> {
  const result = await query<CrewRow>(
    `SELECT crew_id, name, status, emergency_contact, address, phone, email, assigned_center, created_at, updated_at
     FROM crew
     WHERE UPPER(crew_id) = $1
     LIMIT 1`,
    [cksCode],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const centerDetails = await loadCenterDetails(row.assigned_center ?? null);
  const manager = centerDetails ? await loadManagerContact(centerDetails.managerId) : null;
  const managerTerritory = centerDetails?.managerId ? await loadManagerTerritory(centerDetails.managerId) : null;
  const contractor = centerDetails ? await loadContractorContact(centerDetails.contractorId) : null;
  const customer = centerDetails ? await loadCustomerContact(centerDetails.customerId) : null;

  return {
    role: "crew",
    cksCode: row.crew_id,
    name: row.name ?? row.crew_id,
    status: row.status ?? null,
    mainContact: row.emergency_contact ?? row.name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    manager,
    contractor,
    customer,
    center: centerDetails?.contact ?? null,
    metadata: {
      assignedCenter: row.assigned_center ?? null,
      emergencyContact: row.emergency_contact ?? null,
      centerAddress: centerDetails?.address ?? null,
      territory: managerTerritory ?? null,
    },
  };
}

async function getWarehouseProfile(cksCode: string): Promise<HubProfilePayload | null> {
  const result = await query<WarehouseRow>(
    `SELECT warehouse_id, name, main_contact, manager_id, warehouse_type, address, phone, email, status, capacity, current_utilization, created_at, updated_at
     FROM warehouses
     WHERE UPPER(warehouse_id) = $1
     LIMIT 1`,
    [cksCode],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  // Warehouses do not have managers; keep related fields null

  return {
    role: "warehouse",
    cksCode: row.warehouse_id,
    name: row.name ?? row.warehouse_id,
    status: row.status ?? null,
    mainContact: row.main_contact ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    manager: null,
    metadata: {
      managerId: row.manager_id ?? null,
      warehouseType: row.warehouse_type ?? null,
      capacity: toNumber(row.capacity),
      currentUtilization: toNumber(row.current_utilization),
      // No territory linkage for warehouses; leave unset unless schema adds it later
      territory: null,
    },
  };
}

export async function getHubProfile(role: HubRole, cksCode: string): Promise<HubProfilePayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  switch (role) {
    case "customer":
      return getCustomerProfile(normalizedCode);
    case "manager":
      return getManagerProfile(normalizedCode);
    case "contractor":
      return getContractorProfile(normalizedCode);
    case "center":
      return getCenterProfile(normalizedCode);
    case "crew":
      return getCrewProfile(normalizedCode);
    case "warehouse":
      return getWarehouseProfile(normalizedCode);
    default:
      return null;
  }
}
