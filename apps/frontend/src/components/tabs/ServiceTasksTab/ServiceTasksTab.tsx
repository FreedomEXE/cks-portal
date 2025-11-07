import React, { useMemo, useState } from 'react';
import { useHubRoleScope, type ManagerRoleScopeResponse } from '../../../shared/api/hub';
import { updateServiceMetadataAPI } from '../../../shared/api/hub';
import { useSWRConfig } from 'swr';

type Task = {
  id: string;
  title: string;
  frequency?: string; // daily/weekly/once
  durationMinutes?: number;
  days?: string[]; // mon,tue,... for weekly
  startTime?: string;
  endTime?: string;
  assignedTo?: string[]; // crew ids
  source?: string; // file name
};

function parseCsv(content: string, sourceName: string): Task[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const tasks: Task[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const row: Record<string, string> = {} as any;
    header.forEach((h, idx) => {
      row[h] = (cols[idx] || '').trim();
    });
    const title = row['title'] || row['task'] || `Task ${i}`;
    const freq = (row['frequency'] || '').toLowerCase();
    const duration = Number(row['duration'] || row['durationminutes'] || '0');
    const days = (row['days'] || '').split(/;|\|/).map(s => s.trim()).filter(Boolean);
    const start = row['start'] || row['starttime'] || undefined;
    const end = row['end'] || row['endtime'] || undefined;
    tasks.push({
      id: `${sourceName}:${i}`,
      title,
      frequency: freq || undefined,
      durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : undefined,
      days: days.length ? days : undefined,
      startTime: start,
      endTime: end,
      source: sourceName,
    });
  }
  return tasks;
}

export default function ServiceTasksTab({
  serviceId,
  procedures,
  existingTasks = [],
  viewerCode,
}: {
  serviceId: string;
  procedures: Array<{ name: string; type?: string; content?: string }>;
  existingTasks?: Task[];
  viewerCode?: string | null;
}) {
  const { mutate } = useSWRConfig();
  const scope = useHubRoleScope(viewerCode || undefined);
  const crewList = useMemo(() => {
    const data = scope.data as ManagerRoleScopeResponse | null;
    const list = (data && data.role === 'manager') ? (data.relationships?.crew || []) : [];
    return list.map((c) => ({ code: c.id, name: c.name || c.id }));
  }, [scope.data]);

  const parsedFromProcedures = useMemo(() => {
    const out: Task[] = [];
    procedures.forEach((f) => {
      const isCsv = (f.name || '').toLowerCase().endsWith('.csv') || (f.type || '').toLowerCase().includes('csv');
      if (isCsv && f.content && f.content.startsWith('data:')) {
        try {
          const base64 = f.content.split(',')[1] || '';
          const text = atob(base64);
          out.push(...parseCsv(text, f.name));
        } catch (e) {
          console.warn('[ServiceTasksTab] failed to parse CSV', f.name, e);
        }
      }
    });
    return out;
  }, [procedures]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [assignees, setAssignees] = useState<string[]>([]);

  const allTasks = useMemo(() => {
    // Merge existing tasks with parsed candidates (by title+source)
    const key = (t: Task) => `${t.title}|${t.source || ''}`.toUpperCase();
    const map = new Map<string, Task>();
    existingTasks.forEach(t => map.set(key(t), t));
    parsedFromProcedures.forEach(t => { if (!map.has(key(t))) map.set(key(t), t); });
    return Array.from(map.values());
  }, [existingTasks, parsedFromProcedures]);

  const toggleTask = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAssignee = (code: string) => setAssignees(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const assignSelected = async () => {
    const picked = allTasks.filter(t => selected[t.id]);
    if (picked.length === 0) return;
    const merged = allTasks.map(t => selected[t.id] ? ({ ...t, assignedTo: Array.from(new Set([...(t.assignedTo || []), ...assignees])) }) : t);
    await updateServiceMetadataAPI(serviceId, { tasks: merged as any[] });
    mutate((key: any) => typeof key === 'string' && (key.includes('/services') || key.includes(serviceId)));
    setSelected({});
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tasks</h3>
      <p style={{ color: '#6b7280', marginTop: 6 }}>Parsed from CSV procedure files when available. Select tasks and assign to crew.</p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Tasks</div>
          {allTasks.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No tasks found. Upload a CSV procedure file with columns like: title,frequency,durationMinutes,days,start,end.</div>
          ) : (
            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              {allTasks.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  <input type="checkbox" checked={!!selected[t.id]} onChange={() => toggleTask(t.id)} style={{ marginRight: 8 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{t.title}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>
                      {t.frequency || 'once'}{t.days ? ` · ${t.days.join(',')}` : ''}{t.durationMinutes ? ` · ${t.durationMinutes} min` : ''}{t.source ? ` · ${t.source}` : ''}
                    </div>
                    {t.assignedTo && t.assignedTo.length > 0 && (
                      <div style={{ color: '#374151', fontSize: 12 }}>Assigned: {t.assignedTo.join(', ')}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div style={{ width: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Assign to Crew</div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
            {crewList.length === 0 ? (
              <div style={{ padding: 12, color: '#6b7280' }}>No crew available</div>
            ) : (
              crewList.map(c => (
                <label key={c.code} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  <input type="checkbox" checked={assignees.includes(c.code)} onChange={() => toggleAssignee(c.code)} style={{ marginRight: 8 }} />
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginRight: 8 }}>{c.code}</span>
                  <span>{c.name}</span>
                </label>
              ))
            )}
          </div>
          <button onClick={assignSelected} style={{ marginTop: 10, width: '100%', padding: '8px 12px', borderRadius: 6, background: '#111827', color: '#fff', border: '1px solid #111827' }}>
            Assign Selected Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

