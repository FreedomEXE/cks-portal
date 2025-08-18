/**
 * CKS Portal — CenterProfile (presentational)
 *
 * Purpose: Reusable Center profile renderer for owner (full) or external viewers (read-only, role-filtered).
 * Consumes shared tabs config and visibility policy.
 *
 * Change summary (Aug 2025): Implemented to support role-filtered profile views.
 */
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import centerTabsConfig from "../../../components/profiles/centerTabs.config";
import { getCenterVisibility } from "../../../components/profiles/centerVisibility";

import type { ViewerRole } from "../../../components/profiles/visibility.types";

type Props = {
	subjectCode: string; // Center code (e.g., 001-D)
	subjectData: any; // TODO: strongly type from backend contract
	viewerRole: ViewerRole;
	relationship?: "assigned-manager" | "serving-contractor" | "own-center" | "customer-owner" | "serving-crew" | "none";
};

export default function CenterProfile({ subjectCode, subjectData, viewerRole, relationship, showHeader = true }: Props & { showHeader?: boolean }) {
	if (!subjectData) return null;

	// Compute allowed fields for this viewer
	const { allowed } = getCenterVisibility({ viewerRole, subjectCode, relationship });

	// Filter tabs/columns based on allowed field keys
	const filteredTabs = centerTabsConfig.map((tab) => ({
		label: tab.label,
		columns: tab.columns.filter((c) => allowed.has(c.key)),
	}));

	return (
		<div>
			{/* Owner or external viewers share the same ProfileCard for now */}
			{showHeader ? <ProfileCard kind="center" data={subjectData} /> : null}
			<ProfileTabs tabs={filteredTabs} subject={{ kind: 'center', code: subjectCode, name: subjectData?.center_name || subjectData?.name }} />
		</div>
	);
}
