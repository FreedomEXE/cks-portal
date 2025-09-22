import { MyHubSection as BaseMyHubSection, type MyHubSectionProps } from '@cks/ui';
import { useLogout } from '../hooks/useLogout';

type Props = MyHubSectionProps;

export default function MyHubSection(props: Props) {
  const logout = useLogout();
  const onLogout = props.onLogout ?? logout;
  return <BaseMyHubSection {...props} onLogout={onLogout} />;
}
