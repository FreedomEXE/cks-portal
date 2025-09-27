import useSWR from 'swr';
import { useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch, type ApiFetchInit, type ApiResponse } from './client';

export interface HubProfileResponse {
  role: string;
  cksCode: string;
  name: string | null;
  status: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  manager?: HubContactReference | null;
  contractor?: HubContactReference | null;
  customer?: HubContactReference | null;
  center?: HubContactReference | null;
  metadata?: Record<string, unknown> | null;
}

interface HubContactReference {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface CustomerDashboardResponse {
  role: 'customer';
  cksCode: string;
  serviceCount: number;
  centerCount: number;
  crewCount: number;
  pendingRequests: number;
  accountStatus: string | null;
}

export interface ManagerDashboardResponse {
  role: 'manager';
  cksCode: string;
  contractorCount: number;
  customerCount: number;
  centerCount: number;
  crewCount: number;
  pendingOrders: number;
  accountStatus: string | null;
}

export interface ContractorDashboardResponse {
  role: 'contractor';
  cksCode: string;
  centerCount: number;
  crewCount: number;
  activeServices: number;
  pendingOrders: number;
  accountStatus: string | null;
}

export interface CenterDashboardResponse {
  role: 'center';
  cksCode: string;
  crewCount: number;
  activeServices: number;
  pendingRequests: number;
  equipmentCount: number;
  accountStatus: string | null;
  customerId: string | null;
}

export interface CrewDashboardResponse {
  role: 'crew';
  cksCode: string;
  activeServices: number;
  completedToday: number;
  trainings: number;
  accountStatus: string | null;
  assignedCenter: string | null;
}

export interface WarehouseDashboardResponse {
  role: 'warehouse';
  cksCode: string;
  inventoryCount: number;
  pendingOrders: number;
  deliveriesScheduled: number;
  lowStockItems: number;
  accountStatus: string | null;
}

export type HubDashboardResponse =
  | CustomerDashboardResponse
  | ManagerDashboardResponse
  | ContractorDashboardResponse
  | CenterDashboardResponse
  | CrewDashboardResponse
  | WarehouseDashboardResponse;
export interface HubOrderItem {
  orderId: string;
  orderType: 'service' | 'product';
  title: string | null;
  requestedBy: string | null;
  requesterRole?: string | null;
  destination: string | null;
  destinationRole?: string | null;
  requestedDate: string | null;
  expectedDate: string | null;
  status: string | null;
  totalAmount: string | null;
  serviceId: string | null;
  centerId: string | null;
  assignedWarehouse: string | null;
  notes: string | null;
  // Legacy aliases populated by backend for existing hubs
  id?: string | null;
  customerId?: string | null;
  orderDate?: string | null;
  completionDate?: string | null;
  viewerStatus?: string | null;
  approvalStages?: Array<{ role: string; status: string; userId: string | null; timestamp: string | null }>;
  transformedId?: string | null;
}

export interface HubOrdersResponse {
  role: string;
  cksCode: string;
  serviceOrders: HubOrderItem[];
  productOrders: HubOrderItem[];
  orders: HubOrderItem[];
}

export interface HubReportItem {
  id: string;
  type: 'report' | 'feedback';
  category: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'open' | 'closed' | 'in-progress';
  relatedService?: string | null;
  acknowledgments?: Array<{ userId: string; date: string }>;
  tags?: string[];
}

export interface HubReportsResponse {
  role: string;
  cksCode: string;
  reports: HubReportItem[];
  feedback: HubReportItem[];
}

export interface HubInventoryItem {
  productId: string;
  name: string;
  type: string;
  onHand: number;
  min: number;
  location: string;
  isLow: boolean;
  status?: 'active' | 'archived';
  archivedDate?: string | null;
  reason?: string | null;
}

export interface HubInventoryResponse {
  role: string;
  cksCode: string;
  activeItems: HubInventoryItem[];
  archivedItems: HubInventoryItem[];
}

export interface ManagerScopeContractor {
  contractorId: string;
  name: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerScopeCustomer {
  customerId: string;
  contractorId: string | null;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerScopeCenter {
  centerId: string;
  contractorId: string | null;
  customerId: string | null;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerScopeCrewMember {
  crewId: string;
  assignedCenter: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
}

export interface ManagerRoleScopeResponse {
  role: 'manager';
  cksCode: string;
  summary: {
    contractorCount: number;
    customerCount: number;
    centerCount: number;
    crewCount: number;
    pendingOrders: number;
    accountStatus: string | null;
  };
  relationships: {
    contractors: ManagerScopeContractor[];
    customers: ManagerScopeCustomer[];
    centers: ManagerScopeCenter[];
    crew: ManagerScopeCrewMember[];
  };
}

export type HubRoleScopeResponse = ManagerRoleScopeResponse;

export interface HubActivityItem {
  id: string;
  description: string;
  category: string;
  actorId: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface HubActivitiesResponse {
  role: 'manager';
  cksCode: string;
  activities: HubActivityItem[];
}


type Fetcher<T> = (endpoint: string) => Promise<T>;

function buildFetcher<T>(getToken: () => Promise<string | null>): Fetcher<T> {
  return (endpoint: string) => apiFetch<ApiResponse<T>>(endpoint, { getToken }).then((res) => res.data);
}

function useHubSWR<T>(key: string | null, transform?: (value: T) => T) {
  const { getToken } = useClerkAuth();
  const fetcher = useCallback(
    buildFetcher<T>(getToken),
    [getToken],
  );

  return useSWR<T, Error>(key, async (endpoint: string) => {
    const data = await fetcher(endpoint);
    return transform ? transform(data) : data;
  });
}

function sectionPath(section: string, cksCode?: string | null) {
  if (!cksCode) {
    return null;
  }
  return `/hub/${section}/${encodeURIComponent(cksCode)}`;
}

export function useHubProfile(cksCode?: string | null) {
  const key = sectionPath('profile', cksCode);
  const result = useHubSWR<HubProfileResponse>(key);
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubProfile(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubProfileResponse>>(`/hub/profile/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

export function useHubDashboard(cksCode?: string | null) {
  const key = sectionPath('dashboard', cksCode);
  const result = useHubSWR<HubDashboardResponse>(key);
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubDashboard(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubDashboardResponse>>(`/hub/dashboard/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

export function useHubOrders(cksCode?: string | null, options?: { status?: string; type?: 'service' | 'product' }) {
  const query = new URLSearchParams();
  if (options?.status) {
    query.set('status', options.status);
  }
  if (options?.type) {
    query.set('type', options.type);
  }
  const base = sectionPath('orders', cksCode);
  const key = base ? `${base}${query.toString() ? `?${query.toString()}` : ''}` : null;
  const result = useHubSWR<HubOrdersResponse>(key, (value) => ({
    ...value,
    orders:
      Array.isArray(value.orders) && value.orders.length > 0
        ? value.orders
        : [...(value.serviceOrders ?? []), ...(value.productOrders ?? [])],
  }));
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubOrders(cksCode: string, options?: { status?: string; type?: 'service' | 'product' }, init?: ApiFetchInit) {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set('status', options.status);
  }
  if (options?.type) {
    params.set('type', options.type);
  }
  const path = `/hub/orders/${encodeURIComponent(cksCode)}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiFetch<ApiResponse<HubOrdersResponse>>(path, init);
  return response.data;
}

export function useHubReports(cksCode?: string | null) {
  const key = sectionPath('reports', cksCode);
  const result = useHubSWR<HubReportsResponse>(key);
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubReports(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubReportsResponse>>(`/hub/reports/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

export function useHubInventory(cksCode?: string | null) {
  const key = sectionPath('inventory', cksCode);
  const result = useHubSWR<HubInventoryResponse>(key);
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubInventory(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubInventoryResponse>>(`/hub/inventory/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}



export function useHubRoleScope(cksCode?: string | null) {
  const key = sectionPath('scope', cksCode);
  const result = useHubSWR<HubRoleScopeResponse>(key);
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubRoleScope(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubRoleScopeResponse>>(`/hub/scope/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

export function useHubActivities(cksCode?: string | null) {
  const key = sectionPath('activities', cksCode);
  const result = useHubSWR<HubActivitiesResponse>(key, (value) => ({
    ...value,
    activities: Array.isArray(value.activities) ? value.activities : [],
  }));
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export async function fetchHubActivities(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubActivitiesResponse>>(`/hub/activities/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

