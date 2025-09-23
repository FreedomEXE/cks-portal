import { useEffect, type ComponentType } from 'react';
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { RoleGuard, Login, useAuth, persistImpersonation, clearImpersonation, normalizeImpersonationCode, inferRoleFromIdentifier } from '@cks/auth';

import AdminHub from './hubs/AdminHub';
import ManagerHub from './hubs/ManagerHub';
import CustomerHub from './hubs/CustomerHub';
import ContractorHub from './hubs/ContractorHub';
import CenterHub from './hubs/CenterHub';
import CrewHub from './hubs/CrewHub';
import WarehouseHub from './hubs/WarehouseHub';

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
  const { status, role } = useAuth();

  if (status === 'idle' || status === 'loading') {
    return null;
  }

  if (!role || status !== 'ready') {
    return <Navigate to="/login" replace />;
  }

  const Hub = HUB_COMPONENTS[role.toLowerCase()];
  if (!Hub) {
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

  useEffect(() => {
    if (!normalized) {
      clearImpersonation();
      return;
    }

    const stored = persistImpersonation({
      code: normalized,
      role: inferRoleFromIdentifier(normalized),
    });

    if (!stored) {
      clearImpersonation();
    }
  }, [normalized]);

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

