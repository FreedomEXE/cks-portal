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
  const { user } = useUser();
  const [state, setState] = useState<ContractorState>({ loading: true, error: null, kind: "contractor", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchContractorData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      // Check for URL param overrides (dev/testing)
      const params = new URLSearchParams(window.location.search);
      const codeOverride = params.get('code') || undefined;
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastCode = user?.id ? undefined : (safeGet('contractor:lastCode') || undefined);

      // If explicit overrides exist, use demo data
      if (codeOverride) {
        const data = makeContractorDemoData(codeOverride || lastCode);
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'override' });
        console.debug('[useContractorData]', { source: 'override', data });
        return;
      }

      // Validate contractor role first
      if (!validateContractorRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Contractor access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildContractorApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
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
        
        // For network errors in dev, use fallback data
        if (!user?.id || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
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
      if (!data.contractor_id) data.contractor_id = 'con-000';
      if (!data.company_name) data.company_name = 'Contractor Demo';
      
      setState({ loading: false, error: null, kind: 'contractor', data, _source: sourceTag });
      console.debug('[useContractorData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('contractor:lastCode') || undefined;
        const data = makeContractorDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'contractor', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return; // Prevent double fetch in StrictMode
    didInitialFetchRef.current = true;
    fetchContractorData();
  }, [fetchContractorData]);

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
    contact_person: 'John Contractor',
    email: 'contact@contractor-demo.com',
    phone: '(555) 987-6543',
    address: '123 Business Ave, Suite 100',
    established: '2020-01-01',
    services_purchased: ['Cleaning', 'Maintenance', 'Security'],
    payment_status: 'Current',
    account_manager: 'CKS Manager Demo',
    customers_served: 15,
    locations_active: 8,
    crew_assigned: 12,
    pending_orders: 4,
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