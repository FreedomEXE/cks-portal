import { apiFetch, type ApiResponse } from './client';
import type { HubOrderItem } from './hub';

// Fetch a complete, role-scoped order details payload
export async function fetchOrderDetails(orderId: string) {
  const res = await apiFetch<ApiResponse<HubOrderItem>>(`/order/${encodeURIComponent(orderId)}/details?includeDeleted=1`);
  return res.data;
}

