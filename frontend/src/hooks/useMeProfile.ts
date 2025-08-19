import { useCallback, useEffect, useState, useRef } from "react";
import { buildUrl, apiFetch } from "../lib/apiBase";
import { useUser } from '@clerk/clerk-react';
import getRole from '../lib/getRole';

/**
TRACE
OutboundImports: ../lib/apiBase, @clerk/clerk-react, ../lib/getRole
+InboundUsedBy: frontend/src/pages/MyProfile.tsx, frontend/src/pages/Hubs/Manager/ManagerHub.tsx, frontend/src/pages/MePage.tsx
+ProvidesData: yes - hook: { loading, error, kind, data, refetch }
+ConsumesData: window.location.search (role/kind/code), localStorage me:lastRole, me:lastCode, network /me/profile and fallback endpoints
+SideEffects: network fetches (apiFetch), console.debug, localStorage reads in safeGet
+RoleBranching: contains logic to synthesize manager stubs and fallbacks when endpoints 404 or network errors occur
+CriticalForManagerProfile: yes (primary source of manager data and fallbacks)
+SimplificationRisk: high (complex fallback heuristics and debug instrumentation interwoven with logic)
+*/

type MeState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  // Internal diagnostic source tag (not part of public contract but harmless if exposed)
  _source?: string;
};

