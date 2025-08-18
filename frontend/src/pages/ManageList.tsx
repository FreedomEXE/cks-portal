import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Page from "../components/Page";
import AdminTable from "../components/AdminTable";
import { buildUrl, apiFetch } from "../lib/apiBase";

type Item = { id: string | number; name: string };

const labelByType: Record<string, string> = {
  crew: "Crew",
  manager: "Managers",
  contractor: "Contractors",
  customer: "Customers",
  center: "Centers",
  service: "Services",
  job: "Jobs",
  supply: "Supplies",
  procedure: "Procedures",
  training: "Training",
  warehouse: "Warehouses",
  order: "Orders",
};

// Map manage type -> admin API section
const sectionByType: Record<string, string> = {
  crew: "crew",
  manager: "management",
  contractor: "contractors",
  customer: "customers",
  center: "centers",
  service: "services",
  job: "jobs",
  supply: "supplies",
  procedure: "procedures",
  training: "training",
  warehouse: "warehouses",
  // 'order' may not exist yet in /admin. Keep placeholder and empty list gracefully
  order: "orders",
};

// Normalizers to extract id+name for each section
const toItem: Record<string, (r: any) => Item> = {
  crew: (r) => ({ id: r.crew_id ?? r.id ?? "", name: r.name ?? r.crew_name ?? "" }),
  management: (r) => ({ id: r.manager_id ?? r.id ?? "", name: r.name ?? r.manager_name ?? "" }),
  contractors: (r) => ({ id: r.contractor_id ?? r.id ?? "", name: r.company_name ?? r.name ?? "" }),
  customers: (r) => ({ id: r.customer_id ?? r.id ?? "", name: r.company_name ?? r.name ?? "" }),
  centers: (r) => ({ id: r.center_id ?? r.id ?? "", name: r.name ?? r.center_name ?? "" }),
  services: (r) => ({ id: r.service_id ?? r.id ?? "", name: r.service_name ?? r.name ?? "" }),
  jobs: (r) => ({ id: r.job_id ?? r.id ?? "", name: r.name ?? r.title ?? r.service_name ?? `Job ${r.job_id ?? ""}` }),
  supplies: (r) => ({ id: r.supply_code ?? r.id ?? "", name: r.description ?? r.name ?? "" }),
  procedures: (r) => ({ id: r.procedure_id ?? r.id ?? "", name: r.type ?? r.name ?? "" }),
  training: (r) => ({ id: r.training_id ?? r.id ?? "", name: r.service_name ?? r.name ?? `Training ${r.training_id ?? ""}` }),
  warehouses: (r) => ({ id: r.warehouse_id ?? r.id ?? "", name: r.name ?? r.warehouse_name ?? "" }),
  orders: (r) => ({ id: r.order_id ?? r.id ?? "", name: r.name ?? r.description ?? `Order ${r.order_id ?? ""}` }),
};

export default function ManageList() {
  const { role, type } = useParams();
  const navigate = useNavigate();
  const section = type ? sectionByType[type] : undefined;
  const pretty = type ? labelByType[type] : undefined;

  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !section) {
      const r = (role as string) || (typeof window !== 'undefined' ? (sessionStorage.getItem('role')||'admin') : 'admin');
      navigate(`/${r}/hub/manage`, { replace: true });
    }
  }, [role, type, section, navigate]);

  useEffect(() => {
    const run = async () => {
      if (!section) return;
      setLoading(true);
      setError(null);
      try {
        const url = buildUrl(`/admin/${section}`, { limit: 100, offset: 0 });
  const res = await apiFetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray(data)
          ? (data as any)
          : [];
        const norm = toItem[section];
        setRows(
          norm
            ? items.map(norm)
            : items.map((r: any) => ({ id: r.id ?? "", name: r.name ?? "" }))
        );
      } catch (e: any) {
        setError(e?.message || String(e));
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [section]);

  const columns = useMemo(() => {
    return [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      {
        key: "actions",
        label: "Actions",
        render: (_: any, r: Item) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ui-button" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => alert(`Edit ${r.id}`)}>Edit</button>
            <button className="ui-button" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => alert(`Assign task to ${r.id}`)}>Assign Task</button>
            <button className="ui-button" style={{ padding: "6px 10px", fontSize: 12, color: "#b91c1c", borderColor: "#fecaca" }} onClick={() => alert(`Delete ${r.id}`)}>Delete</button>
          </div>
        ),
      },
    ];
  }, []);

  const title = pretty ? `Manage ${pretty}` : "Manage";

  return (
    <Page title={title}>
      {error && <div style={{ color: "#b91c1c", marginBottom: 8 }}>Error: {error}</div>}
      <AdminTable columns={columns} rows={rows} loading={loading} getKey={(r: Item) => r.id} />
    </Page>
  );
}
