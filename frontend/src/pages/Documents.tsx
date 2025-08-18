import Page from "../components/Page";
import useMeProfile from "../hooks/useMeProfile";
import { deriveCodeFrom, displayNameFrom } from "../utils/profileCode";
import Skeleton from "../components/Skeleton";

export default function DocumentsPage() {
  const state = useMeProfile();
  if (state.loading) return <Page title="Documents"><Skeleton lines={6} /></Page>;
  if (state.error) return <Page title="Documents"><div style={{color:'#b91c1c'}}>Error: {state.error}</div></Page>;
  const code = deriveCodeFrom(state.kind, state.data);
  const name = displayNameFrom(state.kind, state.data) || "";

  return (
    <Page title="Documents">
      <div style={{color:'#374151', marginBottom:12}}>Hello {name} ({code || 'ID'}). Documents are filtered to your account.</div>
      <div className="ui-card">
        <div className="title">Documents (coming soon)</div>
        <div style={{color:'#6b7280'}}>Contracts, MSAs, COIs, compliance files tied to your customers/centers.</div>
      </div>
    </Page>
  );
}