export function useMeProfile() {
  const { user } = useUser();
  const [state, setState] = useState<MeState>({ loading: true, error: null, kind: "", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchMe = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      // Allow override via query string (?role=&code=) for dev/testing without auth
	  const params = new URLSearchParams(window.location.search);
      const roleOverride = (params.get('role') || params.get('kind') || '').toLowerCase() || undefined;
      const codeOverride = params.get('code') || undefined;
	  // Also consider last successful role/code stored by hubs/MyProfile. If the user is signed in,
	  // we'll prefer the server result and therefore ignore lastRole/lastCode here (they're dev fallbacks).
	  const lastRole = user?.id ? undefined : (safeGet('me:lastRole') || undefined);
	  const lastCode = user?.id ? undefined : (safeGet('me:lastCode') || undefined);

      // If explicit overrides are present, synthesize a local state immediately
      if (roleOverride || codeOverride) {
        const inferred =
          roleOverride ||
          inferKindFromCode(codeOverride) ||
          (lastRole && lastRole !== 'admin' ? lastRole : undefined) ||
          'admin';
        const data = makeDemoData(inferred, codeOverride || lastCode);
        const nextState: MeState = { loading: false, error: null, kind: inferred, data, _source: 'override' };
        try { console.debug('[useMeProfile post-set]', { kind: nextState.kind, dataRole: (nextState as any)?.data?.role, dataKind: (nextState as any)?.data?.kind }); } catch {}
        setState(nextState);
        try { console.debug('[useMeProfile debug]', { phase: 'final', source: nextState._source, kind: nextState.kind, hasManagerId: !!nextState.data?.manager_id, hasStub: !!nextState.data?._stub, error: !!nextState.error }); } catch {}
        return;
      }
	  const url = buildUrl("/me/profile", codeOverride ? { code: codeOverride } : {});
	  // DEBUG (retain existing instrumentation)
	  try { console.debug('[useMeProfile] fetching', url); } catch {}
	  const res = await apiFetch(url);
	  let j: any = await res.json();
	  try { console.debug('[useMeProfile] response', j); } catch {}
	  try { console.debug('[useMeProfile fetch raw]', { url, status: res?.status, ok: res?.ok, payloadExcerpt: typeof j === 'object' && j ? Object.fromEntries(Object.entries(j).slice(0, 12)) : typeof j === 'string' ? j.slice(0, 400) : j }); } catch {}

      let sourceTag: string = '/me/profile';

      // 404 fallback logic
      if (res.status === 404) {
        const userRole = getRole(user);
        const fallbackPaths = ['/me/manager', '/manager/profile', '/manager/me'];
        let fallbackJson: any = null;
        let fallbackSource: string | null = null;
        for (const p of fallbackPaths) {
          try {
            const r = await apiFetch(buildUrl(p));
            try { console.debug('[useMeProfile fallback]', { attemptUrl: p, status: r?.status }); } catch {}
            if (r.ok) {
              fallbackJson = await r.json().catch(() => null);
              fallbackSource = p;
              break;
            }
          } catch (e: any) {
            try { console.debug('[useMeProfile fallback error]', { attemptUrl: p, error: String(e) }); } catch {}
          }
        }
        if (!fallbackJson && userRole === 'manager') {
          // Provide clearly temporary stub so UI is usable
          fallbackJson = { role: 'manager', kind: 'manager', manager_id: 'demo-mgr-000', name: 'Manager Demo (stub)', _stub: true };
          fallbackSource = 'stub:manager';
          try { console.debug('[useMeProfile stub]', { reason: 'all endpoints 404', userRole }); } catch {}
        }
        if (fallbackJson) {
          j = fallbackJson;
          sourceTag = fallbackSource || '404-fallback';
        } else {
          sourceTag = '404-no-data';
        }
      }

      if (!res.ok && res.status !== 404) {
        const msg = String(j?.error || `HTTP ${res.status}`);
        if (user?.id && !(/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg))) {
          setState({ loading: false, error: msg, kind: "", data: null, _source: sourceTag });
          try { console.debug('[useMeProfile debug]', { phase: 'final', source: sourceTag, kind: '', hasManagerId: false, hasStub: false, error: true }); } catch {}
          return;
        }
        // Soft fallback (dev / offline)
        const inferred =
          inferKindFromCode(undefined) || // none
          (safeGet('me:lastRole') && safeGet('me:lastRole') !== 'admin' ? safeGet('me:lastRole') || undefined : undefined) ||
          'admin';
        const data = makeDemoData(inferred, safeGet('me:lastCode') || undefined);
        const nextState: MeState = { loading: false, error: null, kind: inferred, data, _source: sourceTag + ':soft' };
        try { console.debug('[useMeProfile post-set]', { kind: nextState.kind, dataRole: (nextState as any)?.data?.role, dataKind: (nextState as any)?.data?.kind }); } catch {}
        setState(nextState);
        try { console.debug('[useMeProfile debug]', { phase: 'final', source: nextState._source, kind: nextState.kind, hasManagerId: !!nextState.data?.manager_id, hasStub: !!nextState.data?._stub, error: !!nextState.error }); } catch {}
        return;
      }

      // Normalize (works for primary, fallback, or stub)
      let kind = j?.kind || j?.data?.kind || j?.role || '';
      const userRole = getRole(user);
      if (!kind && userRole === 'manager') kind = 'manager';
      let data = j?.data || j || {};
      if (userRole === 'manager' && kind === 'manager') {
        if (!data.manager_id) data.manager_id = data.manager_id || 'demo-mgr-000';
        if (!data.name) data.name = data.name || 'Manager Demo';
      }
      const nextState: MeState = { loading: false, error: null, kind, data, _source: sourceTag };
      try { console.debug('[useMeProfile post-set]', { kind: nextState.kind, dataRole: (nextState as any)?.data?.role, dataKind: (nextState as any)?.data?.kind }); } catch {}
      setState(nextState);
      try { console.debug('[useMeProfile debug]', { phase: 'final', source: nextState._source, kind: nextState.kind, hasManagerId: !!nextState.data?.manager_id, hasStub: !!nextState.data?._stub, error: !!nextState.error }); } catch {}
    } catch (e: any) {
      const msg = e?.message || String(e);
	  if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(msg)) {
        const params = new URLSearchParams(window.location.search);
        const roleOverride = (params.get('role') || params.get('kind') || '').toLowerCase() || undefined;
        const codeOverride = params.get('code') || undefined;
        let inferred: string | undefined = roleOverride as any;
        if (!inferred && codeOverride && /^\d{3}-[A-Z]$/i.test(codeOverride)) inferred = 'center';
        const lastRole = safeGet('me:lastRole') || undefined;
        const lastCode = safeGet('me:lastCode') || undefined;
	    const kind = inferred || (lastRole && lastRole !== 'admin' ? lastRole : undefined) || 'admin';
        const data = makeDemoData(kind, codeOverride || lastCode);
        const nextState: MeState = { loading: false, error: null, kind, data, _source: 'network-fallback' };
        try { console.debug('[useMeProfile post-set]', { kind: nextState.kind, dataRole: (nextState as any)?.data?.role, dataKind: (nextState as any)?.data?.kind }); } catch {}
        setState(nextState);
        try { console.debug('[useMeProfile debug]', { phase: 'final', source: nextState._source, kind: nextState.kind, hasManagerId: !!nextState.data?.manager_id, hasStub: !!nextState.data?._stub, error: !!nextState.error }); } catch {}
        return;
      }
      setState({ loading: false, error: msg, kind: "", data: null, _source: 'error' });
      try { console.debug('[useMeProfile debug]', { phase: 'final', source: 'error', kind: '', hasManagerId: false, hasStub: false, error: true }); } catch {}
    }
  }, [user]);

  useEffect(() => {
    if (didInitialFetchRef.current) return; // Guard against StrictMode double invoke
    didInitialFetchRef.current = true;
    fetchMe();
  }, [fetchMe]);

  const refetch = useCallback(() => {
    didInitialFetchRef.current = false; // allow a fresh fetch cycle
    fetchMe();
  }, [fetchMe]);

  return { loading: state.loading, error: state.error, kind: state.kind, data: state.data, refetch };
}

