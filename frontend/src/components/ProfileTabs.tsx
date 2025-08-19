/**
TRACE
OutboundImports: ./AdminTable, ./ProfilePhoto
+InboundUsedBy: frontend/src/pages/Hubs/Manager/ManagerProfile.tsx, frontend/src/pages/Hubs/Center/CenterProfile.tsx, frontend/src/pages/Hubs/Customer/CustomerProfile.tsx, others
+ProvidesData: UI component rendering tabs and table-like views based on `tabs` prop
+ConsumesData: tabs[].columns[].key & label, subject.kind, subject.code, subject.name
+SideEffects: none (local state only)
+RoleBranching: renders different layouts for 'Profile' tab vs others (AdminTable)
+CriticalForManagerProfile: yes (renders manager tabs and columns)
+SimplificationRisk: med (contains generic behavior including Profile photo and AdminTable complexity)
+*/

import { useState, useEffect } from "react";
import AdminTable from "./AdminTable";
import ProfilePhoto from "./ProfilePhoto";

type Column = { key: string; label: string };
type Tab = { label: string; columns: Column[] };
type SubjectMeta = { kind: string; code?: string; name?: string };

type SignaturePayload = { tabs: string[]; active: number; activeLabel: string; columns: string[] };

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// PROFILETABS_MANAGER_USAGE // PropsConsumedForManager: tabs (labels+columns), subject (kind, code, name) // GenericComplexityRisk: medium - contains photo + admin table logic which may be unnecessary for manager-only variant // SimplifySurfaceForManager: subject.name (used in ProfilePhoto), columns list (could be passed reduced), AdminTable fallback (could be replaced with empty state for manager-only)

export default function ProfileTabs({ tabs, subject, onSignature }: { tabs: Tab[]; subject?: SubjectMeta; onSignature?: (p: SignaturePayload) => void }) {
  const [active, setActive] = useState(0);

  const current = tabs[active] || tabs[0];
  const columns = (current?.columns || []).map((c) => ({ key: (c.key as string) || slugify(c.label), label: c.label }));

  useEffect(() => {
    if (typeof onSignature !== "function") return;
    if (subject?.kind !== "manager") return;

    const payload: SignaturePayload = {
      tabs: tabs.map((t) => t.label),
      active,
      activeLabel: current?.label || "",
      columns: (current?.columns || []).map((c) => c.label),
    };

    try {
      onSignature(payload);
    } catch (e) {
      // non-fatal
    }
    // only run when active/tabs/subject.kind change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, subject?.kind, tabs]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button
            key={t.label + i}
            onClick={() => setActive(i)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: i === active ? "#111827" : "#fff",
              color: i === active ? "#fff" : "#111827",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {String(current?.label || '').toLowerCase() === 'profile' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: 16 }}>
            {/* Left: Photo/Graphics */}
            <div className="ui-card" style={{ padding: 16, alignSelf: 'start' }}>
              <div className="title" style={{ marginBottom: 12 }}>Photo / Graphics</div>
              <ProfilePhoto id={`${subject?.kind || 'entity'}:${subject?.code || 'unknown'}`} name={subject?.name || ''} size={180} />
            </div>

            {/* Right: Field / Value table-like card */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#111827', borderBottom: '1px solid #e5e7eb' }}>Field</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#111827', borderBottom: '1px solid #e5e7eb' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.length === 0 ? (
                      <tr><td colSpan={2} style={{ padding: 24, color: '#6b7280' }}>No data.</td></tr>
                    ) : (
                      columns.map((c, i) => (
                        <tr key={c.key + ':' + i} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 16px', width: '34%', fontWeight: 600, color: '#111827' }}>{c.label}</td>
                          <td style={{ padding: '10px 16px', color: '#111827' }}>—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <AdminTable columns={columns} rows={[]} getKey={(_, i) => i} />
        )}
      </div>
    </div>
  );
}
