import Page from "../components/Page";
import React, { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../lib/apiBase";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

type AppUser = { clerk_user_id: string; internal_code: string; role: string };

export default function AdminUsers() {
  const [list, setList] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<AppUser>({ clerk_user_id: "", internal_code: "", role: "manager" });

  async function refresh() {
    try {
      setLoading(true);
  const r = await apiFetch(`${API_BASE}/admin/app-users`);
      const j = await r.json();
      setList(j.items || []);
      setErr(null);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await apiFetch(`${API_BASE}/admin/app-users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!r.ok) throw new Error(await r.text());
      setForm({ clerk_user_id: "", internal_code: "", role: form.role });
      refresh();
    } catch (e: any) { setErr(String(e?.message || e)); }
  }

  return (
    <Page title="Admin • Users">
      {err ? <div className="alert-error mb-2">Error: {err}</div> : null}
      <form onSubmit={save} className="card p-4 grid gap-3">
        <div className="text-lg font-bold">Create / Link User</div>
        <label className="grid gap-1">
          <span className="text-sm text-ink-600">Clerk User ID</span>
          <Input value={form.clerk_user_id} onChange={e=>setForm({...form, clerk_user_id: e.target.value})} required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-ink-600">Internal Code (e.g., MGR-001, CR-001)</span>
          <Input value={form.internal_code} onChange={e=>setForm({...form, internal_code: e.target.value})} required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-ink-600">Role</span>
          <Select value={form.role} onChange={e=>setForm({...form, role: (e.target as HTMLSelectElement).value})}>
            {['admin','manager','contractor','customer','center','crew'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </label>
        <div>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>

      <Card className="mt-4">
        <div className="text-lg font-bold p-4">Existing Users</div>
        {loading ? <div className="p-4">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-left">Clerk ID</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Internal Code</th>
                </tr>
              </thead>
              <tbody>
                {list.map(u => (
                  <tr key={u.clerk_user_id} className="border-t border-gray-200">
                    <td> {u.clerk_user_id} </td>
                    <td> {u.role} </td>
                    <td> {u.internal_code} </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
