/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useCenterData.ts
 * 
 * Description: Hook for fetching and managing center-specific profile data
 * Function: Fetches center profile from Center API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Center hub (crew coordinators)
 * Connects to: Center API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Center-specific version with dedicated API endpoints for crew management.
 *        Handles center authentication and crew coordination validation.
 *        Provides stub data when Center API is unavailable.
 *        Centers coordinate crew operations and report to customer managers.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildCenterApiUrl, centerApiFetch } from "../utils/centerApi";
import { useUser } from '@clerk/clerk-react';
import { validateCenterRole } from '../utils/centerAuth';

type CenterState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useCenterData() {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<CenterState>({ loading: true, error: null, kind: "center", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchCenterData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      // Check for URL overrides and template path first (bypass Clerk for templates)
      const params = new URLSearchParams(window.location.search);
      const codeOverride = params.get('code') || undefined;
      const pathUser = (window.location.pathname.split('/')[1] || '').trim();
      const isTemplatePath = /^cen-000$/i.test(pathUser) || /^ctr-000$/i.test(pathUser);

      if (codeOverride) {
        const data = makeCenterDemoData(codeOverride);
        setState({ loading: false, error: null, kind: 'center', data, _source: 'override' });
        console.debug('[useCenterData]', { source: 'override', data });
        return;
      }
      if (isTemplatePath) {
        const data = makeCenterDemoData('CEN-000');
        setState({ loading: false, error: null, kind: 'center', data, _source: 'template-path' });
        console.debug('[useCenterData]', { source: 'template-path', data });
        return;
      }

      // CRITICAL: Wait for Clerk to load before any auth checks (non-template)
      if (!isLoaded) {
        console.debug('[useCenterData] Clerk not loaded yet, waiting...');
        setState({ loading: true, error: null, kind: "center", data: null });
        return;
      }
      console.debug('[useCenterData] Clerk loaded, proceeding with auth checks');
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastCode = user?.id ? undefined : (safeGet('center:lastCode') || undefined);

      // If explicit overrides exist, use demo data
      if (codeOverride) {
        const data = makeCenterDemoData(codeOverride || lastCode);
        setState({ loading: false, error: null, kind: 'center', data, _source: 'override' });
        console.debug('[useCenterData]', { source: 'override', data });
        return;
      }

      // For template users, use demo data directly (skip validation)
      const username = user?.username || '';
      if (username.includes('-000') || username === 'cen-000') {
        const data = makeCenterDemoData(username || 'cen-000');
        setState({ loading: false, error: null, kind: 'center', data, _source: 'template-user' });
        console.debug('[useCenterData]', { source: 'template-user', username, data });
        return;
      }

      // Admin viewer mode: allow admins to view any center by path code
      const isAdminUser = (() => {
        try {
          const meta: any = (user as any)?.publicMetadata || {};
          const role = (meta.role || meta.hub_role || '').toString().toLowerCase();
          const uname = (user as any)?.username || '';
          return role === 'admin' || uname === 'freedom_exe' || uname === 'admin';
        } catch { return false; }
      })();
      const pathCodeCenter = (/^cen-\d+$/i.test(pathUser) || /^ctr-\d+$/i.test(pathUser)) ? pathUser.toUpperCase().replace(/^CTR-/i,'CEN-') : undefined;
      if (isAdminUser && pathCodeCenter) {
        const data = makeCenterDemoData(pathCodeCenter);
        setState({ loading: false, error: null, kind: 'center', data, _source: 'admin-view' });
        return;
      }

      // Validate center role for real users
      if (!validateCenterRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Center access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildCenterApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useCenterData] fetching', url);
      
      const res = await centerApiFetch(url);
      let j: any = await res.json();
      console.debug('[useCenterData] response', { status: res.status, data: j });

      let sourceTag: string = '/center-api/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const fallbackPaths = ['/me', '/center/me', '/profile', '/location'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await centerApiFetch(buildCenterApiUrl(p));
            console.debug('[useCenterData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            console.debug('[useCenterData] fallback error', { url: p, error: e.message });
          }
        }
        
        // Provide stub for center if all fallbacks fail
        if (!fallbackJson) {
          fallbackJson = makeCenterDemoData();
          fallbackSource = 'stub:center';
        }
        
        j = fallbackJson;
        sourceTag = fallbackSource || '404-fallback';
      }

      // Handle other errors
      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        
        // For network errors in dev, use fallback data
        if (!user?.id || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const data = makeCenterDemoData(safeGet('center:lastCode') || undefined);
          setState({ loading: false, error: null, kind: 'center', data, _source: 'soft-fallback' });
          return;
        }
        
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      // Normalize response data
      let data = j?.data || j || {};
      
      // Normalize common field names and IDs
      if (!data.center_name && data.name) data.center_name = data.name;
      if (!data.center_id && (data.id || data.code)) data.center_id = data.id || data.code;
      
      // Ensure center has required fields
      if (!data.center_id) data.center_id = 'CEN-000';
      if (!data.center_name) data.center_name = 'Center Demo Location';
      
      setState({ loading: false, error: null, kind: 'center', data, _source: sourceTag });
      console.debug('[useCenterData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('center:lastCode') || undefined;
        const data = makeCenterDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'center', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (!didInitialFetchRef.current) {
      didInitialFetchRef.current = true;
      fetchCenterData();
      return;
    }
    if (isLoaded) fetchCenterData();
  }, [isLoaded, fetchCenterData]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchCenterData();
  }, [fetchCenterData]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useCenterData;

// Helper functions
function makeCenterDemoData(code?: string) {
  return { 
    center_id: code || 'CEN-000', 
    center_name: 'Downtown Operations Center', 
    code: code || 'CEN-000',
    location_type: 'Commercial',
    facility_manager: 'John Center',
    email: 'manager@center-demo.com',
    phone: '(555) 789-0123',
    address: '789 Operations Blvd, Floor 3',
    established: '2022-01-01',
    service_areas: ['Main Floor', 'Upper Level', 'Parking Garage'],
    customer_account: 'Customer Demo Corp',
    contractor_assigned: 'Contractor Demo LLC',
    operation_hours: '24/7',
    crew_capacity: 0,
    active_crew: 0,
    pending_tasks: 0,
    equipment_count: 0,
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
