/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Profile.tsx (Center)
 * 
 * Template shared by all Linked Center User ID's
 * Description: Center profile component that receives data from parent
 * Function: Displays center profile card and tabbed information sections
 * Importance: High - Primary view for center account information
 * Connects to: ProfileCard, ProfileTabs, centerTabs config
 * 
 * Notes: Simplified from complex visibility system.
 *        Parent component handles data fetching and role context.
 */

import ProfileCard from '../../../components/ProfileCard';
import ProfileTabs from '../../../components/ProfileTabs';
import centerTabsConfig from '../../../components/profiles/centerTabs.config';

export default function CenterProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
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
      {showHeader ? <ProfileCard kind="center" data={data} /> : null}
      <ProfileTabs 
        tabs={centerTabsConfig} 
        subject={{ kind: 'center', code: data?.center_id || data?.code, name: data?.center_name || data?.name }} 
        data={data} 
      />
    </div>
  );
}