/**
 * ContractorProfile (migrated from legacy Hubs/Contractor)
 * Purpose: Reusable Contractor profile renderer.
 */
import ProfileCard from '../../../../components/ProfileCard';
import ProfileTabs from '../../../../components/ProfileTabs';
import contractorTabsConfig from '../../../../components/profiles/contractorTabs.config';

export default function ContractorProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
  if (!data) return null;
  return (
    <div>
      {showHeader ? <ProfileCard kind="contractor" data={data} /> : null}
      <ProfileTabs tabs={contractorTabsConfig} subject={{ kind: 'contractor', code: data?.contractor_id, name: data?.company_name }} />
    </div>
  );
}
