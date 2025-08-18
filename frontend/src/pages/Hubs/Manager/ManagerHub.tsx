// ManagerHub: simplified template using me-profile hook
// Change summary (Aug 2025): Removed inline profile block; added top "My Profile" button linking to /me/profile.
import Page from "../../../components/Page";
import { UserButton } from '@clerk/clerk-react';
import { Link, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect } from "react";
import useMeProfile from "../../../hooks/useMeProfile";
import { deriveCodeFrom, displayNameFrom } from "../../../utils/profileCode";
import Skeleton from "../../../components/Skeleton";
import NewsPreview from "../../../components/NewsPreview";

function ManagerShell() {
  const state = useMeProfile();
  const code = deriveCodeFrom(state.kind, state.data);
  const name = displayNameFrom(state.kind, state.data) || "Name";
  const codeOrPlaceholder = code || "ID";

  useEffect(() => {
    if (state.loading || state.error) return;
    if (code) {
      try { localStorage.setItem('me:lastRole', 'manager'); localStorage.setItem('me:lastCode', code); } catch {}
    }
  }, [state.loading, state.error, code]);

  if (state.loading) return <Page title={"MyHub"}><Skeleton lines={6} /></Page>;
  const errorBanner = state.error ? <div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div> : null;
  return (
  <Page title={"MyHub"} right={<UserButton afterSignOutUrl="/login" />}> 
      {errorBanner}
      <div style={{fontSize:14, color:'#374151', marginTop:4}}>Welcome, {name} ({codeOrPlaceholder})!</div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
  <Link to="profile" className="ui-button">My Profile</Link>
  <Link to="centers" className="ui-button">My Centers</Link>
        <Link to="services" className="ui-button">My Services</Link>
        <Link to="jobs" className="ui-button">My Jobs</Link>
        <Link to="reports" className="ui-button">My Reports</Link>
        <Link to="documents" className="ui-button">My Documents</Link>
        <Link to="support" className="ui-button">My Support</Link>
      </div>
      <NewsPreview code={code} />
  </Page>
  );
}

// Minimal child route components: reuse existing ManagerHub content for profile index
function ManagerProfileShim() {
  return <ManagerShell />;
}

// Export routes so App can mount /hubs/manager/*
export default function ManagerHubRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ManagerShell />}>
        <Route index element={<ManagerProfileShim />} />
        <Route path="profile" element={<ManagerProfileShim />} />
        <Route path="centers" element={<div style={{padding:20}}>Centers (legacy placeholder)</div>} />
        <Route path="services" element={<div style={{padding:20}}>Services (legacy placeholder)</div>} />
        <Route path="jobs" element={<div style={{padding:20}}>Jobs (legacy placeholder)</div>} />
        <Route path="reports" element={<div style={{padding:20}}>Reports (legacy placeholder)</div>} />
        <Route path="documents" element={<div style={{padding:20}}>Documents (legacy placeholder)</div>} />
        <Route path="support" element={<div style={{padding:20}}>Support (legacy placeholder)</div>} />
      </Route>
    </Routes>
  );
}
