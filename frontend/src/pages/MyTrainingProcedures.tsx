import { useEffect, useState } from "react";
import Page from "../components/Page";
import AdminTable from "../components/AdminTable";
import useMyCode from "../hooks/useMyCode";
import { buildUrl } from "../lib/apiBase";

export default function MyTrainingProceduresPage() {
  const { loading, error, code } = useMyCode();
  const [loadingTP, setLoadingTP] = useState(true);
  const [errTP, setErrTP] = useState<string | null>(null);
  const [training, setTraining] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);

  useEffect(() => {
    if (!code || loading || error) return;
    (async () => {
      try {
        setLoadingTP(true);
        setErrTP(null);
        const [tRes, pRes] = await Promise.all([
          fetch(buildUrl("/admin/training", { q: code, limit: 200, offset: 0 })),
          fetch(buildUrl("/admin/procedures", { q: code, limit: 200, offset: 0 })),
        ]);
        const [tJson, pJson] = await Promise.all([tRes.json(), pRes.json()]);
        if (!tRes.ok) throw new Error(tJson?.error || `Training HTTP ${tRes.status}`);
        if (!pRes.ok) throw new Error(pJson?.error || `Procedures HTTP ${pRes.status}`);
        setTraining(Array.isArray(tJson?.items) ? tJson.items : Array.isArray(tJson) ? tJson : []);
        setProcedures(Array.isArray(pJson?.items) ? pJson.items : Array.isArray(pJson) ? pJson : []);
      } catch (e: any) {
        setErrTP(e?.message || String(e));
        setTraining([]);
        setProcedures([]);
      } finally {
        setLoadingTP(false);
      }
    })();
  }, [code, loading, error]);

  if (loading) return <Page title="My Training & Procedures"><div>Loading…</div></Page>;
  if (error) return <Page title="My Training & Procedures"><div style={{color:'#b91c1c'}}>Error: {error}</div></Page>;
  if (!code) return <Page title="My Training & Procedures"><div>No profile code available.</div></Page>;

  return (
    <Page title="My Training & Procedures">
      {errTP ? <div style={{color:'#b91c1c', marginBottom:12}}>Error: {errTP}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, margin: '8px 0 8px' }}>Training</div>
          <AdminTable
            loading={loadingTP}
            columns={[
              { key: 'training_id', label: 'Training ID' },
              { key: 'crew_id', label: 'Crew ID' },
              { key: 'service_id', label: 'Service ID' },
              { key: 'service_name', label: 'Service Name' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status' },
            ]}
            rows={training}
            getKey={(r: any, i: number) => r.training_id || i}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, margin: '8px 0 8px' }}>Procedures</div>
          <AdminTable
            loading={loadingTP}
            columns={[
              { key: 'procedure_id', label: 'Procedure ID' },
              { key: 'service', label: 'Service' },
              { key: 'type', label: 'Type' },
              { key: 'center', label: 'Center' },
              { key: 'customer', label: 'Customer' },
              { key: 'contractor', label: 'Contractor' },
            ]}
            rows={procedures}
            getKey={(r: any, i: number) => r.procedure_id || i}
          />
        </div>
      </div>
    </Page>
  );
}
