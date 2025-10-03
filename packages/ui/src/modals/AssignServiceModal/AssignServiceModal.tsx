import React, { useEffect, useMemo, useState } from 'react';
import Button from '../../buttons/Button';

type Entry = { id: string; name: string };

export interface AssignServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  managers: Entry[];
  crew: Entry[];
  warehouses: Entry[];
  selected?: { managers: string[]; crew: string[]; warehouses: string[] };
  onSave: (next: { managers: string[]; crew: string[]; warehouses: string[] }) => void;
}

export default function AssignServiceModal({ isOpen, onClose, serviceId, managers, crew, warehouses, selected, onSave }: AssignServiceModalProps) {
  const [mgr, setMgr] = useState<Set<string>>(new Set());
  const [crw, setCrw] = useState<Set<string>>(new Set());
  const [whs, setWhs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMgr(new Set(selected?.managers || []));
    setCrw(new Set(selected?.crew || []));
    setWhs(new Set(selected?.warehouses || []));
    setSearch('');
  }, [isOpen, selected]);

  if (!isOpen) return null;

  const filter = (list: Entry[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => e.id.toLowerCase().includes(q) || (e.name || '').toLowerCase().includes(q));
  };

  const mgrList = useMemo(() => filter(managers), [managers, search]);
  const crwList = useMemo(() => filter(crew), [crew, search]);
  const whsList = useMemo(() => filter(warehouses), [warehouses, search]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const submit = () => {
    onSave({ managers: Array.from(mgr), crew: Array.from(crw), warehouses: Array.from(whs) });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, width: 800 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Assign Service</h3>
        <div style={{ color: '#64748b', marginBottom: 8 }}>Service: <strong>{serviceId}</strong></div>
        <input placeholder="Search people by id or name" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxHeight: 360, overflow: 'hidden' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, overflow: 'auto' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Managers</div>
            {mgrList.map((e) => (
              <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                <input type="checkbox" checked={mgr.has(e.id)} onChange={() => toggle(mgr, setMgr, e.id)} />
                <span>{e.name || e.id} ({e.id})</span>
              </label>
            ))}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, overflow: 'auto' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Crew</div>
            {crwList.map((e) => (
              <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                <input type="checkbox" checked={crw.has(e.id)} onChange={() => toggle(crw, setCrw, e.id)} />
                <span>{e.name || e.id} ({e.id})</span>
              </label>
            ))}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, overflow: 'auto' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Warehouses</div>
            {whsList.map((e) => (
              <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                <input type="checkbox" checked={whs.has(e.id)} onChange={() => toggle(whs, setWhs, e.id)} />
                <span>{e.name || e.id} ({e.id})</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={submit}>Save</Button>
        </div>
      </div>
    </div>
  );
}

