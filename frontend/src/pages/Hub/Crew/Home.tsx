/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Crew Hub)
 * Template shared by all Linked Crew User ID's
 * 
 * Description: Landing page for crew members with navigation dashboard
 * Function: Displays welcome message, navigation cards, and news preview
 * Importance: High - Primary navigation interface for crew members
 * Connects to: Page component, useMeProfile hook, NewsPreview, navigation routes
 * 
 * Notes: Stores role and code in sessionStorage for navigation context.
 *        Handles loading and error states from profile data.
 *        Navigation cards link to various crew features.
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

export default function CrewHome() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const { username = '' } = useParams();
  
  // Get crew code and name from profile data
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const rawCode = storedCode || state.data?.crew_id || state.data?.code || 'crw-000';
  const code = String(rawCode);
  const name = state.data?.full_name || state.data?.name || 'Crew Demo';

  // Store role and code in sessionStorage for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['crew','crw-000'].includes(code)) {
      try {
        sessionStorage.setItem('me:lastRole', 'crew');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const base = `/${username}/hub`;

  // Handle loading state
  if (state.loading) {
    return (
      <Page title="Crew Hub" right={<LogoutButton navigate={navigate} />}>
        <div className="animate-pulse" style={{ padding: 16 }}>
          Loading crew hub...
        </div>
      </Page>
    );
  }
  
  // Handle error state
  if (state.error) {
    return (
      <Page title="Crew Hub" right={<LogoutButton navigate={navigate} />}>
        <div style={{ padding: 16, color: '#b91c1c' }}>
          Error: {state.error}
        </div>
      </Page>
    );
  }

  return (
    <Page title="Crew Hub" right={<LogoutButton navigate={navigate} />}>
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>
        Welcome, {name} ({code})!
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
        <NavCard to={`${base}/profile`} title="Profile" subtitle="My profile" />
        <NavCard to={`${base}/centers`} title="Centers" subtitle="Assigned centers" />
        <NavCard to={`${base}/schedule`} title="Schedule" subtitle="My schedule" />
        <NavCard to={`${base}/tasks`} title="Tasks" subtitle="Today's tasks" />
        <NavCard to={`${base}/training`} title="Training" subtitle="Training modules" />
        <NavCard to={`${base}/supplies`} title="Supplies" subtitle="Request supplies" />
        <NavCard to={`${base}/timesheet`} title="Timesheet" subtitle="Clock in/out" />
        <NavCard to={`${base}/support`} title="Support" subtitle="Help & contact" />
      </div>
      
      <div style={{ marginTop: 24 }}>
        <NewsPreview code={code} />
      </div>
    </Page>
  );
}