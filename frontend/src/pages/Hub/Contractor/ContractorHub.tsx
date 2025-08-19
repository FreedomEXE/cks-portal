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

export default function ContractorHub() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const rawCode = storedCode || state.data?.contractor_id || state.data?.code || 'con-000';
  const code = String(rawCode);
  const name = state.data?.company_name || state.data?.name || 'Contractor Demo';

  useEffect(() => {
  if (!state.loading && !state.error && code && !['contractor','con-000'].includes(code)) {
      try {
        sessionStorage.setItem('me:lastRole', 'contractor');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  const handleNavigation = (path: string) => navigate(`/${code}/hub/${path}`);

  if (state.loading)
    return (
      <Page title="Contractor Hub" right={<LogoutButton navigate={navigate} />}>
        <div className="animate-pulse" style={{ padding: 16 }}>Loading contractor hub…</div>
      </Page>
    );
  if (state.error)
    return (
      <Page title="Contractor Hub" right={<LogoutButton navigate={navigate} />}>
        <div style={{ padding: 16, color: '#b91c1c' }}>Error: {state.error}</div>
      </Page>
    );

  return (
    <Page title="Contractor Hub" right={<LogoutButton navigate={navigate} />}>
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>Welcome, {name} ({code})!</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
        <HubCard title="Profile" subtitle="Company profile" onClick={() => handleNavigation('profile')} />
        <HubCard title="Customers" subtitle="Customer list" onClick={() => handleNavigation('customers')} />
        <HubCard title="Centers" subtitle="Centers served" onClick={() => handleNavigation('centers')} />
        <HubCard title="Services" subtitle="Services provided" onClick={() => handleNavigation('services')} />
        <HubCard title="Crew" subtitle="Crew roster" onClick={() => handleNavigation('crew')} />
        <HubCard title="Reports" subtitle="Performance & logs" onClick={() => handleNavigation('reports')} />
        <HubCard title="Documents" subtitle="Contracts & files" onClick={() => handleNavigation('documents')} />
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
