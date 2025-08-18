import { useEffect, useState } from "react";
import Page from "../components/Page";
import AdminTable from "../components/AdminTable";
import useMyCode from "../hooks/useMyCode";
import { buildUrl } from "../lib/apiBase";

export default function MyReportsPage() {
  const { loading, error, code } = useMyCode();
  const [loadingReports, setLoadingReports] = useState(true);
  const [errReports, setErrReports] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!code || loading || error) return;
    (async () => {
      try {
        setLoadingReports(true);
        setErrReports(null);
        const res = await fetch(buildUrl("/admin/reports", { q: code, limit: 200, offset: 0 }), { credentials: 'include' });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || `Reports HTTP ${res.status}`);
        setRows(Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : []);
      } catch (e: any) {
        setErrReports(e?.message || String(e));
        setRows([]);
      } finally {
        setLoadingReports(false);
      }
    })();
  }, [code, loading, error]);

  if (loading) return <Page title="My Reports"><div>Loading…</div></Page>;
  if (error) return <Page title="My Reports"><div style={{color:'#b91c1c'}}>Error: {error}</div></Page>;
  if (!code) return <Page title="My Reports"><div>No profile code available.</div></Page>;

  return (
    <Page title="My Reports">
      {errReports ? <div style={{color:'#b91c1c', marginBottom:12}}>Error: {errReports}</div> : null}
      <AdminTable
        loading={loadingReports}
        columns={[
          { key: 'report_id', label: 'Report ID' },
          { key: 'center_id', label: 'Center ID' },
          { key: 'job_id', label: 'Job ID' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Created' },
          { key: 'updated_at', label: 'Updated' },
        ]}
        rows={rows}
        getKey={(r: any, i: number) => r.report_id || i}
      />
    </Page>
  );
}
