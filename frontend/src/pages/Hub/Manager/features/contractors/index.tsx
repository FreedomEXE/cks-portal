import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Page from '../../../../../components/Page';
import AdminTable from '../../../../../components/AdminTable';
import { apiFetch, buildUrl } from '../../../../../lib/apiBase';

export type ManagerContractor = {
  contractor_id: string;
  company_name?: string;
  main_contact?: string;
  phone?: string;
  email?: string;
  num_customers?: number;
};

async function fetchContractors(signal?: AbortSignal): Promise<ManagerContractor[]> {
  const url = buildUrl('/manager/contractors'); // TODO: adjust if backend differs
  const res = await apiFetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? data : [];
}

async function fetchContractor(id: string, signal?: AbortSignal): Promise<ManagerContractor | null> {
  const url = buildUrl(`/manager/contractors/${encodeURIComponent(id)}`);
  const res = await apiFetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data && typeof data === 'object' ? data as ManagerContractor : null;
}

function useContractors() {
  const [rows, setRows] = useState<ManagerContractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const ac = new AbortController(); (async () => { try { setLoading(true); setError(null); setRows([]); const data = await fetchContractors(ac.signal); setRows(data); } catch (e: any){ if(!ac.signal.aborted) setError(e?.message||String(e)); } finally { if(!ac.signal.aborted) setLoading(false); }})(); return () => ac.abort(); }, []);
  return { rows, loading, error };
}

function useContractor(id: string | undefined) {
  const [item, setItem] = useState<ManagerContractor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if(!id) return; const ac = new AbortController(); (async () => { try { setLoading(true); setError(null); setItem(null); const data = await fetchContractor(id, ac.signal); setItem(data); } catch(e:any){ if(!ac.signal.aborted) setError(e?.message||String(e)); } finally { if(!ac.signal.aborted) setLoading(false);} })(); return () => ac.abort(); }, [id]);
  return { item, loading, error };
}

const contractorColumns = [
  { key: 'contractor_id', label: 'Contractor ID' },
  { key: 'company_name', label: 'Company' },
  { key: 'main_contact', label: 'Main Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'num_customers', label: '# Customers' },
];

function ContractorsList() {
  const { rows, loading, error } = useContractors();
  return (
    <Page title="Contractors">
      {error && <div style={{color:'#b91c1c', padding:8}}>Error: {error}</div>}
      <AdminTable columns={contractorColumns as any} rows={rows} loading={loading} getKey={(r: any) => r.contractor_id} />
    </Page>
  );
}

function ContractorDetail() {
  const { id } = useParams();
  const { item, loading, error } = useContractor(id);
  return (
    <Page title={item?.company_name || 'Contractor'}>
      {loading && <div style={{color:'#6b7280'}}>Loading…</div>}
      {error && <div style={{color:'#b91c1c'}}>Error: {error}</div>}
      {item && (
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><div className="text-ink-500">Contractor ID</div><div className="font-medium">{item.contractor_id}</div></div>
          <div><div className="text-ink-500">Company</div><div className="font-medium">{item.company_name}</div></div>
          <div><div className="text-ink-500">Main Contact</div><div className="font-medium">{item.main_contact || '—'}</div></div>
          <div><div className="text-ink-500">Email</div><div className="font-medium">{item.email || '—'}</div></div>
          <div><div className="text-ink-500">Phone</div><div className="font-medium">{item.phone || '—'}</div></div>
          <div><div className="text-ink-500"># Customers</div><div className="font-medium">{item.num_customers ?? '—'}</div></div>
        </div>
      )}
    </Page>
  );
}

export default function ContractorsRouter() {
  return (
    <Routes>
      <Route index element={<ContractorsList />} />
      <Route path=":id" element={<ContractorDetail />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
