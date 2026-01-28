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
export interface HubOrderLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  itemType: 'service' | 'product';
  quantity: number;
  unitOfMeasure: string | null;
  unitPrice: string | null;
  currency: string | null;
  totalPrice: string | null;
  metadata: Record<string, unknown> | null;
}

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
  items?: HubOrderLineItem[];
  // Legacy aliases populated by backend for existing hubs
  id?: string | null;
  customerId?: string | null;
  orderDate?: string | null;
  completionDate?: string | null;
  viewerStatus?: string | null;
  approvalStages?: Array<{ role: string; status: string; userId: string | null; timestamp: string | null }>;
  transformedId?: string | null;
  metadata?: Record<string, unknown> | null;
  archivedAt?: string | null;
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

export type HubRole = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

export type HubScopeNodeRole = HubRole | 'service' | 'product' | 'order' | 'inventory';

export interface HubScopeNode<Role extends HubScopeNodeRole = HubScopeNodeRole> {
  id: string;
  role: Role;
  name: string | null;
  status: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  parentId?: string | null;
  parentRole?: HubScopeNodeRole | null;
  metadata?: Record<string, unknown> | null;
}

export type HubScopeReference<Role extends HubRole = HubRole> = Pick<
  HubScopeNode<Role>,
  'id' | 'role' | 'name' | 'status' | 'email' | 'phone'
>;

export interface ManagerScopeContractor extends HubScopeNode<'contractor'> {
  contactPerson: string | null;
  address: string | null;
}

export interface ManagerScopeCustomer extends HubScopeNode<'customer'> {
  contractorId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ManagerScopeCenter extends HubScopeNode<'center'> {
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ManagerScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ManagerScopeRelationships {
  contractors: ManagerScopeContractor[];
  customers: ManagerScopeCustomer[];
  centers: ManagerScopeCenter[];
  crew: ManagerScopeCrewMember[];
}

export interface ManagerScopeSummary {
  contractorCount: number;
  customerCount: number;
  centerCount: number;
  crewCount: number;
  pendingOrders: number;
  accountStatus: string | null;
}

export interface ContractorScopeCustomer extends HubScopeNode<'customer'> {
  contractorId: string | null;
  mainContact: string | null;
}

export interface ContractorScopeCenter extends HubScopeNode<'center'> {
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
}

export interface ContractorScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
}

export interface ContractorScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  customers: ContractorScopeCustomer[];
  centers: ContractorScopeCenter[];
  crew: ContractorScopeCrewMember[];
}

export interface ContractorScopeSummary {
  customerCount: number;
  centerCount: number;
  crewCount: number;
  serviceCount: number;
  accountStatus: string | null;
}

export interface CustomerScopeCenter extends HubScopeNode<'center'> {
  contractorId: string | null;
  customerId: string | null;
  mainContact: string | null;
}

export interface CustomerScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
}

export interface CustomerScopeService extends HubScopeNode<'service'> {
  category?: string | null;
}

export interface CustomerScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  contractor: HubScopeReference<'contractor'> | null;
  centers: CustomerScopeCenter[];
  crew: CustomerScopeCrewMember[];
  services: CustomerScopeService[];
}

export interface CustomerScopeSummary {
  centerCount: number;
  crewCount: number;
  serviceCount: number;
  accountStatus: string | null;
}

export interface CenterScopeCrewMember extends HubScopeNode<'crew'> {
  assignedCenter: string | null;
}

export interface CenterScopeService extends HubScopeNode<'service'> {
  category?: string | null;
}

export interface CenterScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  contractor: HubScopeReference<'contractor'> | null;
  customer: HubScopeReference<'customer'> | null;
  crew: CenterScopeCrewMember[];
  services: CenterScopeService[];
}

export interface CenterScopeSummary {
  crewCount: number;
  activeServices: number;
  pendingRequests: number;
  accountStatus: string | null;
}

export interface CrewScopeService extends HubScopeNode<'service'> {
  category?: string | null;
}

export interface CrewScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  contractor: HubScopeReference<'contractor'> | null;
  customer: HubScopeReference<'customer'> | null;
  center: HubScopeReference<'center'> | null;
  services: CrewScopeService[];
}

export interface CrewScopeSummary {
  activeServices: number;
  completedToday: number;
  trainings: number;
  accountStatus: string | null;
}

export interface WarehouseScopeOrder extends HubScopeNode<'order'> {
  status: string | null;
  destination?: string | null;
}

export interface WarehouseScopeInventoryItem extends HubScopeNode<'product'> {
  quantity?: number | null;
}

