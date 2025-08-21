/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Profile.tsx (Customer)
 * 
 * Template shared by all Linked Customer User ID's
 * Description: Customer profile component that receives data from parent
 * Function: Displays customer profile card and tabbed information sections
 * Importance: High - Primary view for customer account information
 * Connects to: ProfileCard, ProfileTabs, customerTabs config
 * 
 * Notes: Simplified from complex visibility system.
 *        Parent component handles data fetching and role context.
 */

import ProfileCard from '../../../components/ProfileCard';
import ProfileTabs from '../../../components/ProfileTabs';
import customerTabsConfig from '../../../components/profiles/customerTabs.config';

export default function CustomerProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
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
      {showHeader ? <ProfileCard kind="customer" data={data} /> : null}
      <ProfileTabs 
        tabs={customerTabsConfig} 
        subject={{ kind: 'customer', code: data?.customer_id || data?.code, name: data?.company_name || data?.name }} 
        data={data} 
      />
    </div>
  );
}