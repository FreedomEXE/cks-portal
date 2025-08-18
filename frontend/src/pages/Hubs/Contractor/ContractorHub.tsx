// ContractorHub: simplified using me-profile hook
// Change summary (Aug 2025):
// - Tabs moved to shared config `components/profiles/contractorTabs.config`.
// - Removed inline profile block; added top "My Profile" button linking to /me/profile.
import { deriveCodeFrom, displayNameFrom } from "../../../utils/profileCode";
import Page from "../../../components/Page";
import { useEffect } from "react";
import useMeProfile from "../../../hooks/useMeProfile";
import Skeleton from "../../../components/Skeleton";
import NewsPreview from "../../../components/NewsPreview";
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import contractorTabsConfig from "../../../components/profiles/contractorTabs.config";
import { buildHubPath } from '../../../lib/hubRoutes';

export default function ContractorHub() {
  const state = useMeProfile();
  const code = deriveCodeFrom(state.kind, state.data);

  const name = displayNameFrom(state.kind, state.data) || "Name";
  const codeOrPlaceholder = code || "ID";
  const tabs = contractorTabsConfig;

  useEffect(() => {
    if (state.loading || state.error) return;
    if (code) {
      try { localStorage.setItem('me:lastRole', 'contractor'); localStorage.setItem('me:lastCode', code); } catch {}
    }
  }, [state.loading, state.error, code]);

  if (state.loading) return <Page title={"MyHub"}><Skeleton lines={6} /></Page>;
  const errorBanner = state.error ? <div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div> : null;
  return (
  <Page title={"MyHub"}> 
      {errorBanner}
      <div style={{fontSize:14, color:'#374151', marginTop:4}}>Welcome, {name} ({codeOrPlaceholder})!</div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
  <a className="ui-button" href={buildHubPath(code ? `contractor/profile?role=contractor&code=${encodeURIComponent(code)}` : 'contractor/profile')}>My Profile</a>
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
