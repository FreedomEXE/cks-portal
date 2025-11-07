import React from 'react';

export default function ServiceProceduresViewerTab({
  files = [],
}: {
  files?: Array<{ name: string; size?: number; type?: string; content?: string }>;
}) {
  const list = Array.isArray(files) ? files : [];
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Procedures</h3>
      {list.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: 6 }}>No procedures attached to this service.</p>
      ) : (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Files</div>
          <ul style={{ color: '#374151' }}>
            {list.map((f, idx) => {
              const kb = f.size ? ` (${Math.round((f.size || 0)/1024)} KB)` : '';
              const canDownload = !!f.content;
              return (
                <li key={`${f.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {canDownload ? (
                    <a href={f.content} download={f.name} style={{ color: '#1d4ed8', textDecoration: 'underline' }}>{f.name}</a>
                  ) : (
                    <span>{f.name}</span>
                  )}
                  <span style={{ color: '#6b7280' }}>{kb}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

