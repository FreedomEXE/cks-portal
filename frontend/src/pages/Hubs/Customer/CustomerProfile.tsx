/**
 * CKS Portal — CustomerProfile (presentational)
 * Purpose: Reusable Customer profile renderer.
 * Change summary (Aug 2025): Implemented basic ProfileTabs usage with shared config.
 */
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import customerTabsConfig from "../../../components/profiles/customerTabs.config";

export default function CustomerProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
	if (!data) return null;
	return (
		<div>
			{showHeader ? <ProfileCard kind="customer" data={data} /> : null}
			<ProfileTabs tabs={customerTabsConfig} subject={{ kind: 'customer', code: data?.customer_id, name: data?.company_name }} />
		</div>
	);
}
