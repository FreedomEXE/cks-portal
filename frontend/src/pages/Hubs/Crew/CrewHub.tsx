// CrewHub: simplified, uses unified me-profile hook
// Change summary (Aug 2025):
// - Tabs moved to shared config `components/profiles/crewTabs.config`.
// - Removed inline profile block; added top "My Profile" button linking to /me/profile.
import { deriveCodeFrom, displayNameFrom } from "../../../utils/profileCode";
import Page from "../../../components/Page";
import { useEffect } from "react";
import useMeProfile from "../../../hooks/useMeProfile";
import Skeleton from "../../../components/Skeleton";
import { Link } from "react-router-dom";
import { buildHubPath } from '../../../lib/hubRoutes';
import NewsPreview from "../../../components/NewsPreview";
import ProfileCard from "../../../components/ProfileCard";
import ProfileTabs from "../../../components/ProfileTabs";
import crewTabsConfig from "../../../components/profiles/crewTabs.config";

export default function CrewHub() {
  const state = useMeProfile();
  const code = deriveCodeFrom(state.kind, state.data);

  const cards = [
    { to: "/me/centers", label: "My Centers" },
    { to: "/me/services", label: "My Services" },
    { to: "/me/jobs", label: "My Jobs" },
    { to: "/me/reports", label: "My Reports" },
    { to: `/documents?q=${encodeURIComponent(code)}`, label: "My Documents" },
    { to: `/support?q=${encodeURIComponent(code)}`, label: "My Support" },
  ];

  const name = displayNameFrom(state.kind, state.data) || "Name";
  const codeOrPlaceholder = code || "ID";
  // Tabs now sourced from shared config
  const tabs = crewTabsConfig;

  useEffect(() => {
    if (state.loading || state.error) return;
    if (code) {
      try { localStorage.setItem('me:lastRole', 'crew'); localStorage.setItem('me:lastCode', code); } catch {}
    }
  }, [state.loading, state.error, code]);

  if (state.loading) return <Page title={"MyHub"}><Skeleton lines={6} /></Page>;
  const errorBanner = state.error ? <div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div> : null;
  return (
  <Page title={"MyHub"}> 
      {errorBanner}
      <div style={{fontSize:14, color:'#374151', marginTop:4}}>Welcome, {name} ({codeOrPlaceholder})!</div>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
  <a href={buildHubPath(code ? `crew/profile?role=crew&code=${encodeURIComponent(code)}` : 'crew/profile')} className="ui-card" style={{ textDecoration: "none" }}>
          <div style={{ fontWeight: 700 }}>My Profile</div>
        </a>
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="ui-card" style={{ textDecoration: "none" }}>
            <div style={{ fontWeight: 700 }}>{c.label}</div>
          </Link>
        ))}
      </div>

  <NewsPreview code={code} showUnread={false} />
  </Page>
  );
}
