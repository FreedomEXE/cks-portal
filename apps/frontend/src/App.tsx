import { Navigate, Outlet, Route, Routes, useSearchParams } from 'react-router-dom';
import RoleGuard from '@cks/auth/components/RoleGuard';
import Login from '@cks/auth/pages/Login';

function RoleHubRoute() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ?? undefined;

  return (
    <RoleGuard initialTab={initialTab}>
      <Outlet />
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
