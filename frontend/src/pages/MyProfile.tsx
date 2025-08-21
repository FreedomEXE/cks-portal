/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Central profile page that renders role-specific profile components
 * Function: Determines user role and displays appropriate profile view
 * Importance: Critical - Main entry point for all user profiles
 * Connects to: Hub profile components, useMeProfile hook, role detection
 * 
 * Notes: Temporary component until all hubs are fully modularized.
 *        Contains role detection fallbacks and localStorage persistence.
 *        Will be deprecated once each hub manages its own profile routing.
 */

import Page from "../components/Page";
import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import Skeleton from "../components/Skeleton";
import useMeProfile from "../hooks/useMeProfile";
import ContractorProfile from "./Hub/Contractor/Profile";
import CenterProfile from "./Hub/Center/Profile";
import CrewProfile from "./Hub/Crew/Profile";
import CustomerProfile from "./Hub/Customer/Profile";
import ProfileCard from "../components/ProfileCard";
import ManagerProfile from "./Hub/Manager/Profile/ManagerProfile";
import getRole from "../lib/getRole";
import { useUser } from "../lib/auth";

export default function MyProfilePage() {
	const { username } = useParams();
	const roleFromUsername = username?.startsWith('con-') ? 'contractor' : 
	                         username?.startsWith('ctr-') ? 'center' :
	                         username?.startsWith('crew-') ? 'crew' :
	                         username?.startsWith('cust-') ? 'customer' :
	                         username?.startsWith('mgr-') ? 'manager' : '';
	const state = useMeProfile();
	const { user } = useUser();
	const { search } = useLocation();
	const params = new URLSearchParams(search);
	const { role: roleFromPath } = useParams();
	const roleOverride = (roleFromPath || params.get('role') || params.get('kind') || '').toLowerCase();
	const userRole = getRole(user);
	const lastRole = (typeof localStorage !== 'undefined' ? localStorage.getItem('me:lastRole') : null) || '';
	const lastCode = (typeof localStorage !== 'undefined' ? localStorage.getItem('me:lastCode') : null) || '';
	const codeOverride = params.get('code') || lastCode || '';
	const hasOverride = !!(roleOverride || codeOverride);
	
	const effectiveKind = (
		roleOverride ||
		((state.kind && state.kind !== 'admin') ? state.kind : '') ||
		((userRole && userRole !== 'admin') ? userRole : '') ||
		(lastRole && lastRole !== 'admin' ? lastRole : '') ||
		(state.kind || '')
	).toLowerCase();
	
	const resolvedKind = (effectiveKind === 'admin' && userRole === 'manager') ? 'manager' : effectiveKind;
	const effectiveData = withOverrideData(effectiveKind, codeOverride, state.data);

	useEffect(() => {
		if (state.loading || state.error) return;
		const subjectCode =
			effectiveData?.center_id || effectiveData?.crew_id || effectiveData?.contractor_id || 
			effectiveData?.customer_id || effectiveData?.manager_id || effectiveData?.code || '';
		if (effectiveKind && effectiveKind !== 'admin' && subjectCode) {
			try {
				localStorage.setItem('me:lastRole', effectiveKind);
				localStorage.setItem('me:lastCode', subjectCode);
			} catch {}
		}
	}, [state.loading, state.error, effectiveKind, effectiveData]);

	if (state.loading && !hasOverride) return <Page title="My Profile"><Skeleton lines={8} /></Page>;

	const maybeErrorBanner = state.error && !hasOverride
		? <div style={{color:'#b91c1c'}}>Error: {state.error}</div>
		: null;

	let content: React.ReactNode = null;
	if (resolvedKind === "center") {
		content = <CenterProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "crew") {
		content = <CrewProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "contractor") {
		content = <ContractorProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "customer") {
		content = <CustomerProfile data={effectiveData} showHeader={false} />;
	} else if (resolvedKind === "manager") {
		content = <ManagerProfile data={effectiveData} />;
	} else if (resolvedKind === "admin") {
		const lastRole = (typeof localStorage !== 'undefined' ? localStorage.getItem('me:lastRole') : null) || '';
		if (lastRole && lastRole !== 'admin') {
			content = <ProfileCard kind={lastRole as any} data={effectiveData} />;
		} else {
			content = <div className="ui-card" style={{padding:16}}>Admin profile does not have a dedicated template yet.</div>;
		}
	}

	// Debug logging
	try { console.debug('[MyProfile debug]', { 
		stateKind: state.kind,
		roleOverride, lastRole, lastCode, codeOverride,
		userRole, effectiveKind, resolvedKind,
		effectiveDataKeys: Object.keys(effectiveData||{}).slice(0,12)
	}); } catch {}
	
	return (
		<Page title="My Profile">
			{maybeErrorBanner}
			{content || <div className="ui-card" style={{padding:16}}>No profile available.</div>}
		</Page>
	);
}

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