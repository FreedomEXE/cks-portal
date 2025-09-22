import type { MyHubSectionProps } from '../../../packages/ui/src/navigation/MyHubSection';
import BaseMyHubSection from '../../../packages/ui/src/navigation/MyHubSection';
import { useLogout } from '../hooks/useLogout';

type Props = MyHubSectionProps;

export default function MyHubSection(props: Props) {
  const logout = useLogout();
  const onLogout = props.onLogout ?? logout;
  return <BaseMyHubSection {...props} onLogout={onLogout} />;
}