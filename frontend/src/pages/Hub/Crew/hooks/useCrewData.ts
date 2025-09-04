/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useCrewData.ts
 * 
 * Description: Hook for fetching and managing crew member-specific profile data
 * Function: Fetches crew profile from Crew API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Crew hub (on-site workers)
 * Connects to: Crew API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Crew-specific version with dedicated API endpoints for operational tasks.
 *        Handles crew authentication and center assignment validation.
 *        Provides stub data when Crew API is unavailable.
 *        Crew members work at specific centers and report to facility coordinators.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildCrewApiUrl, crewApiFetch } from "../utils/crewApi";
import { useUser } from '@clerk/clerk-react';
import { validateCrewRole } from '../utils/crewAuth';

type CrewState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useCrewData() {
  const { user } = useUser();
  const [state, setState] = useState<CrewState>({ loading: true, error: null, kind: "crew", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchCrewData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      // Check for URL param overrides (dev/testing)
      const params = new URLSearchParams(window.location.search);
      const codeOverride = params.get('code') || undefined;
      
      // Check localStorage fallbacks (only in dev/offline)
      const lastCode = user?.id ? undefined : (safeGet('crew:lastCode') || undefined);

      // If explicit overrides exist, use demo data
      if (codeOverride) {
        const data = makeCrewDemoData(codeOverride || lastCode);
        setState({ loading: false, error: null, kind: 'crew', data, _source: 'override' });
        console.debug('[useCrewData]', { source: 'override', data });
        return;
      }

      // For template users, use demo data directly (skip validation)
      const username = user?.username || '';
      if (username.includes('-000') || username === 'crw-000') {
        const data = makeCrewDemoData(username || 'crw-000');
        setState({ loading: false, error: null, kind: 'crew', data, _source: 'template-user' });
        console.debug('[useCrewData]', { source: 'template-user', username, data });
        return;
      }

      // Validate crew role for real users
      if (!validateCrewRole(user)) {
        setState({ loading: false, error: 'Unauthorized: Crew access required', kind: "", data: null, _source: 'auth-error' });
        return;
      }

      const url = buildCrewApiUrl("/profile", codeOverride ? { code: codeOverride } : {});
      console.debug('[useCrewData] fetching', url);
      
      const res = await crewApiFetch(url);
      let j: any = await res.json();
      console.debug('[useCrewData] response', { status: res.status, data: j });

      let sourceTag: string = '/crew-api/profile';

      // Handle 404 - try fallback endpoints
      if (res.status === 404) {
        const fallbackPaths = ['/me', '/crew/me', '/profile', '/member'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        
        for (const p of fallbackPaths) {
          try {
            const r = await crewApiFetch(buildCrewApiUrl(p));
            console.debug('[useCrewData] trying fallback', { url: p, status: r?.status });
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            console.debug('[useCrewData] fallback error', { url: p, error: e.message });
          }
        }
        
        // Provide stub for crew if all fallbacks fail
        if (!fallbackJson) {
          fallbackJson = makeCrewDemoData();
          fallbackSource = 'stub:crew';
        }
        
        j = fallbackJson;
        sourceTag = fallbackSource || '404-fallback';
      }

      // Handle other errors
      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        
        // For network errors in dev, use fallback data
        if (!user?.id || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
          const data = makeCrewDemoData(safeGet('crew:lastCode') || undefined);
          setState({ loading: false, error: null, kind: 'crew', data, _source: 'soft-fallback' });
          return;
        }
        
        setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
        return;
      }

      // Normalize response data
      let data = j?.data || j || {};
      
      // Normalize common field names and IDs
      if (!data.crew_name && data.name) data.crew_name = data.name;
      if (!data.center_id && (data.assigned_center || data.center)) {
        data.center_id = data.assigned_center || data.center;
      }
      
      // Ensure crew has required fields
      if (!data.crew_id) data.crew_id = 'crew-000';
      if (!data.crew_name) data.crew_name = 'Crew Demo Member';
      
      setState({ loading: false, error: null, kind: 'crew', data, _source: sourceTag });
      console.debug('[useCrewData] success', { source: sourceTag, hasData: !!data });
      
    } catch (e: any) {
      const msg = e?.message || String(e);
      
      // Network error fallback
      if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const codeOverride = params.get('code') || undefined;
        const lastCode = safeGet('crew:lastCode') || undefined;
        const data = makeCrewDemoData(codeOverride || lastCode);
        
        setState({ loading: false, error: null, kind: 'crew', data, _source: 'network-fallback' });
        return;
      }
      
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return; // Prevent double fetch in StrictMode
    didInitialFetchRef.current = true;
    fetchCrewData();
  }, [fetchCrewData]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false;
    fetchCrewData();
  }, [fetchCrewData]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

export default useCrewData;

// Helper functions
function makeCrewDemoData(code?: string) {
  return { 
    crew_id: code || 'crew-000', 
    crew_name: 'Mike Johnson', 
    code: code || 'crew-000',
    employee_id: 'EMP-12345',
    role: 'Crew Leader',
    specializations: ['Cleaning', 'Maintenance'],
    email: 'mike.johnson@cks-crew.com',
    phone: '(555) 234-5678',
    emergency_contact: 'Sarah Johnson - (555) 876-5432',
    hire_date: '2023-03-15',
    center_assigned: 'Downtown Operations Center',
    center_id: 'CEN-001',
    shift_schedule: 'Morning (6 AM - 2 PM)',
    hourly_rate: '$18.50',
    supervisor: 'John Center',
    certifications: ['Safety Training', 'Equipment Operation'],
    current_status: 'On Duty',
    hours_this_week: 0,
    tasks_completed: 0,
    training_due: 'Chemical Safety - Due: 2025-09-15',
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
