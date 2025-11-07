import React, { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import toast from 'react-hot-toast';
import { useHubRoleScope, type ManagerRoleScopeResponse } from '../../../shared/api/hub';
import { requestServiceCrew, updateServiceMetadataAPI } from '../../../shared/api/hub';

export interface ServiceAssignmentsTabProps {
  serviceId: string;
  viewerCode?: string | null;
  managedBy?: string | null; // 'manager' | 'warehouse'
  assigned?: Array<{ code: string; name?: string } | string> | null;
}

export default function ServiceAssignmentsTab({ serviceId, viewerCode, managedBy, assigned = [] }: ServiceAssignmentsTabProps) {
  const { mutate } = useSWRConfig();
  const scope = useHubRoleScope(viewerCode || undefined);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Hide entirely for warehouse-managed services
  if ((managedBy || '').toLowerCase() === 'warehouse') {
    return (
      <div style={{ padding: 16, color: '#6b7280' }}>
        Assignments are managed by Warehouse for this service.
      </div>
    );
  }

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
      // Refresh related caches: services, activities, serviceId-specific keys
      mutate((key: any) => typeof key === 'string' && (
        key.includes('/services') ||
        key.includes('/api/hub/activities') ||
        key.includes('/hub/activities') ||
        key.includes(serviceId)
      ));
      if (viewerCode) {
        await mutate(`/hub/activities/${viewerCode}`);
      }
      toast.success('Crew request sent');
    } catch (e) {
      console.error('[ServiceAssignmentsTab] request failed', e);
      toast.error('Failed to send crew request');
    } finally {
      setSubmitting(false);
    }
  };

  const currentAssigned: Array<{ code: string; name?: string }> = useMemo(() => {
    const arr = Array.isArray(assigned) ? assigned : [];
    return arr.map((a: any) => (typeof a === 'string' ? { code: a, name: a } : { code: a.code, name: a.name || a.code }))
      .filter((x) => !!x.code);
  }, [assigned]);

  const unassign = async (code: string) => {
    try {
      setRemoving(code);
      const nextCodes = currentAssigned.map((a) => a.code).filter((c) => c !== code);
      await updateServiceMetadataAPI(serviceId, { crew: nextCodes });
      await mutate((key: any) => typeof key === 'string' && (
        key.includes('/services') ||
        key.includes('/hub/activities') ||
        key.includes(serviceId)
      ));
      toast.success(`Unassigned ${code}`);
    } catch (e) {
      console.error('[ServiceAssignmentsTab] unassign failed', e);
      toast.error('Failed to unassign');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Crew Assignments</h3>
      <p style={{ margin: '0 0 12px 0', color: '#6b7280' }}>Search and select crew to invite to this service.</p>

      {/* Current assignments */}
      {currentAssigned.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Currently Assigned</div>
          <ul>
            {currentAssigned.map((a) => (
              <li key={a.code} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{a.code}</span>
                <span>{a.name}</span>
                <button
                  onClick={() => unassign(a.code)}
                  disabled={!!removing}
                  style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e7eb', color: '#b91c1c' }}
                >
                  {removing === a.code ? 'Removing…' : 'Unassign'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input
        type="text"
        placeholder="Search crew by code or name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
      />

      <div style={{ marginTop: 12, maxHeight: 220, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={submit} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6, background: '#4f46e5', color: '#fff', border: '1px solid #4338ca' }}>
          {submitting ? 'Sending…' : 'Send Request'}
        </button>
      </div>
    </div>
  );
}
