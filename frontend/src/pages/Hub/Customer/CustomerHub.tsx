import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../../../components/Page';
import useMeProfile from '../../../hooks/useMeProfile';
import NewsPreview from '../../../components/NewsPreview';

function HubCard({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="hub-card ui-card" style={{ textAlign: 'left', padding: 16, width: '100%', cursor: 'pointer' }}>
      <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>}
    </button>
  );
}

export default function CustomerHub() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const rawCode = storedCode || state.data?.customer_id || state.data?.code || 'cus-000';
  const code = String(rawCode);
  const name = state.data?.company_name || state.data?.name || 'Customer Demo';

  useEffect(() => {
  if (!state.loading && !state.error && code && !['customer','cus-000'].includes(code)) {
      try {
        sessionStorage.setItem('me:lastRole', 'customer');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const handleNavigation = (path: string) => navigate(`/${code}/hub/${path}`);

  if (state.loading)
    return (
      <Page title="Customer Hub" right={<LogoutButton navigate={navigate} />}>
        <div className="animate-pulse" style={{ padding: 16 }}>Loading customer hub…</div>
      </Page>
    );
  if (state.error)
    return (
      <Page title="Customer Hub" right={<LogoutButton navigate={navigate} />}>
        <div style={{ padding: 16, color: '#b91c1c' }}>Error: {state.error}</div>
      </Page>
    );

  return (
    <Page title="Customer Hub" right={<LogoutButton navigate={navigate} />}>
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>Welcome, {name} ({code})!</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
        <HubCard title="Profile" subtitle="Company profile" onClick={() => handleNavigation('profile')} />
        <HubCard title="Centers" subtitle="Centers list" onClick={() => handleNavigation('centers')} />
        <HubCard title="Services" subtitle="Services" onClick={() => handleNavigation('services')} />
        <HubCard title="Jobs" subtitle="Jobs" onClick={() => handleNavigation('jobs')} />
        <HubCard title="Crew" subtitle="Crew" onClick={() => handleNavigation('crew')} />
        <HubCard title="Reports" subtitle="Reports" onClick={() => handleNavigation('reports')} />
        <HubCard title="Documents" subtitle="Docs & files" onClick={() => handleNavigation('documents')} />
        <HubCard title="Support" subtitle="Help & contact" onClick={() => handleNavigation('support')} />
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
