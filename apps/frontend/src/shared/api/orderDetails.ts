import { apiFetch, type ApiResponse } from './client';
import type { HubOrderItem } from './hub';

// Fetch a complete, role-scoped order details payload
export async function fetchOrderDetails(orderId: string) {
  // For non-admin users, the backend blocks includeDeleted=1 with 403.
  // We rely on apiFetch's tombstone fallback (404 -> /deleted/:type/:id/snapshot)
  // so do NOT send includeDeleted here. Admin-only flows can fetch snapshots via
  // the fallback or dedicated admin endpoints.
  const res = await apiFetch<ApiResponse<HubOrderItem>>(`/order/${encodeURIComponent(orderId)}/details`);
  return res.data;
}
