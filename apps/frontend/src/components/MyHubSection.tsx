import { useAuth } from '@cks/auth';
import { MyHubSection as BaseMyHubSection, type MyHubSectionProps } from '@cks/ui';
import { useLogout } from '../hooks/useLogout';

type Props = MyHubSectionProps;

export default function MyHubSection({
  welcomeName: providedWelcomeName,
  userId: providedUserId,
  role: providedRole,
  onLogout: providedOnLogout,
  ...rest
}: Props) {
  const logout = useLogout();
  const { code, firstName, ownerFirstName, role } = useAuth();

  const onLogout = providedOnLogout ?? logout;
  const welcomeName = providedWelcomeName ?? ownerFirstName ?? firstName ?? undefined;
  const userId = code ?? providedUserId ?? undefined;
  const resolvedRole = (providedRole ?? role ?? 'admin').toLowerCase();

  return (
    <BaseMyHubSection
      {...rest}
      role={resolvedRole}
      welcomeName={welcomeName}
      userId={userId}
      onLogout={onLogout}
    />
  );
}

