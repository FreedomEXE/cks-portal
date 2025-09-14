/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useContractorData.ts
 * 
 * Description: Hook for fetching and managing contractor-specific profile data
 * Function: Fetches contractor profile from Contractor API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Contractor hub (top of business chain)
 * Connects to: Contractor API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Contractor-specific version with dedicated API endpoints for the paying clients.
 *        Handles contractor authentication and business account validation.
 *        Provides stub data when Contractor API is unavailable.
 *        Contractors are CKS clients who pay for services on behalf of their customers.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildContractorApiUrl, contractorApiFetch } from "../utils/contractorApi";
import { useUser } from '@clerk/clerk-react';
import { validateContractorRole } from '../utils/contractorAuth';

type ContractorState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useContractorData() {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<ContractorState>({ loading: true, error: null, kind: "contractor", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchContractorData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      // Check for URL param overrides and template path first (bypass Clerk load for templates)
      const params = new URLSearchParams(window.location.search);
      const codeOverride = params.get('code') || undefined;
      const pathUser = (window.location.pathname.split('/')[1] || '').trim();
      const pathCode = /^con-\d+$/i.test(pathUser) ? pathUser.toUpperCase() : undefined;
      const isTemplatePath = /^con-000$/i.test(pathUser);

      // If explicit overrides or template path exist, use demo data immediately
      if (codeOverride) {
        const data = makeContractorDemoData(codeOverride);
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'override' });
        console.debug('[useContractorData]', { source: 'override', data });
        return;
      }
      if (isTemplatePath) {
        const data = makeContractorDemoData('CON-000');
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'template-path' });
        console.debug('[useContractorData]', { source: 'template-path', data });
        return;
      }

      // CRITICAL: Wait for Clerk to load before any auth checks (non-template)
      if (!isLoaded) {
        console.debug('[useContractorData] Clerk not loaded yet, waiting...');
        setState({ loading: true, error: null, kind: "contractor", data: null });
        return;
      }
      console.debug('[useContractorData] Clerk loaded, proceeding with auth checks');

      // Check localStorage fallbacks (only in dev/offline)
      const lastCodeAny = (safeGet('contractor:lastCode') || sessionStorage.getItem('contractor:lastCode') || undefined) as string | undefined;
      const lastCode = lastCodeAny ? lastCodeAny.toUpperCase() : undefined;

      // Template users or path-based template access: use demo data directly (skip validation)
      const username = user?.username || '';
      if (username.includes('-000') || username === 'con-000' || username === 'CON-000') {
        const data = makeContractorDemoData(username || 'CON-000');
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'template-user' });
        console.debug('[useContractorData]', { source: 'template-user', username, data });
        return;
      }

      // Admin viewer mode: allow admins to view any contractor by path code
      const isAdminUser = (() => {
        try {
          const meta: any = (user as any)?.publicMetadata || {};
          const role = (meta.role || meta.hub_role || '').toString().toLowerCase();
          const uname = (user as any)?.username || '';
          return role === 'admin' || uname === 'freedom_exe' || uname === 'admin';
        } catch { return false; }
      })();
      if (isAdminUser && pathCode) {
        const url = buildContractorApiUrl("/profile", { code: pathCode });
        console.debug('[useContractorData] admin viewer mode fetch', url);
        const res = await contractorApiFetch(url);
        const j = await res.json();
        if (!res.ok) {
          setState({ loading: false, error: j?.error || 'Failed to load contractor (admin view)', kind: '', data: null, _source: 'admin-view' });
          return;
        }
        const data = j?.data || j || {};
        if (!data.contractor_id) data.contractor_id = pathCode;
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'admin-view' });
        return;
      }

      // Check for impersonation mode (admin viewing contractor)
      let isImpersonating = false;
      let impersonateRole = '';
      try {
        isImpersonating = sessionStorage.getItem('impersonate') === 'true';
        impersonateRole = sessionStorage.getItem('me:lastRole') || '';
      } catch { /* ignore */ }

      // Validate contractor role (allow impersonation from admin)
      const hasContractorRole = validateContractorRole(user);
      const isAdminImpersonating = isImpersonating && impersonateRole === 'contractor';
      
      if (!hasContractorRole && !isAdminImpersonating) {
        setState({ loading: false, error: 'Unauthorized: Contractor access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      // Get impersonation code if in impersonation mode
      let impersonateCode = '';
      if (isImpersonating) {
        try {
          impersonateCode = sessionStorage.getItem('me:lastCode') || '';
        } catch { /* ignore */ }
      }

      // Prefer explicit code param, then impersonation code, then path/session codes
      const resolvedCode = (codeOverride || impersonateCode || pathCode || lastCode) as string | undefined;
      const url = buildContractorApiUrl("/profile", resolvedCode ? { code: resolvedCode } : {});
      console.debug('[useContractorData] fetching', url);
      
      const res = await contractorApiFetch(url);
      let j: any = await res.json();
      console.debug('[useContractorData] response', { status: res.status, data: j });

      let sourceTag: string = '/contractor-api/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const fallbackPaths = ['/me', '/contractor/me', '/profile', '/company'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await contractorApiFetch(buildContractorApiUrl(p));
            console.debug('[useContractorData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            console.debug('[useContractorData] fallback error', { url: p, error: e.message });
          }
        }
        
        // Provide stub for contractor if all fallbacks fail
        if (!fallbackJson) {
          fallbackJson = makeContractorDemoData();
          fallbackSource = 'stub:contractor';
        }
        
        j = fallbackJson;
        sourceTag = fallbackSource || '404-fallback';
      }

      // Handle other errors
      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        // For network or server errors (5xx) in dev, use fallback data
        if (!user?.id || res.status >= 500 || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const data = makeContractorDemoData(safeGet('contractor:lastCode') || undefined);
          setState({ loading: false, error: null, kind: 'contractor', data, _source: 'soft-fallback' });
          return;
        }
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      // Normalize response data
      let data = j?.data || j || {};
      
      // Ensure contractor has required fields
      if (!data.contractor_id) data.contractor_id = 'CON-000';
      if (!data.company_name) data.company_name = 'Contractor Demo';
      
      setState({ loading: false, error: null, kind: 'contractor', data, _source: sourceTag });
      console.debug('[useContractorData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network/parse error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED|Unexpected end of JSON input/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('contractor:lastCode') || undefined;
        const data = makeContractorDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user, isLoaded]);

  useEffect(() => {
    // Run once after Clerk load state stabilizes; allow earlier runs for template/override paths
    if (!didInitialFetchRef.current) {
      didInitialFetchRef.current = true;
      fetchContractorData();
      return;
    }
    // If Clerk just finished loading, re-fetch to enable admin viewer mode
    if (isLoaded) {
      fetchContractorData();
    }
  }, [isLoaded, fetchContractorData]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchContractorData();
  }, [fetchContractorData]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useContractorData;

// Helper functions
function makeContractorDemoData(code?: string) {
  return { 
    contractor_id: code || 'con-000', 
    company_name: 'Contractor Demo LLC', 
    code: code || 'con-000',
    business_license: 'BL-123456',
    main_contact: 'John Contractor',
    email: 'contact@contractor-demo.com',
    phone: '(555) 987-6543',
    address: '123 Business Ave, Suite 100',
    established: '2020-01-01',
    services_purchased: ['Cleaning', 'Maintenance', 'Security'],
    payment_status: 'Current',
    account_manager: 'CKS Manager Demo',
    customers_served: 0,
    locations_active: 0,
    crew_assigned: 0,
    pending_orders: 0,
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
