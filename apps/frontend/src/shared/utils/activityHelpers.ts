/**
 * Activity Helpers - Modal-Based UX
 *
 * Simple utilities for fetching entities from activity clicks.
 * NO navigation logic - just fetch and return data for modals.
 *
 * Philosophy: User stays in Recent Activity section, modals open in place.
 */

import { fetchJson } from './fetch';
import { fetchOrderDetails } from '../api/orderDetails';

export interface EntityFetchResult {
  entity: any;
  state: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
  deletedBy?: string;
}

/**
 * Fetch order entity for activity click
 *
 * @param orderId - The order ID to fetch
 * @returns Full order data with state information
 * @throws Error if fetch fails or user lacks permission
 */
export async function fetchOrderForActivity(orderId: string): Promise<EntityFetchResult> {
  try {
    const order = await fetchOrderDetails(orderId);
    const state: 'active' | 'archived' | 'deleted' = order?.archivedAt ? 'archived' : 'active';
    return {
      entity: order,
      state,
      deletedAt: order?.deletedAt ?? undefined,
      deletedBy: order?.deletedBy ?? undefined,
    };
  } catch (err: any) {
    // If canonical endpoint 404s, fall back to legacy entity endpoint to detect deleted orders
    const msg = (err && (err.message || err.toString())) || '';
    const isNotFound = /404|Not Found/i.test(msg);
    if (!isNotFound) {
      throw err;
    }
    const response = await fetchJson<EntityFetchResult>(
      `/entity/order/${encodeURIComponent(orderId)}?includeDeleted=1`
    );
    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to fetch order');
    }
    return response.data;
  }
}

/**
 * Fetch service entity for activity click
 *
 * @param serviceId - The service ID to fetch
 * @returns Full service data with state information
 * @throws Error if fetch fails or user lacks permission
 */
export async function fetchServiceForActivity(serviceId: string): Promise<EntityFetchResult> {
  const response = await fetchJson<EntityFetchResult>(
    `/entity/service/${encodeURIComponent(serviceId)}?includeDeleted=1`
  );

  if (!response.ok) {
    throw new Error(response.error?.message || 'Failed to fetch service');
  }

  return response.data;
}

/**
 * Fetch any entity for activity click (generic)
 *
 * @param entityType - Type of entity (order, service, manager, etc.)
 * @param entityId - The entity ID to fetch
 * @returns Full entity data with state information
 * @throws Error if fetch fails or user lacks permission
 */
export async function fetchEntityForActivity(
  entityType: string,
  entityId: string
): Promise<EntityFetchResult> {
  const response = await fetchJson<EntityFetchResult>(
    `/entity/${entityType}/${encodeURIComponent(entityId)}?includeDeleted=1`
  );

  if (!response.ok) {
    throw new Error(response.error?.message || 'Failed to fetch entity');
  }

  return response.data;
}

/**
 * Parse error message to user-friendly format
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
export function parseActivityError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Failed to load entity';

  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You do not have permission to view this entity';
  }

  if (message.includes('404') || message.includes('Not Found')) {
    return 'Entity not found';
  }

  return message;
}
