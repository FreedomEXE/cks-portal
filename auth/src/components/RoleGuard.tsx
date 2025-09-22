import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  children?: React.ReactNode;
  fallbackPath?: string;
  allowedRoles?: string[];
  initialTab?: string | null;
}

export default function RoleGuard({
  children,
  fallbackPath = '/login',
  allowedRoles,
  initialTab: _initialTab = null,
}: RoleGuardProps) {
  const { status, role } = useAuth();

  if (status === 'idle' || status === 'loading') {
    return null;
  }

  if (status === 'ready' && !role) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (role && allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
