/**
 * CenterProfile (migrated from legacy Hubs/Center)
 * Purpose: Reusable Center profile renderer with role-based visibility filtering.
 */
import ProfileCard from '../../../../components/ProfileCard';
import ProfileTabs from '../../../../components/ProfileTabs';
import centerTabsConfig from '../../../../components/profiles/centerTabs.config';
import { getCenterVisibility } from '../../../../components/profiles/centerVisibility';

import type { ViewerRole } from '../../../../components/profiles/visibility.types';

interface Props {
  subjectCode: string;
  subjectData: any; // TODO: type from backend
  viewerRole: ViewerRole;
  relationship?: 'assigned-manager' | 'serving-contractor' | 'own-center' | 'customer-owner' | 'serving-crew' | 'none';
  showHeader?: boolean;
}

export default function CenterProfile({ subjectCode, subjectData, viewerRole, relationship, showHeader = true }: Props) {
  if (!subjectData) return null;
  const { allowed } = getCenterVisibility({ viewerRole, subjectCode, relationship });
  const filteredTabs = centerTabsConfig.map(tab => ({
    label: tab.label,
    columns: tab.columns.filter(c => allowed.has(c.key))
  }));
  return (
    <div>
      {showHeader ? <ProfileCard kind="center" data={subjectData} /> : null}
  <ProfileTabs tabs={filteredTabs} subject={{ kind: 'center', code: subjectCode, name: subjectData?.center_name || subjectData?.name }} data={subjectData} />
    </div>
  );
}
