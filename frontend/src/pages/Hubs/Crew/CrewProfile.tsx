/**
 * CKS Portal — CrewProfile (presentational)
 * Purpose: Reusable Crew profile renderer for owner or external viewers (future visibility rules TBD).
 * Change summary (Aug 2025): Implemented basic filtered ProfileTabs usage with shared config.
 */
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import crewTabsConfig from "../../../components/profiles/crewTabs.config";

export default function CrewProfile({ data, showHeader = true }: { data: any; showHeader?: boolean }) {
	if (!data) return null;
	// TODO: add crew visibility policy similar to centers when needed
	return (
		<div>
			{showHeader ? <ProfileCard kind="crew" data={data} /> : null}
			<ProfileTabs tabs={crewTabsConfig} subject={{ kind: 'crew', code: data?.crew_id, name: data?.name }} />
		</div>
	);
}
