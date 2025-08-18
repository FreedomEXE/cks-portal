import Page from "../components/Page";
import { clearImpersonationToken } from "../utils/impersonationToken";
import { buildHubPath } from '../lib/hubRoutes';

export default function ClearImpersonation() {
  return (
    <Page title="Clear Impersonation">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
  <button onClick={() => { try { localStorage.removeItem('cks_impersonate_code'); } catch {} try { clearImpersonationToken(); } catch {} alert('Cleared'); }}>Clear local impersonation</button>
  <a href={buildHubPath('admin')}>Back to Admin Hub</a>
      </div>
    </Page>
  );
}
