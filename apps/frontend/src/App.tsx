import { Login, RoleGuard, useAuth } from '@cks/auth';
import { type ComponentType } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';

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

function HubLoader({ initialTab }: { initialTab?: string }): JSX.Element | null {
  const { status, role, code } = useAuth();

  console.log('[HubLoader] Auth state:', { status, role, code });

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
