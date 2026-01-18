import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@cks/auth';
import { useUser } from '@clerk/clerk-react';
import { MyHubSection as BaseMyHubSection, type MyHubSectionProps } from '@cks/ui';
import { useLogout } from '../hooks/useLogout';

type Props = MyHubSectionProps;

export default function MyHubSection({
  welcomeName: providedWelcomeName,
  userId: providedUserId,
  role: providedRole,
  onLogout: providedOnLogout,
  onTabClick,
  ...rest
}: Props) {
  const logout = useLogout();
  const { code, firstName, ownerFirstName, role } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const onLogout = providedOnLogout ?? logout;
  const welcomeName = providedWelcomeName ?? ownerFirstName ?? firstName ?? undefined;
  const userId = code ?? providedUserId ?? user?.username ?? undefined;
  const resolvedRole = (providedRole ?? role ?? 'admin').toLowerCase();

  // Handle navigation from catalog with specific tab request
  useEffect(() => {
    const tabFromState = (location.state as any)?.openTab;
    if (tabFromState && onTabClick) {
      onTabClick(tabFromState);
    }
  }, [location.state, onTabClick]);

  useEffect(() => {
    try {
      const isActive = sessionStorage.getItem('cks_impersonation_active') === 'true';
      const isAdminRole = resolvedRole === 'admin' || resolvedRole === 'administrator';
      if (isAdminRole && isActive) {
        sessionStorage.removeItem('cks_impersonation_active');
        sessionStorage.removeItem('cks_impersonation_ticket');
        sessionStorage.removeItem('cks_impersonation_return');
      }
    } catch {}
  }, [resolvedRole]);

  const handleReturnToAdmin = useCallback(async () => {
    try {
      sessionStorage.removeItem('cks_impersonation_active');
      sessionStorage.removeItem('cks_impersonation_ticket');
      sessionStorage.removeItem('cks_impersonation_return');
    } catch {}
    await logout();
  }, [logout]);

  const isAdmin = resolvedRole === 'admin' || resolvedRole === 'administrator';
  let impersonationActive = false;
  try {
    impersonationActive = sessionStorage.getItem('cks_impersonation_active') === 'true';
  } catch {}
  const shouldShowImpersonation = impersonationActive && !isAdmin;

  return (
    <>
      {shouldShowImpersonation ? (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 12,
          fontSize: 13,
          fontWeight: 600,
        }}>
          Impersonation mode: viewing as {welcomeName ?? userId ?? 'user'}.
        </div>
      ) : null}
      <BaseMyHubSection
        {...rest}
        role={resolvedRole}
        welcomeName={welcomeName}
        userId={userId}
        onLogout={onLogout}
        secondaryAction={shouldShowImpersonation ? {
          label: 'Return to Admin',
          onClick: handleReturnToAdmin,
          variant: 'secondary',
        } : undefined}
        onTabClick={onTabClick}
      />
    </>
  );
}
