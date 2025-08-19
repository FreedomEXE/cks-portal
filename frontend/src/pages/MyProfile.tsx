/**
TRACE
OutboundImports: ../components/Page, ../hooks/useMeProfile, ./Hubs/Center/CenterProfile, ./Hubs/Crew/CrewProfile, ./Hubs/Contractor/ContractorProfile, ./Hubs/Customer/CustomerProfile, ./Hubs/Manager/ManagerProfile, ../components/ProfileCard, ../lib/getRole, @clerk/clerk-react
+InboundUsedBy: TBD
+ProvidesData: orchestrates role resolution and renders role-specific profile components; provides effectiveData to downstream components
+ConsumesData: state.kind, state.data (manager_id, name, code, center_id, crew_id, contractor_id, customer_id), URL params role/kind/code, localStorage me:lastRole, me:lastCode, user role via getRole(user)
+SideEffects: localStorage writes (me:lastRole, me:lastCode), useEffect for persistence, console.debug calls
+RoleBranching: multiple branches by resolvedKind (center, crew, contractor, customer, manager, admin)
+CriticalForManagerProfile: yes (routes manager role to ManagerProfile component)
+SimplificationRisk: med (contains override heuristics and fallback persistence logic which will need careful migration)
+*/
import Page from "../components/Page";
import React from "react";
import { useLocation, useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Skeleton from "../components/Skeleton";
import useMeProfile from "../hooks/useMeProfile";
import CenterProfile from "./Hubs/Center/CenterProfile";
import CrewProfile from "./Hubs/Crew/CrewProfile";
import ContractorProfile from "./Hubs/Contractor/ContractorProfile";
import CustomerProfile from "./Hubs/Customer/CustomerProfile";
import ProfileCard from "../components/ProfileCard";
import ManagerProfile from "./Hubs/Manager/ManagerProfile";
import getRole from "../lib/getRole";
import { useUser } from "@clerk/clerk-react";

export default function MyProfilePage() {
	const state = useMeProfile();
		const { user } = useUser();
	const { search } = useLocation();
	const params = new URLSearchParams(search);
	const { role: roleFromPath } = useParams();
	const roleOverride = (roleFromPath || params.get('role') || params.get('kind') || '').toLowerCase();
		const userRole = getRole(user);
	// Consider last known role/code saved by hubs for a better fallback when API is down
	const lastRole = (typeof localStorage !== 'undefined' ? localStorage.getItem('me:lastRole') : null) || '';
	const lastCode = (typeof localStorage !== 'undefined' ? localStorage.getItem('me:lastCode') : null) || '';
	const codeOverride = params.get('code') || lastCode || '';
	const hasOverride = !!(roleOverride || codeOverride);
		// Prefer explicit role/code overrides when present (new precedence includes userRole before lastRole, ignoring 'admin' fallbacks)
		const effectiveKind = (
			roleOverride ||
			((state.kind && state.kind !== 'admin') ? state.kind : '') ||
			((userRole && userRole !== 'admin') ? userRole : '') ||
			(lastRole && lastRole !== 'admin' ? lastRole : '') ||
			(state.kind || '')
		).toLowerCase();
		// Temporary safety override: if user reports manager but resolved as admin, keep manager
		const resolvedKind = (effectiveKind === 'admin' && userRole === 'manager') ? 'manager' : effectiveKind;
	const effectiveData = withOverrideData(effectiveKind, codeOverride, state.data);

	// Remember last non-admin role/code for the header widget routing
	useEffect(() => {
		if (state.loading || state.error) return;
		const subjectCode =
			effectiveData?.center_id || effectiveData?.crew_id || effectiveData?.contractor_id || effectiveData?.customer_id || effectiveData?.manager_id || effectiveData?.code || '';
		if (effectiveKind && effectiveKind !== 'admin' && subjectCode) {
			try {
				localStorage.setItem('me:lastRole', effectiveKind);
				localStorage.setItem('me:lastCode', subjectCode);
			} catch {}
		}
	}, [state.loading, state.error, effectiveKind, effectiveData]);

	if (state.loading && !hasOverride) return <Page title="My Profile"><Skeleton lines={8} /></Page>;

	// If there's an API error but an explicit role/code override exists, continue rendering from overrides.
	// Otherwise, show the error banner at the top of the page.
	const maybeErrorBanner = state.error && !hasOverride
		? <div style={{color:'#b91c1c'}}>Error: {state.error}</div>
		: null;

	let content: React.ReactNode = null;
	if (resolvedKind === "center") {
		const subjectCode = effectiveData?.center_id || effectiveData?.code || "";
		content = <CenterProfile subjectCode={subjectCode} subjectData={effectiveData} viewerRole="center" relationship="own-center" showHeader={false} />;
	} else if (resolvedKind === "crew") {
		content = <CrewProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "contractor") {
		content = <ContractorProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "customer") {
		content = <CustomerProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "manager") {
		// Manager profiles are served from the dedicated manager page; redirect there.
		content = <Navigate to="/hubs/manager/profile" replace />;
	} else if (resolvedKind === "admin") {
		// If we somehow fell back to admin but have a remembered non-admin context in storage
		// prefer to show a neutral card instead of a misleading admin-only message.
		const lastRole = (typeof localStorage !== 'undefined' ? localStorage.getItem('me:lastRole') : null) || '';
		if (lastRole && lastRole !== 'admin') {
			content = <ProfileCard kind={lastRole as any} data={effectiveData} />;
		} else {
			content = <div className="ui-card" style={{padding:16}}>Admin profile does not have a dedicated template yet.</div>;
		}
	}

	// DEBUG instrumentation (extended)
	try { console.debug('[MyProfile debug]', { 
		stateKind: state.kind,
		stateDataRole: (state as any)?.data?.role,
		stateDataKind: (state as any)?.data?.kind,
		roleOverride, lastRole, lastCode, codeOverride,
		userRole, effectiveKind, resolvedKind, resolvedKindFixApplied: (effectiveKind !== resolvedKind),
		effectiveDataKeys: Object.keys(effectiveData||{}).slice(0,12)
	}); } catch {}
	return (
		<Page title="My Profile">
			{maybeErrorBanner}
			{content || <div className="ui-card" style={{padding:16}}>No profile available.</div>}
		</Page>
	);
}

// Build minimal data if overrides are present, falling back to existing data
function withOverrideData(kind: string, code: string, data: any) {
	const d = data || {};
	const c = code || d.code || '';
	switch (kind) {
		case 'center':
			return { center_id: c || d.center_id, code: c || d.code, center_name: d.center_name || d.name || 'Center Demo', name: d.name };
		case 'crew':
			return { crew_id: c || d.crew_id, code: c || d.code, name: d.name || 'Crew Demo' };
		case 'contractor':
			return { contractor_id: c || d.contractor_id, code: c || d.code, company_name: d.company_name || 'Contractor Demo' };
		case 'customer':
			return { customer_id: c || d.customer_id, code: c || d.code, company_name: d.company_name || 'Customer Demo' };
		case 'manager':
			return { manager_id: c || d.manager_id, code: c || d.code, name: d.name || 'Manager Demo' };
		case 'admin':
		default:
			return d;
	}
}

/*
// MANAGER_BRANCH_EXTRACT

/* Extracted manager-only rendering snippet (for analysis). This is a verbatim extraction of the code path that renders when resolvedKind === 'manager'. Supporting helper `withOverrideData` is defined above and is referenced for `effectiveData`.

const resolvedKind = 'manager';
const effectiveData = withOverrideData('manager', codeOverride || '', state.data);

let content: React.ReactNode = null;
if (resolvedKind === "manager") {
	content = <ManagerProfile data={effectiveData} />;
}

// Notes:
// - `effectiveData` should provide { manager_id, code, name } minimal shape.
// - This snippet excludes other roles and error handling; it assumes `state` and `codeOverride` are in-scope as in the original file.
*/

// MANAGER_PROFILE_FIELD_USAGE // FieldsRead (field -> lineNumbers after adding TRACE comment): manager_id: [78, 121], name: [78, 121], code: [36, 78, 121], center_id: [36], crew_id: [36], contractor_id: [36], customer_id: [36] // DownstreamPropsPassed: data -> ManagerProfile (prop name: data) // UnusedComputations: none
