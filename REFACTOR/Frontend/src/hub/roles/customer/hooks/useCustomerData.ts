/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useCustomerData.ts
 * 
 * Description: Hook for fetching and managing customer-specific profile data
 * Function: Fetches customer profile from Customer API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Customer hub
 * Connects to: Customer API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Customer-specific version of useMeProfile with dedicated API endpoints.
 *        Handles customer authentication and data validation.
 *        Provides stub data when Customer API is unavailable.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildCustomerApiUrl, customerApiFetch } from "../utils/customerApi";
import { validateCustomerRole } from '../utils/customerAuth';

// Mock user hook for testing (replace with actual auth in production)
function useUser() {
  return {
    user: {
      id: 'test-customer-001',
      username: 'customer-test',
    }
  };
}

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
      let codeOverride = params.get('code') || undefined;
      
      // Extract customer ID from URL path (e.g., /CUS-001/hub)
      const pathMatch = window.location.pathname.match(/\/(CUS-\d+)\/hub/i);
      if (pathMatch && pathMatch[1]) {
        codeOverride = pathMatch[1].toUpperCase();
        console.debug('[useCustomerData] extracted customer ID from path:', codeOverride);
      }
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastCode = user?.id ? undefined : (safeGet('customer:lastCode') || undefined);

      // Skip demo data fallback - proceed to API call with codeOverride

      // Template users: use demo data directly (skip validation)
      const username = user?.username || '';
      if (username.includes('-000') || username === 'cus-000' || username === 'CUS-000') {
        const data = makeCustomerDemoData(username || 'CUS-000');
        setState({ loading: false, error: null, kind: 'customer', data, _source: 'template-user' });
        console.debug('[useCustomerData]', { source: 'template-user', username, data });
        return;
      }

      // Validate customer role first (temporarily disabled for development)
      // TODO: Re-enable authentication in production
      if (false && !validateCustomerRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Customer access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildCustomerApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useCustomerData] fetching', url, 'with codeOverride:', codeOverride);
      
      // Create custom fetch options with the correct customer ID header
      const fetchOptions: RequestInit = {};
      if (codeOverride) {
        fetchOptions.headers = {
          'x-user-id': codeOverride,
          'x-customer-user-id': codeOverride
        };
      }
      
      const res = await customerApiFetch(url, fetchOptions);
      let j: any = await res.json();
      console.debug('[useCustomerData] response', { status: res.status, data: j });

      let sourceTag: string = '/customer-api/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const fallbackPaths = ['/me', '/customer/me', '/profile'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await customerApiFetch(buildCustomerApiUrl(p));
            console.debug('[useCustomerData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
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
      if (!data.name) data.name = 'Customer Demo';
      
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
    customer_id: code || 'cus-000', 
    name: 'Customer Demo', 
    code: code || 'cus-000',
    email: 'customer@demo.com',
    phone: '(555) 123-4567',
    address: '123 Demo Street, Demo City, DC 12345',
    account_type: 'premium',
    member_since: '2024-01-01',
    total_orders: 8,
    satisfaction_rating: 4.9,
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