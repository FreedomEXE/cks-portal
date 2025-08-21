/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Profile.tsx (Crew)
 * 
 * Template shared by all Linked Crew User ID's
 * Description: Crew profile component that receives data from parent
 * Function: Displays crew member profile card and tabbed information sections
 * Importance: High - Primary view for crew member account information
 * Connects to: ProfileCard, ProfileTabs, crewTabs config
 * 
 * Notes: Simplified from complex visibility system.
 *        Parent component handles data fetching and role context.
 */

import ProfileCard from '../../../components/ProfileCard';
import ProfileTabs from '../../../components/ProfileTabs';
import crewTabsConfig from '../../../components/profiles/crewTabs.config';

export default function CrewProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
  // Handle no data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="ui-card" style={{ padding: 16 }}>
        No profile data available.
      </div>
    );
  }
  
  return (
    <div>
      {showHeader ? <ProfileCard kind="crew" data={data} /> : null}
      <ProfileTabs 
        tabs={crewTabsConfig} 
        subject={{ kind: 'crew', code: data?.crew_id || data?.code, name: data?.full_name || data?.name }} 
        data={data} 
      />
    </div>
  );
}