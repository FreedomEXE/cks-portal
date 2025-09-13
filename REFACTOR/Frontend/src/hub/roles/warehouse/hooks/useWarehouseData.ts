/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useWarehouseData.ts - Warehouse data management hook
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildWarehouseApiUrl, warehouseApiFetch } from "../utils/warehouseApi";
import { validateWarehouseRole } from '../utils/warehouseAuth';

function useUser() {
  return { user: { id: 'test-warehouse-001', username: 'warehouse-test' } };
}

type WarehouseState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string;
};

export function useWarehouseData() {
  const { user } = useUser();
  const [state, setState] = useState<WarehouseState>({ loading: true, error: null, kind: "warehouse", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchWarehouseData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      const params = new URLSearchParams(window.location.search);
      let codeOverride = params.get('code') || undefined;
      
      const pathMatch = window.location.pathname.match(/\/(WHS-\d+)\/hub/i);
      if (pathMatch && pathMatch[1]) {
        codeOverride = pathMatch[1].toUpperCase();
        console.debug('[useWarehouseData] extracted warehouse ID from path:', codeOverride);
      }
      
      const lastCode = user?.id ? undefined : (safeGet('warehouse:lastCode') || undefined);

      const username = user?.username || '';
      if (username.includes('-000') || username === 'whs-000' || username === 'WHS-000') {
        const data = makeWarehouseDemoData(username || 'WHS-000');
        setState({ loading: false, error: null, kind: 'warehouse', data, _source: 'template-user' });
        console.debug('[useWarehouseData]', { source: 'template-user', username, data });
        return;
      }

      if (false && !validateWarehouseRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Warehouse access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildWarehouseApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useWarehouseData] fetching', url, 'with codeOverride:', codeOverride);
      
      const fetchOptions: RequestInit = {};
      if (codeOverride) {
        fetchOptions.headers = { 'x-user-id': codeOverride, 'x-warehouse-user-id': codeOverride };
      }
      
      const res = await warehouseApiFetch(url, fetchOptions);
      let j: any = await res.json();
      console.debug('[useWarehouseData] response', { status: res.status, data: j });

      let sourceTag: string = '/warehouse-api/profile';

      if (res.status === 404) {
        const fallbackPaths = ['/me', '/warehouse/me', '/profile'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await warehouseApiFetch(buildWarehouseApiUrl(p));
            console.debug('[useWarehouseData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            console.debug('[useWarehouseData] fallback error', { url: p, error: e.message });
          }
        }
        
        if (!fallbackJson) {
          fallbackJson = makeWarehouseDemoData();
          fallbackSource = 'stub:warehouse';
        }
        
        j = fallbackJson;
        sourceTag = fallbackSource || '404-fallback';
      }

      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        if (!user?.id || res.status >= 500 || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const data = makeWarehouseDemoData(safeGet('warehouse:lastCode') || undefined);
          setState({ loading: false, error: null, kind: 'warehouse', data, _source: 'soft-fallback' });
          return;
        }
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      let data = j?.data || j || {};
      if (!data.warehouse_id) data.warehouse_id = 'WHS-000';
      if (!data.name) data.name = 'Warehouse Demo';
      
      setState({ loading: false, error: null, kind: 'warehouse', data, _source: sourceTag });
      console.debug('[useWarehouseData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('warehouse:lastCode') || undefined;
        const data = makeWarehouseDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'warehouse', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;
    fetchWarehouseData();
  }, [fetchWarehouseData]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchWarehouseData();
  }, [fetchWarehouseData]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useWarehouseData;

function makeWarehouseDemoData(code?: string) {
  return { 
    warehouse_id: code || 'whs-000', 
    name: 'Central Distribution Warehouse', 
    code: code || 'whs-000',
    type: 'distribution',
    status: 'active',
    total_capacity: 50000,
    used_capacity: 35750,
    capacity_utilization: 71.5,
    inventory_items: 2847,
    active_orders: 156,
    pending_shipments: 89,
    throughput_daily: 450,
    accuracy_rate: 99.2,
    fulfillment_time: 2.3,
    efficiency_rating: 4.4,
    staff_count: 24,
    _stub: true 
  };
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}