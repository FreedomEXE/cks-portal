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
import { useNavigate } from "react-router-dom";
import { useUser } from '@clerk/clerk-react';
import HubLink from "../../../components/ui/HubLink";
import getRole from "../../../lib/getRole";
import useMeProfile from '../../../hooks/useMeProfile';

export default function AdminHub() {
  const navigate = useNavigate();
  const { user } = useUser() as any;
  const state = useMeProfile();
  const username = user?.username ?? null;
  const hubFromStorage = (typeof window !== 'undefined' ? (sessionStorage.getItem('code') || sessionStorage.getItem('role')) : null) as string | null;
  const hub = (username || hubFromStorage || 'admin').toLowerCase();
  const role = getRole(user) || '';
  const hubTitle = role === 'manager' ? 'ManagerHub' : 'AdminHub';
  const storedCode = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('me:lastCode') : '') || '';
  const code = storedCode || (state as any)?.data?.username || username || 'admin';

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
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 12 }}>
          <>
            <HubCard hub={hub} sub="directory" label="Directory" />
            <HubCard hub={hub} sub="create" label="Create" />
            <HubCard hub={hub} sub="manage" label="Manage" />
            <HubCard hub={hub} sub="assign" label="Assign" />
            <HubCard hub={hub} sub="reports" label="Reports" />
            <HubCard hub={hub} sub="orders" label="Orders" />
          </>
      </div>
      <div className="ui-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="title">News & Updates</div>
      <HubLink hub={hub} sub="news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14 }}>View all</HubLink>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          <li>
            <HubLink hub={hub} sub="news" style={{ textDecoration: 'none', color: '#111827' }}>
              • Service pricing model updated — review minimums
            </HubLink>
          </li>
          <li>
            <HubLink hub={hub} sub="news" style={{ textDecoration: 'none', color: '#111827' }}>
              • Training schedules posted for Q3
            </HubLink>
          </li>
          <li>
            <HubLink hub={hub} sub="news" style={{ textDecoration: 'none', color: '#111827' }}>
              • New supply SKUs added to warehouses
            </HubLink>
          </li>
        </ul>
        <div style={{ marginTop: 12 }}>
          <HubLink hub={hub} sub="news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12 }}>
            3 unread updates
          </HubLink>
        </div>
      </div>
    </Page>
  );
}

function HubCard({ hub, sub, label, long = false }: { hub?: string; sub?: string; label: string; long?: boolean }) {
  return (
    <HubLink hub={hub} sub={sub} className="hub-card ui-card" style={long ? { gridColumn: "1 / -1", textAlign: "center" } : undefined}>
      <div className="title">{label}</div>
    </HubLink>
  );
}
