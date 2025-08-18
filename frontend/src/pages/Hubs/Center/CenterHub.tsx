/**
 * CenterHub.tsx
 *
 * Purpose:
 * - Center landing hub. Shows profile info and integrates the reports subsystem (create + list).
 *
 * Key behaviors:
 * - Loads the current user's center context based on identity or an override code (?code=) for dev/testing.
 * - Renders a single-center list using CentersListForProfile.
 * - Mounts NewReportForm and ReportsForCenter with the derived center code.
 */
// CenterHub: simplified and standardized
// Change summary (Aug 2025):
// - Uses shared centerTabsConfig + visibility policy (tabs not inline).
// - Removed inline profile block; added top "My Profile" button linking to /me/profile.
import useMeProfile from "../../../hooks/useMeProfile";
import { deriveCodeFrom, displayNameFrom } from "../../../utils/profileCode";
import Page from "../../../components/Page";
import { useEffect } from "react";
import Skeleton from "../../../components/Skeleton";
import NewsPreview from "../../../components/NewsPreview";
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import centerTabsConfig from "../../../components/profiles/centerTabs.config";
import { getCenterVisibility } from "../../../components/profiles/centerVisibility";
import { buildHubPath } from '../../../lib/hubRoutes';

export default function CenterHub() {
  const state = useMeProfile();
  // For center hub, derive the center code. Allow override via query string for testing
  const code = deriveCodeFrom(state.kind, state.data);
  const centerId = code;
  const name = displayNameFrom(state.kind, state.data) || "Name";

  // Owner (center) gets full allowed fields; still pass through policy for consistency
  const { allowed } = getCenterVisibility({ viewerRole: "center", subjectCode: code, relationship: "own-center" });
  const tabs = centerTabsConfig.map(tab => ({
    label: tab.label,
    columns: tab.columns.filter(c => allowed.has(c.key)),
  }));

  // Remember this role/code (guard inside the effect so hooks order stays stable)
  useEffect(() => {
    if (state.loading || state.error) return;
    if (code) {
      try { localStorage.setItem('me:lastRole', 'center'); localStorage.setItem('me:lastCode', code); } catch {}
    }
  }, [state.loading, state.error, code]);

  if (state.loading) return <Page title={"MyHub"}><Skeleton lines={6} /></Page>;
  const errorBanner = state.error ? <div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div> : null;

  return (
  <Page title={"MyHub"}> 
  {errorBanner}
  <div style={{fontSize:14, color:'#374151', marginTop:4}}>Welcome, {name} ({centerId || 'ID'})!</div>
      <div className="ui-card" style={{ marginTop: 12, padding: 16 }}>
        <a href={`/new-request?q=${encodeURIComponent(code)}`} className="hub-card" style={{ display:'block', textDecoration:'none', textAlign:'center' }}>
          <div className="title" style={{ fontSize: 20 }}>New Request</div>
          <div style={{ color: '#6b7280' }}>Request Service • Request Job • Request Supplies • Request Products</div>
        </a>
      </div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
  <a className="ui-button" href={buildHubPath(code ? `center/profile?role=center&code=${encodeURIComponent(code)}` : 'center/profile')}>My Profile</a>
        <a className="ui-button" href={`/me/services`}>My Services</a>
        <a className="ui-button" href={`/me/jobs`}>My Jobs</a>
        <a className="ui-button" href={`/me/reports`}>My Reports</a>
        <a className="ui-button" href={`/documents?q=${encodeURIComponent(code)}`}>My Documents</a>
        <a className="ui-button" href={`/support?q=${encodeURIComponent(code)}`}>My Support</a>
      </div>

  {/* Simplified hub: only top buttons and News & Updates */}
  <NewsPreview code={code} />
  </Page>
  );
}
