import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Page from '../../../components/Page';
import useMeProfile from '../../../hooks/useMeProfile';
import NewsPreview from '../../../components/NewsPreview';

// Simple hub card component for consistency with Manager hub style
function NavCard({ to, title, subtitle }: { to: string; title: string; subtitle?: string }) {
  return (
    <Link to={to} className="hub-card ui-card" style={{ textAlign: 'left', padding: 16, width: '100%', textDecoration:'none' }}>
      <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>}
    </Link>
  );
}

export default function CenterHub() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const { username = '' } = useParams();
  const rawCode = storedCode || state.data?.center_id || state.data?.code || 'ctr-000';
  const code = String(rawCode);
  const name = state.data?.name || 'Center Demo';

  useEffect(() => {
  if (!state.loading && !state.error && code && !['center','ctr-000'].includes(code)) {
      try {
        sessionStorage.setItem('me:lastRole', 'center');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const base = `/${username}/hub`;

  if (state.loading)
    return (
      <Page title="Center Hub" right={<LogoutButton navigate={navigate} />}>
        <div className="animate-pulse" style={{ padding: 16 }}>Loading center hub…</div>
      </Page>
    );
  if (state.error)
    return (
      <Page title="Center Hub" right={<LogoutButton navigate={navigate} />}>
        <div style={{ padding: 16, color: '#b91c1c' }}>Error: {state.error}</div>
      </Page>
    );

  return (
    <Page title="Center Hub" right={<LogoutButton navigate={navigate} />}>
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>Welcome, {name} ({code})!</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
  <NavCard to={`${base}/profile`} title="Profile" subtitle="View profile" />
  <NavCard to={`${base}/services`} title="Services" subtitle="Active services" />
  <NavCard to={`${base}/jobs`} title="Jobs" subtitle="Recent jobs" />
  <NavCard to={`${base}/crew`} title="Crew" subtitle="Assigned crew" />
  <NavCard to={`${base}/reports`} title="Reports" subtitle="Performance & logs" />
  <NavCard to={`${base}/documents`} title="Documents" subtitle="Forms & files" />
  <NavCard to={`${base}/support`} title="Support" subtitle="Help & contact" />
      </div>
      <div style={{ marginTop: 24 }}>
        <NewsPreview code={code} />
      </div>
    </Page>
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
