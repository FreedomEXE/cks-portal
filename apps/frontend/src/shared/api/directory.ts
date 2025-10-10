import type { Activity } from '@cks/domain-widgets';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { apiFetch, type ApiFetchInit, type ApiResponse } from './client';

export interface Manager {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  territory: string | null;
  role: string | null;
  reportsTo: string | null;
  address: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface Contractor {
  id: string;
  managerId: string | null;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface Customer {
  id: string;
  managerId: string | null;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  totalCenters: number | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface Center {
  id: string;
  name: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  customerId: string | null;
  contractorId: string | null;
  managerId: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CrewMember {
  id: string;
  name: string | null;
  emergencyContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  assignedCenter: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Warehouse {
  id: string;
  name: string | null;
  managerId: string | null;
  managerName: string | null;
  mainContact: string | null;
  warehouseType: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  capacity: number | null;
  utilization: number | null;
  status: string | null;
  dateAcquired: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface Service {
  id: string;
  name: string | null;
  category: string | null;
  description: string | null;
  pricingModel: string | null;
  requirements: string | null;
  managedBy: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Order {
  id: string;
  customerId: string | null;
  centerId: string | null;
  serviceId: string | null;
  orderDate: string | null;
  completionDate: string | null;
  totalAmount: string | null;
  status: string | null;
  notes: string | null;
  assignedWarehouse: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Extra fields surfaced by backend for display
  createdBy?: string | null;
  createdByRole?: string | null;
  destination?: string | null;
  destinationRole?: string | null;
  orderType?: string | null;
  items?: Array<{
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    itemType: string;
    quantity: number;
    unitOfMeasure: string | null;
    unitPrice: string | null;
    currency: string | null;
    totalPrice: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  metadata?: Record<string, unknown> | null;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string | null;
  unit: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  rawId?: string | null;
  source?: 'products' | 'catalog';
}

export interface TrainingRecord {
  id: string;
  crewId: string | null;
  crewName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  date: string | null;
  expense: string | null;
  days: number | null;
  status: string | null;
}

export interface Procedure {
  id: string;
  serviceId: string | null;
  type: string | null;
  contractorId: string | null;
  customerId: string | null;
  centerId: string | null;
}

export interface Report {
  id: string;
  type: string;
  severity: string | null;
  title: string;
  description: string | null;
  centerId: string | null;
  customerId: string | null;
  status: string;
  createdByRole: string;
  createdById: string;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface FeedbackEntry {
  id: string;
  kind: string;
  title: string;
  message: string | null;
  centerId: string | null;
  customerId: string | null;
  createdByRole: string;
  createdById: string;
  createdAt: string | null;
  archivedAt: string | null;
}

interface ActivityApiItem {
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

type DirectoryResourceConfig<TResponse, TMapped> = {
  path: string;
  transform?: (items: TResponse[]) => TMapped[];
};

type DirectoryHookResult<T> = {
  data: T[];
  isLoading: boolean;
  error: Error | undefined;
};

function createDirectoryResource<TResponse, TMapped = TResponse>(
  config: DirectoryResourceConfig<TResponse, TMapped>,
) {
  function useResource(): DirectoryHookResult<TMapped> {
    const { getToken } = useClerkAuth();
    const fetcher = useCallback(
      (endpoint: string) =>
        apiFetch<ApiResponse<TResponse[]>>(endpoint, { getToken }).then((res) => {
          const payload = res.data ?? [];
          return config.transform ? config.transform(payload) : (payload as unknown as TMapped[]);
        }),
      [getToken],
    );

    const { data, error, isLoading } = useSWR<TMapped[], Error>(config.path, fetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateIfStale: false,
      dedupingInterval: 10000,
    });
    const fallbackData = useMemo<TMapped[]>(() => [], []);
    const safeData = data ?? fallbackData;

    return {
      data: safeData,
      isLoading,
      error,
    };
  }

  async function fetchResource(init?: ApiFetchInit): Promise<TMapped[]> {
    const response = await apiFetch<ApiResponse<TResponse[]>>(config.path, init);
    const payload = response.data ?? [];
    return config.transform ? config.transform(payload) : (payload as unknown as TMapped[]);
  }

  return {
    useResource,
    fetchResource,
  };
}

function mapActivities(items: ActivityApiItem[]): Activity[] {
  return items.map((item) => {
    const timestamp = item.createdAt ? new Date(item.createdAt) : new Date();
    const metadata: Record<string, unknown> = {};
    if (item.metadata) {
      Object.assign(metadata, item.metadata);
    }
    if (item.actorRole) {
      metadata.role = item.actorRole;
    }
    if (item.actorId) {
      metadata.actorId = item.actorId;
    }
    if (item.targetId) {
      metadata.targetId = item.targetId;
    }
    if (item.targetType) {
      metadata.targetType = item.targetType;
    }
    metadata.category = item.category;

    const category = item.category === 'action' || item.category === 'warning' || item.category === 'success'
      ? item.category
      : item.category === 'danger'
        ? 'warning'
        : 'info';

    return {
      id: item.id,
      message: item.description,
      timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
      type: category as Activity['type'],
      metadata,
    };
  });
}

const managersResource = createDirectoryResource<Manager, Manager>({ path: '/admin/directory/managers' });
const contractorsResource = createDirectoryResource<Contractor, Contractor>({ path: '/admin/directory/contractors' });
const customersResource = createDirectoryResource<Customer, Customer>({ path: '/admin/directory/customers' });
const centersResource = createDirectoryResource<Center, Center>({ path: '/admin/directory/centers' });
const crewResource = createDirectoryResource<CrewMember, CrewMember>({ path: '/admin/directory/crew' });
const warehousesResource = createDirectoryResource<Warehouse, Warehouse>({ path: '/admin/directory/warehouses' });
const servicesResource = createDirectoryResource<Service, Service>({ path: '/admin/directory/services' });
const ordersResource = createDirectoryResource<Order, Order>({ path: '/admin/directory/orders' });
const productsResource = createDirectoryResource<Product, Product>({ path: '/admin/directory/products' });
const trainingResource = createDirectoryResource<TrainingRecord, TrainingRecord>({ path: '/admin/directory/training' });
const proceduresResource = createDirectoryResource<Procedure, Procedure>({ path: '/admin/directory/procedures' });
const reportsResource = createDirectoryResource<Report, Report>({ path: '/admin/directory/reports' });
const feedbackResource = createDirectoryResource<FeedbackEntry, FeedbackEntry>({ path: '/admin/directory/feedback' });
const activitiesResource = createDirectoryResource<ActivityApiItem, Activity>({
  path: '/admin/directory/activities',
  transform: mapActivities,
});

export const useManagers = managersResource.useResource;
export const fetchManagers = managersResource.fetchResource;
export const useContractors = contractorsResource.useResource;
export const fetchContractors = contractorsResource.fetchResource;
export const useCustomers = customersResource.useResource;
export const fetchCustomers = customersResource.fetchResource;
export const useCenters = centersResource.useResource;
export const fetchCenters = centersResource.fetchResource;
export const useCrew = crewResource.useResource;
export const fetchCrew = crewResource.fetchResource;
export const useWarehouses = warehousesResource.useResource;
export const fetchWarehouses = warehousesResource.fetchResource;
export const useServices = servicesResource.useResource;
export const fetchServices = servicesResource.fetchResource;
export const useOrders = ordersResource.useResource;
export const fetchOrders = ordersResource.fetchResource;
export const useProducts = productsResource.useResource;
export const fetchProducts = productsResource.fetchResource;
export const useTraining = trainingResource.useResource;
export const fetchTraining = trainingResource.fetchResource;
export const useProcedures = proceduresResource.useResource;
export const fetchProcedures = proceduresResource.fetchResource;
export const useReports = reportsResource.useResource;
export const fetchReports = reportsResource.fetchResource;
export const useFeedback = feedbackResource.useResource;
export const fetchFeedback = feedbackResource.fetchResource;
export const useActivities = activitiesResource.useResource;
export const fetchActivities = activitiesResource.fetchResource;