export interface WarehouseScopeRelationships {
  manager: HubScopeReference<'manager'> | null;
  orders: WarehouseScopeOrder[];
  inventory: WarehouseScopeInventoryItem[];
}

export interface WarehouseScopeSummary {
  inventoryCount: number;
  pendingOrders: number;
  deliveriesScheduled: number;
  lowStockItems: number;
  accountStatus: string | null;
}

interface HubRoleScopeBase<Role extends HubRole, Summary, Relationships> {
  role: Role;
  cksCode: string;
  summary: Summary;
  relationships: Relationships;
}

export interface ManagerRoleScopeResponse
  extends HubRoleScopeBase<'manager', ManagerScopeSummary, ManagerScopeRelationships> {}

export interface ContractorRoleScopeResponse
  extends HubRoleScopeBase<'contractor', ContractorScopeSummary, ContractorScopeRelationships> {}

export interface CustomerRoleScopeResponse
  extends HubRoleScopeBase<'customer', CustomerScopeSummary, CustomerScopeRelationships> {}

export interface CenterRoleScopeResponse
  extends HubRoleScopeBase<'center', CenterScopeSummary, CenterScopeRelationships> {}

export interface CrewRoleScopeResponse
  extends HubRoleScopeBase<'crew', CrewScopeSummary, CrewScopeRelationships> {}

export interface WarehouseRoleScopeResponse
  extends HubRoleScopeBase<'warehouse', WarehouseScopeSummary, WarehouseScopeRelationships> {}

export type HubRoleScopeResponse =
  | ManagerRoleScopeResponse
  | ContractorRoleScopeResponse
  | CustomerRoleScopeResponse
  | CenterRoleScopeResponse
  | CrewRoleScopeResponse
  | WarehouseRoleScopeResponse;

export interface HubActivityItem {
  id: string;
  description: string;
  activityType: string; // Specific type like "crew_assigned_to_center"
  category: string;
  actorId: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface HubActivitiesResponse {
  role: HubRole;
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
    const response = await apiFetch<ApiResponse<T>>(endpoint, {
      getToken,
      timeoutMs: 25000,
    });
    const data = response.data;
    return transform ? transform(data) : data;
  }, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 2,
    errorRetryInterval: 4000,
    shouldRetryOnError: (err: any) => {
      const status = err?.status;
      if (status === 401 || status === 403) return false;
      return true;
    },
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
    mutate: result.mutate,
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
    mutate: result.mutate,
  };
}

export async function fetchHubDashboard(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubDashboardResponse>>(`/hub/dashboard/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

// Combine core hub bootstrapping queries (kept for compatibility, no longer gates UI)
export function useHubBootstrap(cksCode?: string | null) {
  const profile = useHubProfile(cksCode);
  const dashboard = useHubDashboard(cksCode);
  const orders = useHubOrders(cksCode);
  const reports = useHubReports(cksCode);
  const scope = useHubRoleScope(cksCode);

  const hasCode = !!cksCode;

  const isLoading = hasCode && (
    !!profile.isLoading ||
    !!dashboard.isLoading ||
    !!orders.isLoading ||
    !!reports.isLoading ||
    !!scope.isLoading
  );

  const error = profile.error || dashboard.error || orders.error || reports.error || scope.error;

  const revalidate = async () => {
    await Promise.allSettled([
      profile.mutate?.(undefined, true),
      dashboard.mutate?.(undefined, true),
      orders.mutate?.(undefined, true),
      reports.mutate?.(undefined, true),
      scope.mutate?.(undefined, true),
    ]);
  };

  return { isLoading, error, revalidate } as const;
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
    mutate: result.mutate,
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
    mutate: result.mutate,
  };
}

export async function fetchHubReports(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubReportsResponse>>(`/hub/reports/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}

// Reports & Feedback actions
function normalizeReportType(category: string): string {
  const map: Record<string, string> = {
    'Service Quality': 'service_quality',
    'Product Quality': 'product_quality',
    'Crew Performance': 'crew_performance',
    'Delivery Issues': 'delivery_issues',
    'System Bug': 'system_bug',
    'Safety Concern': 'safety',
    Other: 'other',
  };
  return map[category] ?? 'other';
}

function normalizeFeedbackKind(category: string): string {
  const map: Record<string, string> = {
    'Service Excellence': 'service_excellence',
    'Staff Performance': 'staff_performance',
    'Process Improvement': 'process_improvement',
    'Product Suggestion': 'product_suggestion',
    'System Enhancement': 'system_enhancement',
    Recognition: 'recognition',
    Other: 'other',
  };
  return map[category] ?? 'other';
}

export async function createReport(payload: {
  title?: string | null;
  description?: string | null;
  category?: string;
  centerId?: string | null;
  customerId?: string | null;
  severity?: string | null;
  // Structured fields
  reportCategory?: 'service' | 'order' | 'procedure';
  relatedEntityId?: string;
  reportReason?: string;
  reportArea?: string;
  details?: string;
  // Priority
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}) {
  const body: any = {
    ...(payload.title ? { title: payload.title } : {}),
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.category ? { type: normalizeReportType(payload.category) } : {}),
    ...(payload.severity ? { severity: payload.severity } : {}),
    ...(payload.centerId ? { centerId: payload.centerId } : {}),
    ...(payload.customerId ? { customerId: payload.customerId } : {}),
    ...(payload.reportCategory && payload.relatedEntityId && payload.reportReason
      ? { reportCategory: payload.reportCategory, relatedEntityId: payload.relatedEntityId, reportReason: payload.reportReason }
      : {}),
    ...(payload.reportArea ? { reportArea: payload.reportArea } : {}),
    ...(payload.details ? { details: payload.details } : {}),
    ...(payload.priority ? { priority: payload.priority } : {}),
  };
  await apiFetch<ApiResponse<{ id: string }>>('/reports', { method: 'POST', body: JSON.stringify(body) });
}

