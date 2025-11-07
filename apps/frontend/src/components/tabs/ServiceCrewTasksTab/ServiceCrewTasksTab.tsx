import React, { useMemo } from 'react';
import { useSWRConfig } from 'swr';
import { updateServiceMetadataAPI } from '../../../shared/api/hub';

type Task = {
  id?: string;
  title?: string;
  frequency?: string;
  durationMinutes?: number;
  days?: string[];
  startTime?: string;
  endTime?: string;
  assignedTo?: string[];
  completedAt?: string | null;
  completedBy?: string | null;
  [key: string]: any;
};

export default function ServiceCrewTasksTab({
  serviceId,
  tasks: allTasks = [],
  viewerCode,
  serviceStatus,
}: {
  serviceId: string;
  tasks?: Task[];
  viewerCode?: string | null;
  serviceStatus?: string | null;
}) {
  const { mutate } = useSWRConfig();
  const viewer = (viewerCode || '').toUpperCase();

  const tasks = useMemo(() => {
    const filtered = (Array.isArray(allTasks) ? allTasks : []).filter((t) => {
      const assigned = Array.isArray(t.assignedTo) ? t.assignedTo.map((x) => String(x).toUpperCase()) : [];
      return viewer && assigned.includes(viewer);
    });
    return filtered.map((t) => ({
      ...t,
      _id: `${serviceId}:${t.id || t.title || Math.random().toString(36).slice(2)}`,
    }));
  }, [allTasks, viewer, serviceId]);

  const isActive = (serviceStatus || '').toLowerCase() === 'in_progress';

  const markDone = async (rowId: string) => {
    const nowIso = new Date().toISOString();
    const next = (Array.isArray(allTasks) ? allTasks : []).map((t) => {
      const tid = `${serviceId}:${t.id || t.title}`;
      if (tid === rowId) {
        return { ...t, completedAt: nowIso, completedBy: viewer };
      }
      return t;
    });
    await updateServiceMetadataAPI(serviceId, { tasks: next as any[] });
    await mutate((key: any) => typeof key === 'string' && (
      key.includes('/services') ||
      key.includes(serviceId) ||
      (viewer && key.includes(`/hub/orders/${viewer}`)) ||
      key.includes('/hub/activities')
    ));
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>My Tasks</h3>
      {!isActive && (
        <p style={{ color: '#6b7280', marginTop: 6 }}>Tasks will be available once this service is started.</p>
      )}
      {isActive && tasks.length === 0 && (
        <p style={{ color: '#6b7280', marginTop: 6 }}>No tasks assigned to you for this service.</p>
      )}
      {isActive && tasks.length > 0 && (
        <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          {tasks.map((t) => {
            const days = Array.isArray(t.days) ? t.days.join(';') : '';
            const window = [t.startTime, t.endTime].filter(Boolean).join(' - ');
            const schedule = [days, window].filter(Boolean).join(' • ');
            const _completed = !!t.completedAt;
            return (
              <label key={t._id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f3f4f6', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={_completed}
                  disabled={_completed}
                  onChange={() => markDone(t._id as string)}
                  style={{ marginRight: 8 }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>{t.title || t.id || 'Task'}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>
                    {schedule || (t.frequency || 'once')}
                    {t.durationMinutes ? ` • ${t.durationMinutes} min` : ''}
                  </div>
                  {_completed && (
                    <div style={{ color: '#374151', fontSize: 12 }}>Completed: {new Date(String(t.completedAt)).toLocaleString()}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
