import Page from "../components/Page";
import useMeProfile from "../hooks/useMeProfile";
import { deriveCodeFrom, displayNameFrom } from "../utils/profileCode";
import Skeleton from "../components/Skeleton";

export default function SupportPage() {
  const state = useMeProfile();
  if (state.loading) return <Page title="Support"><Skeleton lines={6} /></Page>;
  if (state.error) return <Page title="Support"><div style={{color:'#b91c1c'}}>Error: {state.error}</div></Page>;
  const code = deriveCodeFrom(state.kind, state.data);
  const name = displayNameFrom(state.kind, state.data) || "";

  return (
    <Page title="Support">
      <div style={{color:'#374151', marginBottom:12}}>Hello {name} ({code || 'ID'}). Support tickets and requests will be filtered to your account.</div>
      <div className="ui-card">
        <div className="title">Support (coming soon)</div>
        <div style={{color:'#6b7280'}}>Submit and track requests to CKS. This will be scoped to your contractor/customers/centers.</div>
      </div>
    </Page>
  );
}