function buildFeedbackMessage(payload: {
  message?: string;
  reportReason?: string;
  reportArea?: string;
  details?: string;
  ratingBreakdown?: Record<string, number>;
}): string {
  const directMessage = (payload.message || '').trim();
  if (directMessage) return directMessage;

  const parts: string[] = [];
  if (payload.reportArea) {
    parts.push(`Area: ${payload.reportArea}`);
  }
  if (payload.details) {
    parts.push(`Details: ${payload.details}`);
  }
  if (payload.ratingBreakdown) {
    const entries = Object.entries(payload.ratingBreakdown)
      .filter(([, value]) => typeof value === 'number' && value > 0)
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (c) => c.toUpperCase());
        return `${label} ${value}/5`;
      });
    if (entries.length > 0) {
      parts.push(`Ratings: ${entries.join(', ')}`);
    }
  }
  if (parts.length === 0 && payload.reportReason) {
    parts.push(payload.reportReason);
  }
  return parts.join('\n') || 'No details provided';
}

export async function createFeedback(payload: {
  title: string;
  message?: string;
  category: string;
  centerId?: string | null;
  customerId?: string | null;
  // Structured fields
  reportCategory?: 'service' | 'order' | 'procedure';
  relatedEntityId?: string;
  reportReason?: string;
  reportArea?: string;
  details?: string;
  // Rating
  rating?: number;
  ratingBreakdown?: Record<string, number>;
}) {
  const message = buildFeedbackMessage(payload);
  const body: any = {
    title: payload.title,
    message,
    kind: normalizeFeedbackKind(payload.category),
    ...(payload.centerId ? { centerId: payload.centerId } : {}),
    ...(payload.customerId ? { customerId: payload.customerId } : {}),
    ...(payload.reportCategory && payload.relatedEntityId && payload.reportReason
      ? { reportCategory: payload.reportCategory, relatedEntityId: payload.relatedEntityId, reportReason: payload.reportReason }
      : {}),
    ...(payload.rating ? { rating: payload.rating } : {}),
  };
  await apiFetch<ApiResponse<{ id: string }>>('/feedback', { method: 'POST', body: JSON.stringify(body) });
}

export async function acknowledgeItem(id: string, type: 'report' | 'feedback') {
  const path = type === 'report' ? `/reports/${encodeURIComponent(id)}/acknowledge` : `/feedback/${encodeURIComponent(id)}/acknowledge`;
  await apiFetch<ApiResponse<{ id: string }>>(path, { method: 'POST' });
}

