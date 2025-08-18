import { useEffect, useState } from "react";
import Page from "../components/Page";
import AdminTable from "../components/AdminTable";
import useMyCode from "../hooks/useMyCode";
import { buildUrl } from "../lib/apiBase";

export default function MyJobsPage() {
  const { loading, error, code } = useMyCode();
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errJobs, setErrJobs] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!code || loading || error) return;
    (async () => {
      try {
        setLoadingJobs(true);
        setErrJobs(null);
        const res = await fetch(buildUrl("/admin/jobs", { q: code, limit: 200, offset: 0 }), { credentials: 'include' });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || `Jobs HTTP ${res.status}`);
        setJobs(Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : []);
      } catch (e: any) {
        setErrJobs(e?.message || String(e));
        setJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    })();
  }, [code, loading, error]);

  if (loading) return <Page title="My Jobs"><div>Loading…</div></Page>;
  if (error) return <Page title="My Jobs"><div style={{color:'#b91c1c'}}>Error: {error}</div></Page>;
  if (!code) return <Page title="My Jobs"><div>No profile code available.</div></Page>;

  return (
    <Page title="My Jobs">
      {errJobs ? <div style={{color:'#b91c1c', marginBottom:12}}>Error: {errJobs}</div> : null}
      <AdminTable
        loading={loadingJobs}
        columns={[
          { key: 'job_id', label: 'Job ID' },
          { key: 'service_id', label: 'Service ID' },
          { key: 'center_id', label: 'Center ID' },
          { key: 'contractor_id', label: 'Contractor ID' },
          { key: 'customer_id', label: 'Customer ID' },
          { key: 'manager_id', label: 'Manager ID' },
          { key: 'crew_ids', label: 'Crew IDs' },
          { key: 'status', label: 'Status' },
          { key: 'scheduled_date', label: 'Scheduled Date' },
          { key: 'one_time_charge', label: 'One-Time Charge' },
          { key: 'net_profit', label: 'Net Profit' },
          { key: 'notes', label: 'Notes' },
        ]}
        rows={jobs}
        getKey={(r: any, i: number) => r.job_id || i}
      />
    </Page>
  );
}
