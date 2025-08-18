import { useEffect, useState } from "react";
import Page from "../components/Page";
import AdminTable from "../components/AdminTable";
import useMyCode from "../hooks/useMyCode";
import { buildUrl } from "../lib/apiBase";

export default function MyServicesPage() {
  const { loading, error, code } = useMyCode();
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [errSvc, setErrSvc] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!code || loading || error) return;
    (async () => {
      try {
        setLoadingSvc(true);
        setErrSvc(null);
        const res = await fetch(buildUrl("/admin/services", { q: code, limit: 200, offset: 0 }));
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || `Services HTTP ${res.status}`);
        setServices(Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : []);
      } catch (e: any) {
        setErrSvc(e?.message || String(e));
        setServices([]);
      } finally {
        setLoadingSvc(false);
      }
    })();
  }, [code, loading, error]);

  if (loading) return <Page title="My Services"><div>Loading…</div></Page>;
  if (error) return <Page title="My Services"><div style={{color:'#b91c1c'}}>Error: {error}</div></Page>;
  if (!code) return <Page title="My Services"><div>No profile code available.</div></Page>;

  return (
    <Page title="My Services">
      {errSvc ? <div style={{color:'#b91c1c', marginBottom:12}}>Error: {errSvc}</div> : null}
      <AdminTable
        loading={loadingSvc}
        columns={[
          { key: 'service_id', label: 'Service ID' },
          { key: 'service_name', label: 'Service Name' },
          { key: 'cks_cost', label: 'CKS Cost' },
          { key: 'min_charge', label: 'Min Charge' },
          { key: 'min_crew', label: 'Min Crew' },
        ]}
        rows={services}
        getKey={(r: any, i: number) => r.service_id || i}
      />
    </Page>
  );
}
