/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * warehouseApi.ts
 * 
 * Description: Warehouse hub API utilities
 * Function: API communication helpers for warehouse operations
 * Importance: Critical - Handles all warehouse API interactions
 * Connects to: Warehouse backend routes, warehouse components
 * 
 * Notes: Provides unified API interface for warehouse hub.
 *        Handles authentication headers and error responses.
 *        Supports inventory, shipments, staff, and activity endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export interface WarehouseApiOptions {
  code?: string;
  warehouse_id?: string;
  limit?: number;
  category?: string;
  status?: string;
  type?: string;
  low_stock?: boolean;
}

export function buildWarehouseApiUrl(endpoint: string, options: WarehouseApiOptions = {}): string {
  const url = new URL(`${API_BASE}/warehouse${endpoint}`, window.location.origin);
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

function resolveWarehouseId(): string {
  try {
    const qs = new URLSearchParams(window.location.search);
    const codeParam = qs.get('code');
    if (codeParam) return codeParam.toUpperCase();
    // Try to parse "/{username}/hub" path segment
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const seg = path.split('/')[0];
    if (seg && /^wh-\d{3}$/i.test(seg)) return seg.toUpperCase();
    // Try session overrides
    const ssDev = (sessionStorage.getItem('me:lastCode') || '').toUpperCase();
    if (ssDev.startsWith('WH-')) return ssDev;
    const ss = (sessionStorage.getItem('code') || '').toUpperCase();
    if (ss.startsWith('WH-')) return ss;
  } catch {}
  return 'WH-000';
}

export async function warehouseApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  try {
    const isImp = sessionStorage.getItem('impersonate') === 'true';
    const role = sessionStorage.getItem('me:lastRole');
    if (isImp && role) headers.set('x-user-role', role);
  } catch {}
  
  // Set warehouse-specific headers for authentication
  const warehouseId = resolveWarehouseId();
  headers.set('x-warehouse-user-id', warehouseId);
  headers.set('x-user-id', warehouseId);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}

// Specific API helper functions
export class WarehouseApi {
  static async getProfile(warehouseId?: string) {
    const url = buildWarehouseApiUrl('/profile', { warehouse_id: warehouseId });
    return warehouseApiFetch(url);
  }
  
  static async getDashboard() {
    const url = buildWarehouseApiUrl('/dashboard');
    return warehouseApiFetch(url);
  }
  
  static async getInventory(options: { category?: string; low_stock?: boolean; limit?: number } = {}) {
    const url = buildWarehouseApiUrl('/inventory', options);
    return warehouseApiFetch(url);
  }
  
  static async getShipments(options: { type?: string; status?: string; limit?: number } = {}) {
    const url = buildWarehouseApiUrl('/shipments', options);
    return warehouseApiFetch(url);
  }
  
  static async deliverShipment(id: string) {
    const url = buildWarehouseApiUrl(`/shipments/${encodeURIComponent(id)}/deliver`);
    return warehouseApiFetch(url, { method: 'PATCH' });
  }
  static async cancelShipment(id: string) {
    const url = buildWarehouseApiUrl(`/shipments/${encodeURIComponent(id)}/cancel`);
    return warehouseApiFetch(url, { method: 'PATCH' });
  }
  
  static async getStaff(options: { status?: string; limit?: number } = {}) {
    const url = buildWarehouseApiUrl('/staff', options);
    return warehouseApiFetch(url);
  }
  
  static async getActivity(options: { type?: string; limit?: number } = {}) {
    const url = buildWarehouseApiUrl('/activity', options);
    return warehouseApiFetch(url);
  }
  
  static async getOrders(options: { status?: string; limit?: number } = {}) {
    const url = buildWarehouseApiUrl('/orders', options);
    return warehouseApiFetch(url);
  }
  
  static async assignOrder(orderId: string) {
    const url = buildWarehouseApiUrl(`/orders/${encodeURIComponent(orderId)}/assign`);
    return warehouseApiFetch(url, { method: 'POST' });
  }

  static async createShipment(params: { order_id: string; carrier?: string; tracking_number?: string; destination_address?: string }) {
    const url = buildWarehouseApiUrl('/shipments');
    return warehouseApiFetch(url, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  static async adjustInventory(item_id: string, quantity_change: number, reason: string) {
    const url = buildWarehouseApiUrl('/inventory/adjust');
    return warehouseApiFetch(url, {
      method: 'POST',
      body: JSON.stringify({ item_id, quantity_change, reason })
    });
  }
}
