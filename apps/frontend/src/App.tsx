import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { clearImpersonation, Login, normalizeImpersonationCode, RoleGuard, triggerImpersonation, type ImpersonationPayload, useAuth } from '@cks/auth';
import { useCallback, useEffect, type ComponentType } from 'react';
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';

import { apiFetch } from './shared/api/client';
import AdminHub from './hubs/AdminHub';
import CenterHub from './hubs/CenterHub';
import ContractorHub from './hubs/ContractorHub';
import CrewHub from './hubs/CrewHub';
import CustomerHub from './hubs/CustomerHub';
import ManagerHub from './hubs/ManagerHub';
import WarehouseHub from './hubs/WarehouseHub';
import CKSCatalog from './pages/CKSCatalog';

type HubComponent = ComponentType<{ initialTab?: string }>;

const HUB_COMPONENTS: Record<string, HubComponent> = {
  admin: AdminHub,
  manager: ManagerHub,
  customer: CustomerHub,
  contractor: ContractorHub,
  center: CenterHub,
  crew: CrewHub,
  warehouse: WarehouseHub,
};

function sanitizeTab(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function decodeSubject(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function HubLoader({ initialTab }: { initialTab?: string }): JSX.Element | null {
  const { status, role, impersonating, code } = useAuth();

  console.log('[HubLoader] Auth state:', { status, role, impersonating, code });

  if (status === 'idle' || status === 'loading') {
    console.log('[HubLoader] Still loading...');
    return null;
  }

  if (!role || status !== 'ready') {
    console.log('[HubLoader] No role or not ready, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const Hub = HUB_COMPONENTS[role.toLowerCase()];
  console.log('[HubLoader] Looking for hub component:', role.toLowerCase(), '-> found:', !!Hub);

  if (!Hub) {
    console.error('[HubLoader] No hub component found for role:', role);
    return <Navigate to="/login" replace />;
  }

  return <Hub initialTab={initialTab} />;
}

function RoleHubRoute(): JSX.Element {
  const [searchParams] = useSearchParams();
  const initialTab = sanitizeTab(searchParams.get('tab'));

  useEffect(() => {
    clearImpersonation();
  }, []);
  return (
    <RoleGuard initialTab={initialTab}>
      <HubLoader initialTab={initialTab} />
    </RoleGuard>
  );
}

function ImpersonatedHubRoute(): JSX.Element {
  const { subject } = useParams<{ subject: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = sanitizeTab(searchParams.get('tab'));
  const decoded = decodeSubject(subject);
  const normalized = normalizeImpersonationCode(decoded);
  const { getToken } = useClerkAuth();

  console.log('[ImpersonatedHubRoute] Starting with:', { subject, decoded, normalized });

  const impersonationRequest = useCallback(
    async (code: string): Promise<ImpersonationPayload | null> => {
      try {
        console.log('[ImpersonatedHubRoute] Making impersonation request for:', code);
        const result = await apiFetch<ImpersonationPayload>('/admin/impersonate', {
          method: 'POST',
          body: JSON.stringify({ code }),
          getToken,
        });
        console.log('[ImpersonatedHubRoute] Impersonation response:', result);
        return result;
      } catch (error) {
        console.warn('[ImpersonatedHubRoute] Impersonation request failed', error);
        return null;
      }
    },
    [getToken],
  );

  useEffect(() => {
    let active = true;
    if (!normalized) {
      console.log('[ImpersonatedHubRoute] No normalized code, clearing impersonation');
      clearImpersonation();
      return;
    }
    (async () => {
      console.log('[ImpersonatedHubRoute] Triggering impersonation for:', normalized);
      const ok = await triggerImpersonation(normalized, { request: impersonationRequest });
      console.log('[ImpersonatedHubRoute] Impersonation result:', ok);
      if (active && !ok) {
        console.log('[ImpersonatedHubRoute] Impersonation failed, clearing');
        clearImpersonation();
      }
    })();
    return () => { active = false; };
  }, [impersonationRequest, normalized]);

  if (!normalized) {
    return <Navigate to="/hub" replace />;
  }

  return (
    <RoleGuard initialTab={initialTab}>
      <HubLoader initialTab={initialTab} />
    </RoleGuard>
  );
}
export function AuthenticatedApp(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hub" replace />} />
      <Route path="/hub" element={<RoleHubRoute />} />
      <Route path="/catalog" element={<CKSCatalog />} />
      <Route path="/:subject/hub" element={<ImpersonatedHubRoute />} />
      <Route path="/hub/*" element={<Navigate to="/hub" replace />} />
      <Route path="*" element={<Navigate to="/hub" replace />} />
    </Routes>
  );
}

export function UnauthenticatedApp(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

