/**
 * useCatalogServiceDetails - Catalog Service Details Hook
 *
 * Fetches catalog service definitions (SRV-XXX) using session-based auth.
 * Catalog services are service definitions (not active service instances).
 */

import useSWR from 'swr';
import { apiFetch, type ApiResponse } from '../shared/api/client';

export interface NormalizedCatalogService {
  serviceId: string;
  name: string;
  category?: string;
  description?: string;
  tags?: string[];
  status: string;
  metadata?: any;
  imageUrl?: string;
  price?: {
    amount: string;
    currency: string;
    unitOfMeasure?: string;
  } | null;
  durationMinutes?: number;
  serviceWindow?: string;
  attributes?: any;
  crewRequired?: number;
  managedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Admin-only
  certifications?: {
    managers: string[];
    contractors: string[];
    crew: string[];
    warehouses: string[];
  };
}

export interface UseCatalogServiceDetailsReturn {
  service: NormalizedCatalogService | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseCatalogServiceDetailsParams {
  serviceId: string | null;
}

/**
 * Normalize backend catalog service into UI-friendly shape
 */
function normalizeCatalogService(data: any): NormalizedCatalogService {
  return {
    serviceId: data.serviceId,
    name: data.name || '',
    category: data.category,
    description: data.description,
    tags: data.tags || [],
    status: data.status || 'active',
    metadata: data.metadata,
    imageUrl: data.imageUrl,
    price: data.price,
    durationMinutes: data.durationMinutes,
    serviceWindow: data.serviceWindow,
    attributes: data.attributes,
    crewRequired: data.crewRequired,
    managedBy: data.managedBy || 'manager',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    certifications: data.certifications, // Admin-only field
  };
}

/**
 * Hook to get catalog service details
 */
export function useCatalogServiceDetails(
  params: UseCatalogServiceDetailsParams
): UseCatalogServiceDetailsReturn {
  const { serviceId } = params;

  // Construct SWR key
  const shouldFetch = !!serviceId;
  const swrKey = shouldFetch ? `/catalog/services/${serviceId}/details` : null;

  console.log('[useCatalogServiceDetails] Called with:', { serviceId, shouldFetch, swrKey });

  // Fetch from backend
  const { data, error, isLoading } = useSWR<ApiResponse<any>>(
    swrKey,
    (url) => apiFetch<ApiResponse<any>>(url),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  console.log('[useCatalogServiceDetails] SWR state:', {
    serviceId,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    error: error?.message || null,
    isLoading,
  });

  // Normalize
  const service = data?.data ? normalizeCatalogService(data.data) : null;

  console.log('[useCatalogServiceDetails] Final result:', {
    serviceId,
    hasService: !!service,
    serviceName: service?.name || null,
  });

  return {
    service,
    isLoading,
    error: error || null,
  };
}
