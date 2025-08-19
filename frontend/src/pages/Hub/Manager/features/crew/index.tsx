import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Page from '../../../../../components/Page';
import AdminTable from '../../../../../components/AdminTable';
import { apiFetch, buildUrl } from '../../../../../lib/apiBase';

export type ManagerCrew = {
  crew_id: string;
  name?: string;
  status?: string;
  role?: string;
  email?: string;
  phone?: string;
};

async function fetchCrew(signal?: AbortSignal): Promise<ManagerCrew[]> {
  const url = buildUrl('/manager/crew'); // TODO: confirm endpoint
  const res = await apiFetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? data : [];
}

async function fetchCrewMember(id: string, signal?: AbortSignal): Promise<ManagerCrew | null> {
  const url = buildUrl(`/manager/crew/${encodeURIComponent(id)}`);
  const res = await apiFetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data && typeof data === 'object' ? data as ManagerCrew : null;
}

function useCrew() {
  const [rows, setRows] = useState<ManagerCrew[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const ac = new AbortController(); (async () => { try { setLoading(true); setError(null); setRows([]); const data = await fetchCrew(ac.signal); setRows(data); } catch (e: any){ if(!ac.signal.aborted) setError(e?.message||String(e)); } finally { if(!ac.signal.aborted) setLoading(false); }})(); return () => ac.abort(); }, []);
  return { rows, loading, error };
}

function useCrewMember(id: string | undefined) {
  const [item, setItem] = useState<ManagerCrew | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if(!id) return; const ac = new AbortController(); (async () => { try { setLoading(true); setError(null); setItem(null); const data = await fetchCrewMember(id, ac.signal); setItem(data); } catch(e:any){ if(!ac.signal.aborted) setError(e?.message||String(e)); } finally { if(!ac.signal.aborted) setLoading(false);} })(); return () => ac.abort(); }, [id]);
  return { item, loading, error };
}

const crewColumns = [
  { key: 'crew_id', label: 'Crew ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'role', label: 'Role' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

function CrewList() {
  const { rows, loading, error } = useCrew();
  return (
    <Page title="Crew">
      {error && <div style={{color:'#b91c1c', padding:8}}>Error: {error}</div>}
      <AdminTable columns={crewColumns as any} rows={rows} loading={loading} getKey={(r: any) => r.crew_id} />
    </Page>
  );
}

function CrewDetail() {
  const { id } = useParams();
  const { item, loading, error } = useCrewMember(id);
  return (
    <Page title={item?.name || 'Crew Member'}>
      {loading && <div style={{color:'#6b7280'}}>Loading…</div>}
      {error && <div style={{color:'#b91c1c'}}>Error: {error}</div>}
      {item && (
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><div className="text-ink-500">Crew ID</div><div className="font-medium">{item.crew_id}</div></div>
          <div><div className="text-ink-500">Name</div><div className="font-medium">{item.name}</div></div>
          <div><div className="text-ink-500">Status</div><div className="font-medium">{item.status || '—'}</div></div>
          <div><div className="text-ink-500">Role</div><div className="font-medium">{item.role || '—'}</div></div>
          <div><div className="text-ink-500">Email</div><div className="font-medium">{item.email || '—'}</div></div>
          <div><div className="text-ink-500">Phone</div><div className="font-medium">{item.phone || '—'}</div></div>
        </div>
      )}
    </Page>
  );
}

export default function CrewRouter() {
  return (
    <Routes>
      <Route index element={<CrewList />} />
      <Route path=":id" element={<CrewDetail />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
