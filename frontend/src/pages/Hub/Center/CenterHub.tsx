import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../../../components/Page';
import useMeProfile from '../../../hooks/useMeProfile';
import NewsPreview from '../../../components/NewsPreview';

// Simple hub card component for consistency with Manager hub style
function HubCard({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="hub-card ui-card" style={{ textAlign: 'left', padding: 16, width: '100%', cursor: 'pointer' }}>
      <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>}
    </button>
  );
}

export default function CenterHub() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const code = state.data?.center_id || state.data?.code || 'center';
  const name = state.data?.name || 'Center';

  useEffect(() => {
    if (!state.loading && !state.error && code) {
      try {
        sessionStorage.setItem('me:lastRole', 'center');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const handleNavigation = (path: string) => navigate(`/${code}/hub/${path}`);

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
        <HubCard title="Profile" subtitle="View profile" onClick={() => handleNavigation('profile')} />
        <HubCard title="Services" subtitle="Active services" onClick={() => handleNavigation('services')} />
        <HubCard title="Jobs" subtitle="Recent jobs" onClick={() => handleNavigation('jobs')} />
        <HubCard title="Crew" subtitle="Assigned crew" onClick={() => handleNavigation('crew')} />
        <HubCard title="Reports" subtitle="Performance & logs" onClick={() => handleNavigation('reports')} />
        <HubCard title="Documents" subtitle="Forms & files" onClick={() => handleNavigation('documents')} />
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
