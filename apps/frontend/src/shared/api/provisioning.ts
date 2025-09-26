import { apiFetch, type ApiResponse } from './client';

export interface ManagerCreatePayload {
  fullName: string;
  territory: string;
  phone: string;
  email: string;
  role: string;
  reportsTo?: string;
  address: string;
  status?: string;
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
  clerkUserId: string | null;
}

export interface ContractorCreatePayload {
  name: string;
  mainContact: string;
  email: string;
  phone: string;
  address: string;
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

export interface CustomerCreatePayload {
  name: string;
  mainContact: string;
  email: string;
  phone: string;
  address: string;
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

export interface CenterCreatePayload {
  name: string;
  mainContact: string;
  email: string;
  phone: string;
  address: string;
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

export interface CrewCreatePayload {
  name: string;
  emergencyContact: string;
  email: string;
  phone: string;
  address: string;
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

export interface WarehouseCreatePayload {
  name: string;
  mainContact: string;
  email: string;
  phone: string;
  address: string;
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

function postProvision<TData, TPayload>(
  path: string,
  payload: TPayload,
  getToken?: () => Promise<string | null>,
): Promise<TData> {
  return apiFetch<ApiResponse<TData>>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
    getToken,
  }).then((response) => {
    if (!response.data) {
      throw new Error('Invalid response: missing data field');
    }
    return response.data;
  }).catch((error) => {
    console.error('[provisioning] API call failed:', { path, error });
    throw error;
  });
}

export function createManager(payload: ManagerCreatePayload, getToken?: () => Promise<string | null>): Promise<ManagerRecord> {
  return postProvision<ManagerRecord, ManagerCreatePayload>('/admin/provision/managers', payload, getToken);
}

export function createContractor(payload: ContractorCreatePayload, getToken?: () => Promise<string | null>): Promise<ContractorRecord> {
  return postProvision<ContractorRecord, ContractorCreatePayload>('/admin/provision/contractors', payload, getToken);
}

export function createCustomer(payload: CustomerCreatePayload, getToken?: () => Promise<string | null>): Promise<CustomerRecord> {
  return postProvision<CustomerRecord, CustomerCreatePayload>('/admin/provision/customers', payload, getToken);
}

export function createCenter(payload: CenterCreatePayload, getToken?: () => Promise<string | null>): Promise<CenterRecord> {
  return postProvision<CenterRecord, CenterCreatePayload>('/admin/provision/centers', payload, getToken);
}

export function createCrew(payload: CrewCreatePayload, getToken?: () => Promise<string | null>): Promise<CrewRecord> {
  return postProvision<CrewRecord, CrewCreatePayload>('/admin/provision/crew', payload, getToken);
}

export function createWarehouse(payload: WarehouseCreatePayload, getToken?: () => Promise<string | null>): Promise<WarehouseRecord> {
  return postProvision<WarehouseRecord, WarehouseCreatePayload>('/admin/provision/warehouses', payload, getToken);
}

