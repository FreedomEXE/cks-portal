import React, { useEffect, useState } from 'react';
import Button from '../../buttons/Button';

export type RoleKey = 'manager' | 'contractor' | 'crew' | 'warehouse';
type Entry = { code: string; name: string };

export interface CatalogService {
  serviceId: string;
  name: string | null;
  category: string | null;
  status?: string | null;
  description?: string | null;
  metadata?: any;
}

export interface CatalogServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: CatalogService | null;
  onSave?: (updates: {
    certifications?: Record<RoleKey, boolean>;
    visibility?: Record<RoleKey, boolean>;
    assignments?: { managers: string[]; crew: string[]; warehouses: string[] };
  }) => void;
  peopleManagers?: Entry[];
  peopleCrew?: Entry[];
  peopleWarehouses?: Entry[];
  selectedAssignments?: { managers: string[]; crew: string[]; warehouses: string[] };
  showCertifications?: boolean;
}

export default function CatalogServiceModal({ isOpen, onClose, service, onSave, peopleManagers = [], peopleCrew = [], peopleWarehouses = [], selectedAssignments, showCertifications = false }: CatalogServiceModalProps) {
  const [cert, setCert] = useState<Record<RoleKey, boolean>>({ manager: false, contractor: false, crew: false, warehouse: false });
  const [vis, setVis] = useState<Record<RoleKey, boolean>>({ manager: true, contractor: true, crew: true, warehouse: true });
  const [search, setSearch] = useState('');
  const [mgr, setMgr] = useState<Set<string>>(new Set());
  const [crw, setCrw] = useState<Set<string>>(new Set());
  const [whs, setWhs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !service) return;
    const meta = service.metadata || {};
    const nextCert: Record<RoleKey, boolean> = {
      manager: Boolean(meta?.certifications?.manager),
      contractor: Boolean(meta?.certifications?.contractor),
      crew: Boolean(meta?.certifications?.crew),
      warehouse: Boolean(meta?.certifications?.warehouse),
    };
    const nextVis: Record<RoleKey, boolean> = {
      manager: meta?.visibility?.manager !== false,
      contractor: meta?.visibility?.contractor !== false,
      crew: meta?.visibility?.crew !== false,
      warehouse: meta?.visibility?.warehouse !== false,
    };
    setCert(nextCert);
    setVis(nextVis);
    const sel = selectedAssignments || { managers: [], crew: [], warehouses: [] };
    setMgr(new Set(sel.managers));
    setCrw(new Set(sel.crew));
    setWhs(new Set(sel.warehouses));
    setSearch('');
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggle = (group: 'cert' | 'vis', key: RoleKey) => {
    if (group === 'cert') setCert((prev) => ({ ...prev, [key]: !prev[key] }));
    else setVis((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave?.({
      certifications: cert,
      visibility: vis,
      assignments: { managers: Array.from(mgr), crew: Array.from(crw), warehouses: Array.from(whs) },
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleBackdropClick}>
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, width: 640 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Service Catalog Entry</h3>
        <div style={{ color: '#475569', marginBottom: 12 }}>Service ID: <strong>{service.serviceId}</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Name</div>
            <div style={{ fontWeight: 600 }}>{service.name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Category</div>
            <div style={{ fontWeight: 600 }}>{service.category || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Status</div>
            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{service.status || 'active'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Description</div>
            <div style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{service.description || '—'}</div>
          </div>
        </div>

        {showCertifications && (
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Certifications</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {(['manager','contractor','crew','warehouse'] as RoleKey[]).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <input type="checkbox" checked={cert[key]} onChange={() => toggle('cert', key)} />
                  <span style={{ textTransform: 'capitalize' }}>{key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Role Visibility (Catalog)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {(['manager','contractor','crew','warehouse'] as RoleKey[]).map((key) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <input type="checkbox" checked={vis[key]} onChange={() => toggle('vis', key)} />
                <span style={{ textTransform: 'capitalize' }}>{key}</span>
              </label>
            ))}
          </div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
            Toggle which roles should see this service in the catalog.
          </div>
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Assign People</div>
          <input placeholder="Search people by id or name" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxHeight: 260, overflow: 'hidden' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, overflow: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Managers</div>
              {peopleManagers
                .filter((e) => { const q = search.trim().toLowerCase(); if (!q) return true; return e.code.toLowerCase().includes(q) || (e.name||'').toLowerCase().includes(q); })
                .map((e) => (
                  <label key={e.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                    <input type="checkbox" checked={mgr.has(e.code)} onChange={() => setMgr((prev) => { const n = new Set(prev); if (n.has(e.code)) n.delete(e.code); else n.add(e.code); return n; })} />
                    <span>{e.name} ({e.code})</span>
                  </label>
                ))}
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, overflow: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Crew</div>
              {peopleCrew
                .filter((e) => { const q = search.trim().toLowerCase(); if (!q) return true; return e.code.toLowerCase().includes(q) || (e.name||'').toLowerCase().includes(q); })
                .map((e) => (
                  <label key={e.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                    <input type="checkbox" checked={crw.has(e.code)} onChange={() => setCrw((prev) => { const n = new Set(prev); if (n.has(e.code)) n.delete(e.code); else n.add(e.code); return n; })} />
                    <span>{e.name} ({e.code})</span>
                  </label>
                ))}
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, overflow: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Warehouses</div>
              {peopleWarehouses
                .filter((e) => { const q = search.trim().toLowerCase(); if (!q) return true; return e.code.toLowerCase().includes(q) || (e.name||'').toLowerCase().includes(q); })
                .map((e) => (
                  <label key={e.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                    <input type="checkbox" checked={whs.has(e.code)} onChange={() => setWhs((prev) => { const n = new Set(prev); if (n.has(e.code)) n.delete(e.code); else n.add(e.code); return n; })} />
                    <span>{e.name} ({e.code})</span>
                  </label>
                ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
