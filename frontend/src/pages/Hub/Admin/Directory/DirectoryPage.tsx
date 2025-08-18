/**
 * File: DirectoryPage.tsx

 * Description:
 *   Admin tabbed directory with 13 sections covering core entities and split views.
 * Functionality:
 *   Renders tabs and section content; Orders and Reports show split tables.
 * Importance:
 *   One-stop Admin index to browse and drill into resources.
 * Connections:
 *   Uses DirectoryTabs and per-section tab components; interacts with AdminTable and API.
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Page from '../../../../components/Page';
import AdminTable from '../../../../components/AdminTable';
import DirectoryTabs, { AdminDirectoryTabKey } from '../components/DirectoryTabs';
import CrewTab from './tabs/CrewTab';
import ContractorsTab from './tabs/ContractorsTab';
import CustomersTab from './tabs/CustomersTab';
import CentersTab from './tabs/CentersTab';
import ServicesTab from './tabs/ServicesTab';
import JobsTab from './tabs/JobsTab';
import SuppliesTab from './tabs/SuppliesTab';
import ProceduresTab from './tabs/ProceduresTab';
import TrainingTab from './tabs/TrainingTab';
import ManagementTab from './tabs/ManagementTab';
import WarehousesTab from './tabs/WarehousesTab';
import OrdersTab from './tabs/OrdersTab';
import ReportsTab from './tabs/ReportsTab';
import { buildHubPath } from '../../../../lib/hubRoutes';
import { apiFetch, buildUrl } from '../../../../lib/apiBase';

// Keep columns and normalizers in this file to scope to Admin only

type Column = { key: string; label: string };

type SectionKey = AdminDirectoryTabKey;

const columnsBySection: Record<SectionKey, Column[]> = {
  crew: [
    { key: 'crew_id', label: 'Crew ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'role', label: 'Role' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'assigned_center', label: 'Assigned Center' },
  ],
  contractors: [
    { key: 'contractor_id', label: 'Contractor ID' },
    { key: 'cks_manager', label: 'CKS Manager' },
    { key: 'company_name', label: 'Company' },
    { key: 'num_customers', label: '# Of Customers' },
    { key: 'main_contact', label: 'Main Contact' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ],
  customers: [
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'cks_manager', label: 'CKS Manager' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'num_centers', label: '# Of Centers' },
    { key: 'main_contact', label: 'Main Contact' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ],
  centers: [
    { key: 'center_id', label: 'Center ID' },
    { key: 'cks_manager', label: 'CKS Manager' },
    { key: 'name', label: 'Center Name' },
    { key: 'main_contact', label: 'Main Contact' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'E-mail' },
    { key: 'contractor_id', label: 'Assigned-Contractor' },
    { key: 'customer_id', label: 'Assigned-Customer' },
  ],
  services: [
    { key: 'service_id', label: 'Service ID' },
    { key: 'service_name', label: 'Service Name' },
    { key: 'cks_cost', label: 'CKS Cost' },
    { key: 'min_charge', label: 'Min Charge' },
    { key: 'min_crew', label: 'Min Crew' },
    { key: 'min_expense', label: 'Min Expense' },
    { key: 'min_job_charge', label: 'Min Job Charge' },
    { key: 'min_profit_dollar', label: 'Min Profit $' },
    { key: 'min_profit_pct', label: 'Min Profit %' },
  ],
  jobs: [
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
  ],
  supplies: [
    { key: 'supply_code', label: 'Supply Code' },
    { key: 'location', label: 'Location' },
    { key: 'description', label: 'Description' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'cks_cost', label: 'CKS Cost' },
    { key: 'min_sale_price', label: 'Min Sale Price' },
    { key: 'profit_pct', label: 'Profit %' },
    { key: 'profit', label: 'Profit' },
    { key: 'sales', label: 'Sales' },
    { key: 'total_cost', label: 'Total Cost' },
    { key: 'gross_revenue', label: 'Gross Revenue' },
    { key: 'net_revenue', label: 'Net Revenue' },
  ],
  procedures: [
    { key: 'procedure_id', label: 'Procedure ID' },
    { key: 'service', label: 'Service' },
    { key: 'type', label: 'Type' },
    { key: 'contractor', label: 'Contractor' },
    { key: 'customer', label: 'Customer' },
    { key: 'center', label: 'Center' },
  ],
  training: [
    { key: 'training_id', label: 'Training ID' },
    { key: 'crew_id', label: 'Crew ID' },
    { key: 'crew_name', label: 'Crew Name' },
    { key: 'service_id', label: 'Service ID' },
    { key: 'service_name', label: 'Service Name' },
    { key: 'date', label: 'Date' },
    { key: 'expense', label: 'Expense' },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status' },
  ],
  management: [
    { key: 'manager_id', label: 'Manager ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  warehouses: [
    { key: 'warehouse_id', label: 'Warehouse ID' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'manager', label: 'Manager' },
  ],
  orders: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'center_id', label: 'Center ID' },
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'contractor_id', label: 'Contractor ID' },
    { key: 'service_id', label: 'Service ID' },
    { key: 'manager_id', label: 'Manager ID' },
    { key: 'status', label: 'Status' },
    { key: 'scheduled_date', label: 'Scheduled Date' },
    { key: 'total_amount', label: 'Total' },
    { key: 'created_at', label: 'Created' },
  ],
  reports: [
    { key: 'report_id', label: 'Report ID' },
    { key: 'job_id', label: 'Job ID' },
    { key: 'center_id', label: 'Center ID' },
    { key: 'type', label: 'Type' },
    { key: 'author', label: 'Author' },
    { key: 'submitted_date', label: 'Submitted' },
    { key: 'status', label: 'Status' },
  ],
};

const normalizers: Record<string, (r: any) => any> = {
  services: (r: any) => ({
    service_id: r.service_id ?? "",
    service_name: r.service_name ?? "",
    cks_cost: r.cks_cost ?? "",
    min_charge: r.min_charge ?? "",
    min_crew: r.min_crew ?? "",
    min_expense: r.min_expense ?? "",
    min_job_charge: r.min_job_charge ?? "",
    min_profit_dollar: r.min_profit_dollar ?? "",
    min_profit_pct: r.min_profit_pct ?? "",
  }),
  orders: (r: any) => ({
    order_id: r.order_id ?? r.id ?? "",
    center_id: r.center_id ?? "",
    customer_id: r.customer_id ?? "",
    contractor_id: r.contractor_id ?? "",
    service_id: r.service_id ?? "",
    manager_id: r.manager_id ?? "",
    status: r.status ?? "",
    scheduled_date: r.scheduled_date ?? r.date ?? "",
    total_amount: r.total_amount ?? r.total ?? "",
    created_at: r.created_at ?? r.created ?? "",
    order_type: (r.order_type ?? r.type ?? (r.service_id ? "service" : "supply"))?.toString().toLowerCase(),
  }),
  reports: (r: any) => ({
    report_id: r.report_id ?? r.id ?? "",
    job_id: r.job_id ?? "",
    center_id: r.center_id ?? "",
    type: r.type ?? r.report_type ?? "",
    author: r.author ?? r.manager ?? r.user ?? "",
    manager_id: r.manager_id ?? r.managerId ?? r.managerID ?? r.author_id ?? r.user_id ?? r.manager?.id ?? "",
    submitted_date: r.submitted_date ?? r.date ?? "",
    status: r.status ?? "",
    source: (r.source ?? r.origin ?? (r.manager_id ? "manager" : "center"))?.toString().toLowerCase(),
  }),
};

function useSectionData(section: SectionKey, q: string, limit: number, offset: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const url = buildUrl(`/admin/${section}`, { q: q || undefined, limit, offset });
        const res = await apiFetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray(data)
          ? (data as any)
          : [];
        const norm = normalizers[section];
        const out = norm ? items.map(norm) : items;
        if (!cancelled) { setRows(out); setTotal(Number((data as any)?.total ?? out.length ?? 0)); }
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || String(e)); setRows([]); setTotal(0); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [section, q, limit, offset]);

  return { loading, error, rows, total };
}

function SectionView({ section, q }: { section: SectionKey; q: string; }) {
  const [limit, setLimit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);
  const columns = useMemo<Column[]>(() => columnsBySection[section] || [], [section]);
  const { loading, error, rows, total } = useSectionData(section, q, limit, offset);

  if (section === 'orders') return <OrdersTab rows={rows} loading={loading} />;

  if (section === 'reports') return <ReportsTab rows={rows} loading={loading} />;

  const simple = (
    <>
      {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {error && <div style={{ color: '#b91c1c' }}>Error: {error}</div>}
      {section === 'crew' && <CrewTab columns={columns} rows={rows} loading={loading} />}
      {section === 'contractors' && <ContractorsTab columns={columns} rows={rows} loading={loading} />}
      {section === 'customers' && <CustomersTab columns={columns} rows={rows} loading={loading} />}
      {section === 'centers' && <CentersTab columns={columns} rows={rows} loading={loading} />}
      {section === 'services' && <ServicesTab columns={columns} rows={rows} loading={loading} />}
      {section === 'jobs' && <JobsTab columns={columns} rows={rows} loading={loading} />}
      {section === 'supplies' && <SuppliesTab columns={columns} rows={rows} loading={loading} />}
      {section === 'procedures' && <ProceduresTab columns={columns} rows={rows} loading={loading} />}
      {section === 'training' && <TrainingTab columns={columns} rows={rows} loading={loading} />}
      {section === 'management' && <ManagementTab columns={columns} rows={rows} loading={loading} />}
      {section === 'warehouses' && <WarehousesTab columns={columns} rows={rows} loading={loading} />}
    </>
  );

  return (
    <>
      {simple}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-ink-600">
          {total > 0 ? (
            <>Showing {Math.min(total, offset + 1)}–{Math.min(total, offset + (rows?.length || 0))} of {total}</>
          ) : (
            <>No results</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="select"
            value={limit}
            onChange={(e) => { setOffset(0); setLimit(Number(e.target.value) || 25); }}
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            className="btn"
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            disabled={offset <= 0 || loading}
            aria-label="Previous page"
          >Prev</button>
          <button
            className="btn"
            onClick={() => setOffset((o) => (o + limit < total ? o + limit : o))}
            disabled={offset + limit >= total || loading}
            aria-label="Next page"
          >Next</button>
        </div>
      </div>
    </>
  );
}

export default function DirectoryPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const fromParam = (params as any)?.section as SectionKey | undefined;
  const fromQuery = (sp.get('tab') as SectionKey) || undefined;
  const active: SectionKey = (fromQuery || fromParam || 'crew');

  // Determine current hub id for Home/Back links
  const p: any = params as any;
  const hubId = (p.username || p.hubId || (typeof window !== 'undefined' ? (sessionStorage.getItem('code') || sessionStorage.getItem('role')) : null) || 'admin').toLowerCase();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const TitleLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <a href={buildHubPath('admin')} aria-label="Home" title="Home" className="ui-button" style={{ width: 38, height: 38, borderRadius: 999, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 21V12h6v9" />
        </svg>
      </a>
      <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate(buildHubPath('admin'))} aria-label="Back" title="Back" className="ui-button" style={{ width: 38, height: 38, borderRadius: 999, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>
  );

  return (
    <Page
      title="CKS Directory"
      left={TitleLeft}
      right={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', maxWidth: 360 }}>
          <input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input"
            style={{ flex: '1 1 auto', minWidth: 140, maxWidth: 260 }}
          />
          <button className="btn-primary btn" onClick={() => setQ(q)}>Search</button>
        </div>
      }
    >
      <DirectoryTabs
        active={active}
        onChange={(k) => {
          setSp((prev) => { prev.set('tab', k); return prev; }, { replace: true });
          if ((params as any)?.section) {
            navigate(`/${hubId}/hub/directory?tab=${k}`, { replace: true });
          }
        }}
      />

      <SectionView section={active} q={debouncedQ} />
    </Page>
  );
}
