/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Profile.tsx (Contractor)
 
 * Template shared by all Linked Contractor User ID's
 * Description: Contractor profile component that receives data from parent
 * Function: Displays contractor profile card and tabbed information sections
 * Importance: High - Primary view for contractor account information
 * Connects to: ProfileCard, ProfileTabs, contractorTabs config
 * 
 * Notes: Receives data from parent component (MyProfile).
 *        Parent handles data fetching and role context.
 */

import ProfileCard from '../../../components/ProfileCard';
import ProfileTabs from '../../../components/ProfileTabs';
import contractorTabsConfig from '../../../components/profiles/contractorTabs.config';

export default function ContractorProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
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
      {showHeader ? <ProfileCard kind="contractor" data={data} /> : null}
      <ProfileTabs 
        tabs={contractorTabsConfig} 
        subject={{ kind: 'contractor', code: data?.contractor_id || data?.code, name: data?.company_name || data?.name }} 
        data={data} 
      />
    </div>
  );
}