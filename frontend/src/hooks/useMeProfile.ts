/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useMeProfile.tsx
 * 
 * Description: Hook for fetching and managing user profile data based on role
 * Function: Fetches profile from API with fallbacks for different user types
 * Importance: Critical - Primary data source for all profile views
 * Connects to: API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Handles multiple fallback scenarios for offline/dev modes.
 *        Supports role/code overrides via URL params for testing.
 *        Provides stub data when API is unavailable.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildUrl, apiFetch } from "../lib/apiBase";
import { useUser } from '@clerk/clerk-react';
import getRole from '../lib/getRole';

type MeState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useMeProfile() {
  const { user } = useUser();
  const [state, setState] = useState<MeState>({ loading: true, error: null, kind: "", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchMe = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      // Check for URL param overrides (dev/testing)
      const params = new URLSearchParams(window.location.search);
      const roleOverride = (params.get('role') || params.get('kind') || '').toLowerCase() || undefined;
      const codeOverride = params.get('code') || undefined;
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastRole = user?.id ? undefined : (safeGet('me:lastRole') || undefined);
      const lastCode = user?.id ? undefined : (safeGet('me:lastCode') || undefined);

      // If explicit overrides exist, use demo data
      if (roleOverride || codeOverride) {
        const inferred = roleOverride || inferKindFromCode(codeOverride) || 
                        (lastRole && lastRole !== 'admin' ? lastRole : undefined) || 'admin';
        const data = makeDemoData(inferred, codeOverride || lastCode);
        setState({ loading: false, error: null, kind: inferred, data, _source: 'override' });
        console.debug('[useMeProfile]', { source: 'override', kind: inferred, data });
        return;
      }

  // Use relative path; `buildUrl` will prefix the API base (typically `/api`) so
  // do not include `/api` here to avoid `/api/api/...` double-prefixing.
  const url = buildUrl("/me/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useMeProfile] fetching', url);
      
      const res = await apiFetch(url);
      let j: any = await res.json();
      console.debug('[useMeProfile] response', { status: res.status, data: j });

      let sourceTag: string = '/api/me/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const userRole = getRole(user);
  // Fallback paths should also be relative to API base so omit the leading `/api`.
  const fallbackPaths = ['/me/manager', '/manager/profile', '/manager/me'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await apiFetch(buildUrl(p));
            console.debug('[useMeProfile] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            console.debug('[useMeProfile] fallback error', { url: p, error: e.message });
          }
        }
        
        // Provide stub for manager if all fallbacks fail
        if (!fallbackJson && userRole === 'manager') {
          fallbackJson = { 
            role: 'manager', 
            kind: 'manager', 
            manager_id: 'demo-mgr-000', 
            name: 'Manager Demo (stub)', 
            _stub: true 
          };
          fallbackSource = 'stub:manager';
        }
        
        if (fallbackJson) {
          j = fallbackJson;
          sourceTag = fallbackSource || '404-fallback';
        } else {
          sourceTag = '404-no-data';
        }
      }

      // Handle other errors
      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        
        // For network errors in dev, use fallback data
        if (!user?.id || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const inferred = inferKindFromCode(undefined) || 
                          (safeGet('me:lastRole') !== 'admin' ? safeGet('me:lastRole') : null) || 
                          'admin';
          const data = makeDemoData(inferred, safeGet('me:lastCode') || undefined);
          setState({ loading: false, error: null, kind: inferred, data, _source: 'soft-fallback' });
          return;
        }
        
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      // Normalize response data
      let kind = j?.kind || j?.data?.kind || j?.role || '';
      const userRole = getRole(user);
      if (!kind && userRole === 'manager') kind = 'manager';
      
      let data = j?.data || j || {};
      
      // Ensure manager has required fields
      if (userRole === 'manager' && kind === 'manager') {
        if (!data.manager_id) data.manager_id = 'demo-mgr-000';
        if (!data.name) data.name = 'Manager Demo';
      }
      
      setState({ loading: false, error: null, kind, data, _source: sourceTag });
      console.debug('[useMeProfile] success', { kind, source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const roleOverride = (params.get('role') || params.get('kind') || '').toLowerCase() || undefined;
        const codeOverride = params.get('code') || undefined;
        
        let inferred: string | undefined = roleOverride;
        if (!inferred && codeOverride && /^\d{3}-[A-Z]$/i.test(codeOverride)) inferred = 'center';
        
        const lastRole = safeGet('me:lastRole') || undefined;
        const lastCode = safeGet('me:lastCode') || undefined;
        const kind = inferred || (lastRole !== 'admin' ? lastRole : undefined) || 'admin';
        const data = makeDemoData(kind, codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind, data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return; // Prevent double fetch in StrictMode
    didInitialFetchRef.current = true;
    fetchMe();
  }, [fetchMe]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchMe();
  }, [fetchMe]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useMeProfile;

// Helper functions
function makeDemoData(kind: string, code?: string) {
  const k = (kind || '').toLowerCase();
  const c = code || '';
  
  switch(k) {
    case 'center':
      return { center_id: c || '001-D', name: 'Center Demo', code: c || '001-D' };
    case 'crew':
      return { crew_id: c || 'CR-001', name: 'Crew Demo', code: c || 'CR-001' };
    case 'contractor':
      return { contractor_id: c || 'con-000', company_name: 'Contractor Demo', code: c || 'con-000' };
    case 'customer':
      return { customer_id: c || 'CU-001', company_name: 'Customer Demo', code: c || 'CU-001' };
    case 'manager':
      return { manager_id: c || 'M-001', name: 'Manager Demo', code: c || 'M-001' };
    default:
      return { code: c || '000-A' };
  }
}

function inferKindFromCode(code?: string) {
  if (!code) return undefined;
  const c = code.toUpperCase();
  
  if (/^\d{3}-[A-Z]$/.test(c)) return 'center';
  if (c.startsWith('CR-')) return 'crew';
  if (c.startsWith('CON-')) return 'contractor';  // Fixed: was CT-, should be CON-
  if (c.startsWith('CU-')) return 'customer';
  if (c.startsWith('M-') || c.startsWith('MGR-')) return 'manager';
  
  return undefined;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}