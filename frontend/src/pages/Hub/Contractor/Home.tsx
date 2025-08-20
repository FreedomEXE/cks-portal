/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Contractor Hub)
 * Template shared by all Linked Contractor User ID's
 * 
 * Description: Landing page for contractor users with navigation dashboard
 * Function: Displays welcome message, navigation cards, and news preview
 * Importance: High - Primary navigation interface for contractor users
 * Connects to: Page component, useMeProfile hook, NewsPreview, navigation routes
 * 
 * Notes: Stores role and code in sessionStorage for navigation context.
 *        Handles loading and error states from profile data.
 *        Navigation cards link to various contractor features.
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

export default function ContractorHome() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const { username = '' } = useParams();
  
  // Get contractor code and name from profile data
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const rawCode = storedCode || state.data?.contractor_id || state.data?.code || 'con-000';
  const code = String(rawCode);
  const name = state.data?.company_name || state.data?.name || 'Contractor Demo';

  // Store role and code in sessionStorage for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['contractor','con-000'].includes(code)) {
      try {
        sessionStorage.setItem('me:lastRole', 'contractor');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const base = `/${username}/hub`;

  // Handle loading state
  if (state.loading) {
    return (
      <Page title="Contractor Hub" right={<LogoutButton navigate={navigate} />}>
        <div className="animate-pulse" style={{ padding: 16 }}>
          Loading contractor hub...
        </div>
      </Page>
    );
  }
  
  // Handle error state
  if (state.error) {
    return (
      <Page title="Contractor Hub" right={<LogoutButton navigate={navigate} />}>
        <div style={{ padding: 16, color: '#b91c1c' }}>
          Error: {state.error}
        </div>
      </Page>
    );
  }

  return (
    <Page title="Contractor Hub" right={<LogoutButton navigate={navigate} />}>
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>
        Welcome, {name} ({code})!
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
        <NavCard to={`${base}/profile`} title="Profile" subtitle="Company profile" />
        <NavCard to={`${base}/customers`} title="Customers" subtitle="Customer list" />
        <NavCard to={`${base}/centers`} title="Centers" subtitle="Centers served" />
        <NavCard to={`${base}/services`} title="Services" subtitle="Services provided" />
        <NavCard to={`${base}/crew`} title="Crew" subtitle="Crew roster" />
        <NavCard to={`${base}/reports`} title="Reports" subtitle="Performance & logs" />
        <NavCard to={`${base}/documents`} title="Documents" subtitle="Contracts & files" />
        <NavCard to={`${base}/support`} title="Support" subtitle="Help & contact" />
      </div>
      
      <div style={{ marginTop: 24 }}>
        <NewsPreview code={code} />
      </div>
    </Page>
  );
}