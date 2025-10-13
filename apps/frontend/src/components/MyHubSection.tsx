import { useEffect } from 'react';
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

  // Handle navigation from catalog with specific tab request
  useEffect(() => {
    const tabFromState = (location.state as any)?.openTab;
    if (tabFromState && onTabClick) {
      onTabClick(tabFromState);
    }
  }, [location.state, onTabClick]);

  const onLogout = providedOnLogout ?? logout;
  const welcomeName = providedWelcomeName ?? ownerFirstName ?? firstName ?? undefined;
  const userId = code ?? providedUserId ?? user?.username ?? undefined;
  const resolvedRole = (providedRole ?? role ?? 'admin').toLowerCase();

  return (
    <BaseMyHubSection
      {...rest}
      role={resolvedRole}
      welcomeName={welcomeName}
      userId={userId}
      onLogout={onLogout}
      onTabClick={onTabClick}
    />
  );
}

