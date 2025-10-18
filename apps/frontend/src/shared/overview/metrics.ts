import type { HubOrderItem } from '../api/hub';

export function countPendingOrdersFromOrders(orders: readonly HubOrderItem[] | null | undefined): number {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  return orders.filter((o) => (o.viewerStatus ?? '').trim().toLowerCase() === 'pending').length;
}

export function capitalizeLabel(value: string | null | undefined, fallback: string = 'Active'): string {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function safeLength(arr: unknown[] | null | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

