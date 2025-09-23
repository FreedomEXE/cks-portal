import { apiFetch, type ApiResponse } from './client';

export interface ManagerCreatePayload {
  fullName: string;
  territory: string;
  phone: string;
  email: string;
  role: string;
  reportsTo: string;
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
}

export interface ContractorCreatePayload {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export interface ContractorRecord {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  managerId: string | null;
}

export interface CustomerCreatePayload {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  contractorId: string | null;
}

export interface CenterCreatePayload {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export interface CenterRecord {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  customerId: string | null;
  contractorId: string | null;
}

export interface CrewCreatePayload {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export interface CrewRecord {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  assignedCenter: string | null;
}

export interface WarehouseCreatePayload {
  name: string;
  managerId?: string;
  email?: string;
  phone?: string;
  address?: string;
  warehouseType?: string;
  status?: string;
}

export interface WarehouseRecord {
  id: string;
  name: string;
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
): Promise<TData> {
  return apiFetch<ApiResponse<TData>>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function createManager(payload: ManagerCreatePayload): Promise<ManagerRecord> {
  return postProvision<ManagerRecord, ManagerCreatePayload>('/admin/provision/managers', payload);
}

export function createContractor(payload: ContractorCreatePayload): Promise<ContractorRecord> {
  return postProvision<ContractorRecord, ContractorCreatePayload>('/admin/provision/contractors', payload);
}

export function createCustomer(payload: CustomerCreatePayload): Promise<CustomerRecord> {
  return postProvision<CustomerRecord, CustomerCreatePayload>('/admin/provision/customers', payload);
}

export function createCenter(payload: CenterCreatePayload): Promise<CenterRecord> {
  return postProvision<CenterRecord, CenterCreatePayload>('/admin/provision/centers', payload);
}

export function createCrew(payload: CrewCreatePayload): Promise<CrewRecord> {
  return postProvision<CrewRecord, CrewCreatePayload>('/admin/provision/crew', payload);
}

export function createWarehouse(payload: WarehouseCreatePayload): Promise<WarehouseRecord> {
  return postProvision<WarehouseRecord, WarehouseCreatePayload>('/admin/provision/warehouses', payload);
}
