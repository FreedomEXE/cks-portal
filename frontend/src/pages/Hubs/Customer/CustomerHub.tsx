// CustomerHub: simplified using me-profile hook
// Change summary (Aug 2025):
// - Tabs moved to shared config `components/profiles/customerTabs.config`.
// - Removed inline profile block; added top "My Profile" button linking to /me/profile.
import { deriveCodeFrom, displayNameFrom } from "../../../utils/profileCode";
import Page from "../../../components/Page";
import { useEffect } from "react";
import useMeProfile from "../../../hooks/useMeProfile";
import Skeleton from "../../../components/Skeleton";
import { buildHubPath } from '../../../lib/hubRoutes';
import NewsPreview from "../../../components/NewsPreview";
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import customerTabsConfig from "../../../components/profiles/customerTabs.config";

export default function CustomerHub() {
  const state = useMeProfile();
  const code = deriveCodeFrom(state.kind, state.data);

  const name = displayNameFrom(state.kind, state.data) || "Name";
  const codeOrPlaceholder = code || "ID";
  const tabs = customerTabsConfig;

  useEffect(() => {
    if (state.loading || state.error) return;
    if (code) {
      try { localStorage.setItem('me:lastRole', 'customer'); localStorage.setItem('me:lastCode', code); } catch {}
    }
  }, [state.loading, state.error, code]);

  if (state.loading) return <Page title={"MyHub"}><Skeleton lines={6} /></Page>;
  const errorBanner = state.error ? <div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div> : null;
  return (
  <Page title={"MyHub"}> 
      {errorBanner}
      <div style={{fontSize:14, color:'#374151', marginTop:4}}>Welcome, {name} ({codeOrPlaceholder})!</div>
      <div className="ui-card" style={{ marginTop: 12, padding: 16 }}>
        <a href={`/new-request?q=${encodeURIComponent(code)}`} className="hub-card" style={{ display:'block', textDecoration:'none', textAlign:'center' }}>
          <div className="title" style={{ fontSize: 20 }}>New Request</div>
          <div style={{ color: '#6b7280' }}>Request Service • Request Job • Request Supplies • Request Products</div>
        </a>
      </div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
  <a className="ui-button" href={buildHubPath(code ? `customer/profile?role=customer&code=${encodeURIComponent(code)}` : 'customer/profile')}>My Profile</a>
        <a className="ui-button" href={`/admin/centers?q=${encodeURIComponent(code)}`}>My Centers</a>
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
