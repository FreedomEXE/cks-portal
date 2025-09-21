import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@cks-auth/hooks/useAuth';
import AdminHub from '../hubs/AdminHub';

type RoleGuardProps = {
  initialTab?: string;
  children?: ReactNode;
};

function ContractorHubStub({ children }: { children?: ReactNode }) {
  return (
    <div className="p-8">
      <div className="rounded-xl border border-dashed border-gray-400 bg-gray-50 p-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Contractor Hub</h1>
        <p className="mt-2 text-sm text-gray-600">Coming soon. Contractor workspaces are being built.</p>
      </div>
      {children}
    </div>
  );
}

export default function RoleGuard({ initialTab, children }: RoleGuardProps) {
  const { status, role, error } = useAuth();

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading hub...
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <>
        <AdminHub initialTab={initialTab} />
        {children}
      </>
    );
  }

  if (role === 'contractor') {
    return <ContractorHubStub>{children}</ContractorHubStub>;
  }

  if (status === 'error' || !role) {
    if (error) {
      console.error('RoleGuard blocked navigation', error);
    }
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
}

