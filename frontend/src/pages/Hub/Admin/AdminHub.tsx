/**
 * File: AdminHub.tsx
 *
 * Description:
 *   Admin hub landing with primary navigation cards and a News & Updates summary.
 * Functionality:
 *   Computes the current hub id (username, stored code/role) and renders navigation
 *   cards to Directory, Create, Manage, Assign, Reports, and Orders.
 * Importance:
 *   Main entry surface for Admin workflows; links into the tabbed Directory and other actions.
 * Connections:
 *   Uses Page shell and HubLink UI helper; navigates with react-router.
 * Notes:
 *   The top grid omits the News & Updates card; the section below retains deep links.
 */
 /*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
 
import Page from "../../../components/Page";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useUser } from '@clerk/clerk-react';
import getRole from "../../../lib/getRole";
import useMeProfile from '../../../hooks/useMeProfile';

export default function AdminHub() {
  const navigate = useNavigate();
  const { user } = useUser() as any;
  const state = useMeProfile();
  const { username: routeUsername = '' } = useParams();
  const role = getRole(user) || '';
  const hubTitle = role === 'manager' ? 'ManagerHub' : 'AdminHub';
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const code = storedCode || (state as any)?.data?.username || routeUsername || user?.username || 'admin';
  const base = `/${routeUsername || code}/hub`;

  return (
    <Page
      title={hubTitle}
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
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>Welcome, Admin ({code})!</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
        <NavCard to={`${base}/directory`} label="Directory" />
        <NavCard to={`${base}/create`} label="Create" />
        <NavCard to={`${base}/manage`} label="Manage" />
        <NavCard to={`${base}/assign`} label="Assign" />
        <NavCard to={`${base}/orders`} label="Orders" />
        <NavCard to={`${base}/reports`} label="Reports" />
      </div>
      <div className="ui-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="title">News & Updates</div>
          <Link to={`${base}/news`} className="ui-button" style={{ padding: '10px 16px', fontSize: 14 }}>View all</Link>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          <li><Link to={`${base}/news`} style={{ textDecoration: 'none', color: '#111827' }}>• Service pricing model updated — review minimums</Link></li>
          <li><Link to={`${base}/news`} style={{ textDecoration: 'none', color: '#111827' }}>• Training schedules posted for Q3</Link></li>
          <li><Link to={`${base}/news`} style={{ textDecoration: 'none', color: '#111827' }}>• New supply SKUs added to warehouses</Link></li>
        </ul>
        <div style={{ marginTop: 12 }}>
          <Link to={`${base}/news`} className="ui-button" style={{ padding: '6px 10px', fontSize: 12 }}>3 unread updates</Link>
        </div>
      </div>
    </Page>
  );
}

function NavCard({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="hub-card ui-card" style={{ textDecoration: 'none', padding: 16 }}>
      <div className="title">{label}</div>
    </Link>
  );
}