export async function resolveReport(id: string, details?: { actionTaken?: string; notes?: string }) {
  await apiFetch<ApiResponse<{ id: string }>>(`/reports/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({
      resolution_notes: details?.notes,
      action_taken: details?.actionTaken
    })
  });
}

// Fetch entities for structured report/feedback dropdowns
export async function fetchServicesForReports() {
  const response = await apiFetch<ApiResponse<any[]>>('/reports/entities/services');
  return response.data || [];
}

export async function fetchOrdersForReports() {
  const response = await apiFetch<ApiResponse<any[]>>('/reports/entities/orders');
  return response.data || [];
}

export async function fetchProceduresForReports() {
  const response = await apiFetch<ApiResponse<any[]>>('/reports/entities/procedures');
  return response.data || [];
}

export function useHubInventory(cksCode?: string | null) {
  const key = sectionPath('inventory', cksCode);
  const result = useHubSWR<HubInventoryResponse>(key);
  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
    mutate: result.mutate,
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
    mutate: result.mutate,
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
    mutate: result.mutate,
  };
}

export async function fetchHubActivities(cksCode: string, init?: ApiFetchInit) {
  const response = await apiFetch<ApiResponse<HubActivitiesResponse>>(`/hub/activities/${encodeURIComponent(cksCode)}`, init);
  return response.data;
}


export type OrderActionType = 'accept' | 'reject' | 'deliver' | 'cancel' | 'create-service';

export interface CreateOrderItemRequest {
  catalogCode: string;
  quantity: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateOrderRequest {
  orderType: 'service' | 'product';
  title?: string | null;
  destination?: {
    code: string | null;
    role: HubRole | null;
  } | null;
  expectedDate?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  participants?: Partial<Record<HubRole, string | readonly string[]>>;
  items: readonly CreateOrderItemRequest[];
}

export async function createHubOrder(payload: CreateOrderRequest) {
  const response = await apiFetch<ApiResponse<HubOrderItem>>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export interface OrderActionRequest {
  action: OrderActionType;
  notes?: string | null;
  transformedId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function applyHubOrderAction(orderId: string, payload: OrderActionRequest) {
  const response = await apiFetch<ApiResponse<HubOrderItem>>(`/orders/${encodeURIComponent(orderId)}/actions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export interface UpdateOrderFieldsRequest {
  expectedDate?: string;
  notes?: string;
}

export async function updateOrderFields(orderId: string, payload: UpdateOrderFieldsRequest) {
  const response = await apiFetch<ApiResponse<HubOrderItem>>(`/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export type ServiceAction = 'start' | 'complete' | 'verify' | 'cancel' | 'update-notes';

export async function applyServiceAction(serviceId: string, action: ServiceAction, notes?: string) {
  const response = await apiFetch<ApiResponse<any>>(`/services/${encodeURIComponent(serviceId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action, ...(notes && notes.trim().length ? { notes } : {}) }),
  });
  return response.data;
}

// Request crew for an existing service (manager only)
export async function requestServiceCrew(serviceId: string, crewCodes: string[], message?: string) {
  const response = await apiFetch<ApiResponse<any>>(`/services/${encodeURIComponent(serviceId)}/crew-requests`, {
    method: 'POST',
    body: JSON.stringify({ crewCodes, ...(message && message.trim().length ? { message } : {}) }),
  });
  return response.data;
}

// Crew respond to a service invite (crew only)
export async function respondToServiceCrew(serviceId: string, accept: boolean) {
  const response = await apiFetch<ApiResponse<any>>(`/services/${encodeURIComponent(serviceId)}/crew-response`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
  return response.data;
}

// Update service metadata (procedures/training/notes)
export async function updateServiceMetadataAPI(
  serviceId: string,
  payload: { procedures?: any[]; training?: any[]; tasks?: any[]; notes?: string; crew?: string[] }
) {
  const response = await apiFetch<ApiResponse<any>>(`/services/${encodeURIComponent(serviceId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
  return response.data;
}
export interface CertifiedServiceItem {
  serviceId: string;
  name: string;
  category: string | null;
  status: string | null;
  updatedAt: string | null;
}

// Pre-creation (order-level) crew requests/response
export async function requestOrderCrew(orderId: string, crewCodes: string[], message?: string) {
  const response = await apiFetch<ApiResponse<any>>(`/orders/${encodeURIComponent(orderId)}/crew-requests`, {
    method: 'POST',
    body: JSON.stringify({ crewCodes, ...(message && message.trim().length ? { message } : {}) }),
  });
  return response.data;
}

export async function respondToOrderCrew(orderId: string, accept: boolean) {
  const response = await apiFetch<ApiResponse<any>>(`/orders/${encodeURIComponent(orderId)}/crew-response`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
  return response.data;
}

export async function respondToCrewInvite(orderId: string, serviceId: string | null | undefined, accept: boolean) {
  if (serviceId) {
    return respondToServiceCrew(serviceId, accept);
  }
  return respondToOrderCrew(orderId, accept);
}

export function useCertifiedServices(userId: string | null | undefined, role: 'manager' | 'crew' | 'warehouse') {
  const key = userId ? `/certified-services?userId=${encodeURIComponent(userId)}&role=${role}` : null;
  return useHubSWR<CertifiedServiceItem[]>(key);
}
