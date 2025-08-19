import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import Page from '../../../../../components/Page';
import AdminTable from '../../../../../components/AdminTable';
import { apiFetch, buildUrl } from '../../../../../lib/apiBase';

// NOTE: Admin hub uses per-tab components; for Manager we keep a single-file pattern (simpler) per requirements.
// If parity requires later split, we can mirror Admin naming (CustomersTab etc.).

export type ManagerCustomer = {
  customer_id: string;
  company_name?: string;
  main_contact?: string;
  phone?: string;
  email?: string;
  num_centers?: number;
};

async function fetchCustomers(signal?: AbortSignal): Promise<ManagerCustomer[]> {
  // Endpoint assumption: /manager/customers ; adjust with TODO if backend diverges.
  const url = buildUrl('/manager/customers');
  const res = await apiFetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? data : [];
}

async function fetchCustomer(id: string, signal?: AbortSignal): Promise<ManagerCustomer | null> {
  const url = buildUrl(`/manager/customers/${encodeURIComponent(id)}`);
  const res = await apiFetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && typeof data === 'object') return data as ManagerCustomer;
  return null;
}

function useCustomers() {
  const [rows, setRows] = useState<ManagerCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try { setLoading(true); setError(null); setRows([]); const data = await fetchCustomers(ac.signal); setRows(data); } catch (e: any) { if (!ac.signal.aborted) setError(e?.message||String(e)); } finally { if (!ac.signal.aborted) setLoading(false); }
    })();
    return () => ac.abort();
  }, []);
  return { rows, loading, error };
}

function useCustomer(id: string | undefined) {
  const [item, setItem] = useState<ManagerCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return; const ac = new AbortController();
    (async () => { try { setLoading(true); setError(null); setItem(null); const data = await fetchCustomer(id, ac.signal); setItem(data); } catch (e: any) { if (!ac.signal.aborted) setError(e?.message||String(e)); } finally { if (!ac.signal.aborted) setLoading(false); } })();
    return () => ac.abort();
  }, [id]);
  return { item, loading, error };
}

const customerColumns = [
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'main_contact', label: 'Main Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'num_centers', label: '# Centers' },
];

function CustomersList() {
  const { rows, loading, error } = useCustomers();
  return (
    <Page title="Customers">
      {error && <div style={{color:'#b91c1c', padding:8}}>Error: {error}</div>}
      <AdminTable columns={customerColumns as any} rows={rows} loading={loading} getKey={(r: any) => r.customer_id} />
    </Page>
  );
}

function CustomerDetail() {
  const { id } = useParams();
  const { item, loading, error } = useCustomer(id);
  return (
    <Page title={item?.company_name || 'Customer'}>
      {loading && <div style={{color:'#6b7280'}}>Loading…</div>}
      {error && <div style={{color:'#b91c1c'}}>Error: {error}</div>}
      {item && (
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><div className="text-ink-500">Customer ID</div><div className="font-medium">{item.customer_id}</div></div>
          <div><div className="text-ink-500">Company</div><div className="font-medium">{item.company_name}</div></div>
          <div><div className="text-ink-500">Main Contact</div><div className="font-medium">{item.main_contact || '—'}</div></div>
          <div><div className="text-ink-500">Email</div><div className="font-medium">{item.email || '—'}</div></div>
          <div><div className="text-ink-500">Phone</div><div className="font-medium">{item.phone || '—'}</div></div>
          <div><div className="text-ink-500"># Centers</div><div className="font-medium">{item.num_centers ?? '—'}</div></div>
        </div>
      )}
    </Page>
  );
}

export default function CustomersRouter() {
  return (
    <Routes>
      <Route index element={<CustomersList />} />
      <Route path=":id" element={<CustomerDetail />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
