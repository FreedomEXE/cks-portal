import Page from '../../../components/Page';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useMeProfile from '../../../hooks/useMeProfile';
import Skeleton from '../../../components/Skeleton';
import NewsPreview from '../../../components/NewsPreview';
import HubLink from '../../../components/ui/HubLink';
import React, { useEffect } from 'react';

export default function ManagerHub() {
  const navigate = useNavigate();
  const state = useMeProfile();
  const { username = '' } = useParams();
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const rawCode = storedCode || (state.data as any)?.manager_id || (state.data as any)?.code || 'mgr-000';
  const code = String(rawCode);
  const name = (state.data as any)?.name || 'Manager';

  useEffect(() => {
    if (!state.loading && !state.error && code && code !== 'mgr-000') {
      try {
        sessionStorage.setItem('me:lastRole', 'manager');
        sessionStorage.setItem('me:lastCode', code);
      } catch {}
    }
  }, [state.loading, state.error, code]);

  if (state.loading) return <Page title={'Manager Hub'}><Skeleton lines={6} /></Page>;
  const errorBanner = state.error ? <div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div> : null;

  return (
    <Page
      title={'Manager Hub'}
      right={
        <button
          className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
            aria-label="Log out"
            title="Log out"
        >
          Log out
        </button>
      }
    >
      {errorBanner}
  <div style={{fontSize:14, color:'#374151', marginTop:4}}>Welcome, {name} ({code})!</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
        <NavCard to={`/${username}/hub/profile`} label="Profile" />
        <NavCard to={`/${username}/hub/centers`} label="Centers" />
        <NavCard to={`/${username}/hub/services`} label="Services" />
        <NavCard to={`/${username}/hub/jobs`} label="Jobs" />
        <NavCard to={`/${username}/hub/reports`} label="Reports" />
        <NavCard to={`/${username}/hub/documents`} label="Documents" />
        <NavCard to={`/${username}/hub/support`} label="Support" />
      </div>
      <div className="ui-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="title">News & Updates</div>
          <Link to={`/${username}/hub/news`} className="ui-button" style={{ padding: '10px 16px', fontSize: 14 }}>View all</Link>
        </div>
        <NewsPreview code={code} />
      </div>
    </Page>
  );
}

function NavCard({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="hub-card ui-card">
      <div className="title">{label}</div>
    </Link>
  );
}
