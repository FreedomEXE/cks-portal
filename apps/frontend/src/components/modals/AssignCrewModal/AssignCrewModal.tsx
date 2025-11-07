import React, { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import toast from 'react-hot-toast';
import { useHubRoleScope, type ManagerRoleScopeResponse } from '../../../shared/api/hub';
import { requestServiceCrew } from '../../../shared/api/hub';

export interface AssignCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  viewerCode?: string | null;
}

export function AssignCrewModal({ isOpen, onClose, serviceId, viewerCode }: AssignCrewModalProps) {
  const { mutate } = useSWRConfig();
  const scope = useHubRoleScope(viewerCode || undefined);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const crewList = useMemo(() => {
    const data = scope.data as ManagerRoleScopeResponse | null;
    const list = (data && data.role === 'manager') ? (data.relationships?.crew || []) : [];
    return list.map((c) => ({ code: c.id, name: c.name || c.id }));
  }, [scope.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crewList;
    return crewList.filter((c) => (c.code?.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)));
  }, [crewList, query]);

  const toggle = (code: string) => {
    setSelected((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };

  const submit = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one crew');
      return;
    }
    try {
      setSubmitting(true);
      await requestServiceCrew(serviceId, selected, message || undefined);
      // Refresh caches while keeping modal open
      mutate((key: any) => typeof key === 'string' && (
        key.includes('/services') ||
        key.includes('/api/hub/activities') ||
        key.includes('/hub/activities') ||
        key.includes(serviceId)
      ));
      toast.success('Crew request sent');
    } catch (e) {
      console.error('[AssignCrewModal] request failed', e);
      toast.error('Failed to send crew request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000 }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: 560,
          maxWidth: '92vw',
          margin: '10vh auto',
          borderRadius: 8,
          boxShadow: '0 10px 32px rgba(0,0,0,0.18)'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Assign Crew</h3>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Service {serviceId}</div>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6 }}>Search crew</label>
          <input
            type="text"
            placeholder="Search by code or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />

          <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 12, color: '#6b7280' }}>No crew found</div>
            ) : (
              filtered.map((c) => (
                <label key={c.code} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.code)}
                    onChange={() => toggle(c.code)}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginRight: 8 }}>{c.code}</span>
                  <span style={{ color: '#374151' }}>{c.name}</span>
                </label>
              ))
            )}
          </div>

          {selected.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selected.map((code) => (
                <span key={code} style={{ background: '#eef2ff', color: '#4f46e5', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>
                  {code}
                </span>
              ))}
            </div>
          )}

          <label style={{ display: 'block', fontSize: 12, color: '#374151', marginTop: 14, marginBottom: 6 }}>Optional message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note to include with the invite"
            rows={3}
            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 16, borderTop: '1px solid #eee' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>Close</button>
          <button onClick={submit} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6, background: '#4f46e5', color: '#fff', border: '1px solid #4338ca' }}>
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignCrewModal;