try { /* Late debug snapshot */ console.debug('[useMeProfile debug]', { state: 'return', loading: false }); } catch {}

export default useMeProfile;

// Helper to craft minimal demo data objects per role when backend is unavailable
function makeDemoData(kind: string, code?: string) {
  const k = (kind || '').toLowerCase();
  const c = code || '';
  if (k === 'center') return { center_id: c || '001-D', name: 'Center Demo', code: c || '001-D' };
  if (k === 'crew') return { crew_id: c || 'CR-001', name: 'Crew Demo', code: c || 'CR-001' };
  if (k === 'contractor') return { contractor_id: c || 'CT-001', company_name: 'Contractor Demo', code: c || 'CT-001' };
  if (k === 'customer') return { customer_id: c || 'CU-001', company_name: 'Customer Demo', code: c || 'CU-001' };
  if (k === 'manager') return { manager_id: c || 'M-001', name: 'Manager Demo', code: c || 'M-001' };
  return { code: c || '000-A' };
}

function inferKindFromCode(code?: string) {
  if (!code) return undefined;
  const c = code.toUpperCase();
  if (/^\d{3}-[A-Z]$/.test(c)) return 'center';
  if (c.startsWith('CR-')) return 'crew';
  if (c.startsWith('CT-')) return 'contractor';
  if (c.startsWith('CU-')) return 'customer';
  if (c.startsWith('M-')) return 'manager';
  return undefined;
}

// Safe localStorage access (avoids exceptions in private mode or SSR)
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// MANAGER_MIN_REQUIRED_STATE // FieldsNeeded: manager_id, name, code (optional: email, phone, center_id) // MinimalHookSignature: // interface ManagerMeState { loading: boolean; error: string|null; kind: 'manager'|''; // data: null | { manager_id: string; name: string; email?: string; phone?: string; center?: string }; refetch(): void; } // ProposedNextHookName: useManagerProfileData // Notes: Suggest removing multi-endpoint fallbacks and localStorage reliance for manager-only hook; keep debug logging optional behind a flag.
