/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useCustomerData.ts
 * 
 * Description: Hook for fetching and managing customer-specific profile data
 * Function: Fetches customer profile from Customer API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Customer hub (center managers)
 * Connects to: Customer API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Customer-specific version with dedicated API endpoints for center management.
 *        Handles customer authentication and center account validation.
 *        Provides stub data when Customer API is unavailable.
 *        Customers manage centers on behalf of contractors through CKS services.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildCustomerApiUrl, customerApiFetch } from "../utils/customerApi";
import { useUser } from '@clerk/clerk-react';
import { validateCustomerRole } from '../utils/customerAuth';

type CustomerState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useCustomerData() {
  const { user } = useUser();
  const [state, setState] = useState<CustomerState>({ loading: true, error: null, kind: "customer", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchCustomerData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      // Check for URL param overrides (dev/testing)
      const params = new URLSearchParams(window.location.search);
      const codeOverride = params.get('code') || undefined;
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastCode = user?.id ? undefined : (safeGet('customer:lastCode') || undefined);

      // If explicit overrides exist, use demo data
      if (codeOverride) {
        const data = makeCustomerDemoData(codeOverride || lastCode);
        setState({ loading: false, error: null, kind: 'customer', data, _source: 'override' });
        console.debug('[useCustomerData]', { source: 'override', data });
        return;
      }

      // Template users: use demo data directly (skip validation)
      const username = user?.username || '';
      if (username.includes('-000') || username === 'cus-000' || username === 'CUS-000') {
        const data = makeCustomerDemoData(username || 'CUS-000');
        setState({ loading: false, error: null, kind: 'customer', data, _source: 'template-user' });
        console.debug('[useCustomerData]', { source: 'template-user', username, data });
        return;
      }

      // Validate customer role first
      if (!validateCustomerRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Customer access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildCustomerApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useCustomerData] fetching', url);
      
      const res = await customerApiFetch(url);
      let j: any;
      try {
        const text = await res.text();
        j = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.debug('[useCustomerData] JSON parse error, using fallback', parseError);
        j = {};
      }
      console.debug('[useCustomerData] response', { status: res.status, data: j });

      let sourceTag: string = '/customer-api/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const fallbackPaths = ['/me', '/customer/me', '/profile', '/account'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await customerApiFetch(buildCustomerApiUrl(p));
            console.debug('[useCustomerData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              try {
                const text = await r.text();
                fallbackJson = text ? JSON.parse(text) : null;
              } catch (parseError) {
                fallbackJson = null;
              }
              fallbackSource = p;
              if (fallbackJson) break;
            }
          } catch (e: any) {
            console.debug('[useCustomerData] fallback error', { url: p, error: e.message });
          }
        }
        
        // Provide stub for customer if all fallbacks fail
        if (!fallbackJson) {
          fallbackJson = makeCustomerDemoData();
          fallbackSource = 'stub:customer';
        }
        
        j = fallbackJson;
        sourceTag = fallbackSource || '404-fallback';
      }

      // Handle other errors
      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        // For network or server errors (5xx) in dev, use fallback data
        if (!user?.id || res.status >= 500 || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const data = makeCustomerDemoData(safeGet('customer:lastCode') || undefined);
          setState({ loading: false, error: null, kind: 'customer', data, _source: 'soft-fallback' });
          return;
        }
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      // Normalize response data
      let data = j?.data || j || {};
      
      // Ensure customer has required fields
      if (!data.customer_id) data.customer_id = 'CUS-000';
      if (!data.customer_name) data.customer_name = 'Customer Demo';
      
      setState({ loading: false, error: null, kind: 'customer', data, _source: sourceTag });
      console.debug('[useCustomerData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('customer:lastCode') || undefined;
        const data = makeCustomerDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'customer', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return; // Prevent double fetch in StrictMode
    didInitialFetchRef.current = true;
    fetchCustomerData();
  }, [fetchCustomerData]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchCustomerData();
  }, [fetchCustomerData]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useCustomerData;

// Helper functions
function makeCustomerDemoData(code?: string) {
  return { 
    customer_id: code || 'cust-000', 
    customer_name: 'Customer Demo Corp', 
    code: code || 'cust-000',
    account_type: 'Corporate',
    main_contact: 'Jane Customer',
    email: 'contact@customer-demo.com',
    phone: '(555) 456-7890',
    address: '456 Corporate Blvd, Suite 200',
    established: '2021-01-01',
    centers_managed: 0,
    total_locations: 0,
    service_areas: ['Downtown', 'North District', 'West Side'],
    account_status: 'Active',
    contract_manager: 'John Contractor',
    service_level: 'Standard',
    crew_assigned: 0,
    pending_requests: 0,
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
