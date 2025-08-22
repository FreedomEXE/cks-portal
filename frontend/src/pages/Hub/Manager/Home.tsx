/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Manager Hub)
 * Template shared by all Linked Manager User ID's
 * 
 * Description: Landing page for manager users with navigation dashboard
 * Function: Displays welcome message, navigation cards, and news preview
 * Importance: High - Primary navigation interface for manager users
 * Connects to: Page component, useMeProfile hook, NewsPreview, navigation routes
 * 
 * Notes: Stores role and code in sessionStorage for navigation context.
 *        Handles loading and error states from profile data.
 *        Navigation cards link to various manager features.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Page from '../../../components/Page';
import useMeProfile from '../../../hooks/useMeProfile';
import NewsPreview from '../../../components/NewsPreview';

function NavCard({ to, title, subtitle }: { to: string; title: string; subtitle?: string }) {
  return (
    <Link to={to} className="hub-card ui-card" style={{ textAlign: 'left', padding: 16, width: '100%', textDecoration:'none' }}>
      <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>}
    </Link>
  );
}

function LogoutButton({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <button
      className="ui-button"
      style={{ padding: '10px 16px', fontSize: 14 }}
      onClick={() => navigate('/logout')}
      aria-label="Log out"
      title="Log out"
    >
      Log out
    </button>
  );
}

export default function ManagerHome() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const { username = '' } = useParams();
  
  // Get manager code and name from profile data
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const rawCode = storedCode || state.data?.manager_id || state.data?.code || 'mgr-000';
  const code = String(rawCode);
  const name = state.data?.name || 'Manager Demo';

  // Store role and code in sessionStorage for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['manager','mgr-000'].includes(code)) {
      try {
        sessionStorage.setItem('me:lastRole', 'manager');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const base = `/${username}/hub`;

  // Handle loading state
  if (state.loading) {
    return (
      <Page title="Manager Hub" right={<LogoutButton navigate={navigate} />}>
        <div className="animate-pulse" style={{ padding: 16 }}>
          Loading manager hub...
        </div>
      </Page>
    );
  }
  
  // Handle error state
  if (state.error) {
    return (
      <Page title="Manager Hub" right={<LogoutButton navigate={navigate} />}>
        <div style={{ padding: 16, color: '#b91c1c' }}>
          Error: {state.error}
        </div>
      </Page>
    );
  }

  return (
    <Page title="Manager Hub" right={<LogoutButton navigate={navigate} />}>
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>
        Welcome, {name} ({code})!
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
        <NavCard to={`${base}/profile`} title="Profile" subtitle="My profile" />
        <NavCard to={`${base}/contractors`} title="Contractors" subtitle="Manage contractors" />
        <NavCard to={`${base}/centers`} title="Centers" subtitle="Territory centers" />
        <NavCard to={`${base}/crew`} title="Crew" subtitle="Crew oversight" />
        <NavCard to={`${base}/services`} title="Services" subtitle="Service management" />
        <NavCard to={`${base}/reports`} title="Reports" subtitle="Territory reports" />
        <NavCard to={`${base}/documents`} title="Documents" subtitle="Contracts & files" />
        <NavCard to={`${base}/support`} title="Support" subtitle="Help & contact" />
      </div>
      
      <div style={{ marginTop: 24 }}>
        <NewsPreview code={code} />
      </div>
    </Page>
  );
}