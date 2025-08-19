/**
 * CrewProfile (migrated from legacy Hubs/Crew)
 * Purpose: Reusable Crew profile renderer.
 */
import ProfileCard from '../../../../components/ProfileCard';
import ProfileTabs from '../../../../components/ProfileTabs';
import crewTabsConfig from '../../../../components/profiles/crewTabs.config';

export default function CrewProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
  if (!data) return null;
  return (
    <div>
      {showHeader ? <ProfileCard kind="crew" data={data} /> : null}
      <ProfileTabs tabs={crewTabsConfig} subject={{ kind: 'crew', code: data?.crew_id, name: data?.name }} />
    </div>
  );
}
