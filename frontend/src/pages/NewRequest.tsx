import Page from "../components/Page";
import useMeProfile from "../hooks/useMeProfile";
import { deriveCodeFrom, displayNameFrom } from "../utils/profileCode";
import Skeleton from "../components/Skeleton";
import { Link, useLocation } from "react-router-dom";

function useQueryCode(fallback?: string) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get('q') || fallback || '';
}

export default function NewRequestPage() {
  const state = useMeProfile();
  if (state.loading) return <Page title="New Request"><Skeleton lines={6} /></Page>;
  if (state.error) return <Page title="New Request"><div style={{color:'#b91c1c'}}>Error: {state.error}</div></Page>;
  const derived = deriveCodeFrom(state.kind, state.data);
  const code = useQueryCode(derived);
  const name = displayNameFrom(state.kind, state.data) || '';

  const cards = [
    { to: `/create/service-request?q=${encodeURIComponent(code)}`, label: 'Request Service', hint: 'Ask CKS to perform a service at a center' },
    { to: `/create/job-request?q=${encodeURIComponent(code)}`, label: 'Request Job', hint: 'One-time or project work beyond routine services' },
    { to: `/create/supplies-request?q=${encodeURIComponent(code)}`, label: 'Request Supplies', hint: 'Order supplies delivered to a center' },
    { to: `/create/products-request?q=${encodeURIComponent(code)}`, label: 'Request Products', hint: 'Purchase products or equipment' },
  ];

  return (
    <Page title="New Request">
      <div style={{color:'#374151', marginBottom:12}}>For {name} ({code || 'ID'}). Choose what you want to request:</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="hub-card ui-card" style={{ textDecoration: 'none' }}>
            <div className="title">{c.label}</div>
            <div style={{ color: '#6b7280' }}>{c.hint}</div>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 16, color:'#6b7280' }}>
        Note: These are billable requests outside the existing contract. CKS will scope and confirm pricing.
      </div>
    </Page>
  );
}
