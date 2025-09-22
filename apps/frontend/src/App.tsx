import { Navigate, Outlet, Route, Routes, useSearchParams } from 'react-router-dom';
import { RoleGuard, Login } from '@cks/auth';

// Import your actual hub components
import AdminHub from './hubs/AdminHub';
import ManagerHub from './hubs/ManagerHub';
import CustomerHub from './hubs/CustomerHub';
import ContractorHub from './hubs/ContractorHub';
import CenterHub from './hubs/CenterHub';
import CrewHub from './hubs/CrewHub';
import WarehouseHub from './hubs/WarehouseHub';

function RoleHubRoute() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ?? undefined;

  return (
    <RoleGuard initialTab={initialTab}>
      <Routes>
        <Route path="admin/*" element={<AdminHub />} />
        <Route path="manager/*" element={<ManagerHub />} />
        <Route path="customer/*" element={<CustomerHub />} />
        <Route path="contractor/*" element={<ContractorHub />} />
        <Route path="center/*" element={<CenterHub />} />
        <Route path="crew/*" element={<CrewHub />} />
        <Route path="warehouse/*" element={<WarehouseHub />} />
        <Route path="*" element={<Navigate to="admin" replace />} />
      </Routes>
    </RoleGuard>
  );
}

export function AuthenticatedApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hub" replace />} />
      <Route path="/hub/*" element={<RoleHubRoute />} />
      <Route path="*" element={<Navigate to="/hub" replace />} />
    </Routes>
  );
}

export function UnauthenticatedApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
