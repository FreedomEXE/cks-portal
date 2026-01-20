import { Forgot, Login, RoleGuard, useAuth } from '@cks/auth';
import { useEffect, useRef, type ComponentType } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { useLoading } from './contexts/LoadingContext';
import { useHubLoading } from './contexts/HubLoadingContext';
import { ModalProvider } from './contexts/ModalProvider';
import { AccessGate } from './components/AccessGate';
import BuildBadge from './components/BuildBadge';

import AdminHub from './hubs/AdminHub';
import CenterHub from './hubs/CenterHub';
import ContractorHub from './hubs/ContractorHub';
import CrewHub from './hubs/CrewHub';
import CustomerHub from './hubs/CustomerHub';
import ManagerHub from './hubs/ManagerHub';
import WarehouseHub from './hubs/WarehouseHub';
import CKSCatalog from './pages/CKSCatalog';
import Impersonate from './pages/Impersonate';
import Memos from './pages/Memos';
import News from './pages/News';

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
  const { status, role, code, accessStatus } = useAuth();
  const { start } = useLoading();
  const { isHubLoading } = useHubLoading();
  const loaderEndRef = useRef<(() => void) | null>(null);

  console.log('[HubLoader] Auth state:', { status, role, code, isHubLoading });

  // Manage loader based on hub's loading state
  useEffect(() => {
    if (isHubLoading && !loaderEndRef.current) {
      loaderEndRef.current = start();
      console.log('[HubLoader] Started loader - hub is loading');
    } else if (!isHubLoading && loaderEndRef.current) {
      // Hide loader immediately when hub is ready
      loaderEndRef.current();
      loaderEndRef.current = null;
      console.log('[HubLoader] Stopped loader - hub is ready');
    }

    return () => {
      if (loaderEndRef.current) {
        loaderEndRef.current();
        loaderEndRef.current = null;
      }
    };
  }, [isHubLoading, start]);

  if (status === 'idle' || status === 'loading') {
    console.log('[HubLoader] Still loading...');
    return null;
  }

  if (!role || status !== 'ready') {
    console.log('[HubLoader] No role or not ready, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = role.toLowerCase();
  const Hub = HUB_COMPONENTS[normalizedRole];
  console.log('[HubLoader] Looking for hub component:', role.toLowerCase(), '-> found:', !!Hub);

  if (!Hub) {
    console.error('[HubLoader] No hub component found for role:', role);
    return <Navigate to="/login" replace />;
  }

  // Always render hub - keep it laid out (not hidden) so OrdersSection
  // can scroll and measure correctly under the global loader overlay
  return (
    <>
      {accessStatus === 'locked' && !['admin', 'administrator'].includes(normalizedRole) ? <AccessGate /> : null}
      <Hub initialTab={initialTab} />
    </>
  );
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
  console.log('[AuthenticatedApp] Rendering authenticated app');

  return (
    <ModalProvider>
      <BuildBadge />
      <Routes>
        <Route path="/" element={<Navigate to="/hub" replace />} />
        <Route path="/hub" element={<RoleHubRoute />} />
        <Route path="/catalog" element={<CKSCatalog />} />
        <Route path="/memos" element={<Memos />} />
        <Route path="/news" element={<News />} />
        <Route path="/impersonate" element={<Impersonate />} />
        <Route path="/hub/*" element={<Navigate to="/hub" replace />} />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </ModalProvider>
  );
}

export function UnauthenticatedApp(): JSX.Element {
  return (
    <>
      <BuildBadge />
      <Routes>
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/impersonate" element={<Impersonate />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
