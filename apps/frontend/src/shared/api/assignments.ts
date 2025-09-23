import useSWR from 'swr';
import { apiFetch, type ApiResponse } from './client';

export type AssignmentResource = 'contractors' | 'customers' | 'centers' | 'crew';

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

type UnassignedMap = {
  contractors: UnassignedContractor;
  customers: UnassignedCustomer;
  centers: UnassignedCenter;
  crew: UnassignedCrewMember;
};

type AssignmentPayloadMap = {
  contractors: { managerId: string };
  customers: { contractorId: string };
  centers: { customerId: string };
  crew: { centerId: string };
};

type AssignmentEndpointMap = {
  contractors: (id: string) => string;
  customers: (id: string) => string;
  centers: (id: string) => string;
  crew: (id: string) => string;
};

const ASSIGNMENT_ENDPOINTS: AssignmentEndpointMap = {
  contractors: (id) => `/admin/assignments/contractors/${encodeURIComponent(id)}/manager`,
  customers: (id) => `/admin/assignments/customers/${encodeURIComponent(id)}/contractor`,
  centers: (id) => `/admin/assignments/centers/${encodeURIComponent(id)}/customer`,
  crew: (id) => `/admin/assignments/crew/${encodeURIComponent(id)}/center`,
};

function buildUnassignedPath(resource: AssignmentResource) {
  return `/admin/assignments/${resource}/unassigned`;
}

export function useUnassigned<Resource extends AssignmentResource>(resource: Resource) {
  const path = buildUnassignedPath(resource);
  const fetcher = (endpoint: string) =>
    apiFetch<ApiResponse<UnassignedMap[Resource][]>>(endpoint).then((res) => res.data ?? []);
  const { data, error, isLoading, mutate } = useSWR<UnassignedMap[Resource][], Error>(path, fetcher);
  return {
    data: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export async function assignResource<Resource extends AssignmentResource>(
  resource: Resource,
  id: string,
  payload: AssignmentPayloadMap[Resource],
): Promise<AssignmentResult> {
  const endpoint = ASSIGNMENT_ENDPOINTS[resource](id);
  const response = await apiFetch<ApiResponse<AssignmentResult>>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}
