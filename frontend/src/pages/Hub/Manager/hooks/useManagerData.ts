/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useManagerData.ts
 * 
 * Description: Hook for fetching and managing manager-specific profile data
 * Function: Fetches manager profile from Manager API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Manager hub
 * Connects to: Manager API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Manager-specific version of useMeProfile with dedicated API endpoints.
 *        Handles manager authentication and data validation.
 *        Provides stub data when Manager API is unavailable.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildManagerApiUrl, managerApiFetch } from "../utils/managerApi";
import { useUser } from '@clerk/clerk-react';
import { validateManagerRole } from '../utils/managerAuth';

type ManagerState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useManagerData() {
  const { user } = useUser();
  const [state, setState] = useState<ManagerState>({ loading: true, error: null, kind: "manager", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchManagerData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      // Check for URL param overrides (dev/testing)
      const params = new URLSearchParams(window.location.search);
      let codeOverride = params.get('code') || undefined;
      
      // Extract manager ID from URL path (e.g., /MGR-001/hub)
      const pathMatch = window.location.pathname.match(/\/(MGR-\d+)\/hub/i);
      if (pathMatch && pathMatch[1]) {
        codeOverride = pathMatch[1].toUpperCase();
        console.debug('[useManagerData] extracted manager ID from path:', codeOverride);
      }
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastCode = user?.id ? undefined : (safeGet('manager:lastCode') || undefined);

      // Skip demo data fallback - proceed to API call with codeOverride

      // Template users: use demo data directly (skip validation)
      const username = user?.username || '';
      if (username.includes('-000') || username === 'mgr-000' || username === 'MGR-000') {
        const data = makeManagerDemoData(username || 'MGR-000');
        setState({ loading: false, error: null, kind: 'manager', data, _source: 'template-user' });
        console.debug('[useManagerData]', { source: 'template-user', username, data });
        return;
      }

      // Validate manager role first (temporarily disabled for development)
      // TODO: Re-enable authentication in production
      if (false && !validateManagerRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Manager access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildManagerApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useManagerData] fetching', url, 'with codeOverride:', codeOverride);
      
      // Create custom fetch options with the correct manager ID header
      const fetchOptions: RequestInit = {};
      if (codeOverride) {
        fetchOptions.headers = {
          'x-user-id': codeOverride,
          'x-manager-user-id': codeOverride
        };
      }
      
      const res = await managerApiFetch(url, fetchOptions);
      let j: any = await res.json();
      console.debug('[useManagerData] response', { status: res.status, data: j });

      let sourceTag: string = '/manager-api/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const fallbackPaths = ['/me', '/manager/me', '/profile'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await managerApiFetch(buildManagerApiUrl(p));
            console.debug('[useManagerData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            console.debug('[useManagerData] fallback error', { url: p, error: e.message });
          }
        }
        
        // Provide stub for manager if all fallbacks fail
        if (!fallbackJson) {
          fallbackJson = makeManagerDemoData();
          fallbackSource = 'stub:manager';
        }
        
        j = fallbackJson;
        sourceTag = fallbackSource || '404-fallback';
      }

      // Handle other errors
      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        // For network or server errors (5xx) in dev, use fallback data
        if (!user?.id || res.status >= 500 || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const data = makeManagerDemoData(safeGet('manager:lastCode') || undefined);
          setState({ loading: false, error: null, kind: 'manager', data, _source: 'soft-fallback' });
          return;
        }
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      // Normalize response data
      let data = j?.data || j || {};
      
      // Ensure manager has required fields
      if (!data.manager_id) data.manager_id = 'MGR-000';
      if (!data.name) data.name = 'Manager Demo';
      
      setState({ loading: false, error: null, kind: 'manager', data, _source: sourceTag });
      console.debug('[useManagerData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('manager:lastCode') || undefined;
        const data = makeManagerDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'manager', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return; // Prevent double fetch in StrictMode
    didInitialFetchRef.current = true;
    fetchManagerData();
  }, [fetchManagerData]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchManagerData();
  }, [fetchManagerData]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useManagerData;

// Helper functions
function makeManagerDemoData(code?: string) {
  return { 
    manager_id: code || 'mgr-000', 
    name: 'Manager Demo', 
    code: code || 'mgr-000',
    territory: 'Demo Territory',
    reports_to: 'Senior Manager',
    email: 'manager@demo.com',
    phone: '(555) 123-4567',
    start_date: '2024-01-01',
    role: 'Territory Manager',
    _stub: true 
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
