import React from 'react';

export default function ProfileSkeleton(): JSX.Element {
  return (
    <div style={{ padding: 24 }}>
      <div style={{
        border: '1px solid var(--border)',
        background: 'var(--card-bg)',
        borderRadius: 12,
        padding: 24
      }}>
        <div style={{ height: 28, width: 180, background: 'rgba(148,163,184,0.25)', borderRadius: 6 }} />
        <div style={{ height: 14, width: 260, background: 'rgba(148,163,184,0.2)', borderRadius: 6, marginTop: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 48, background: 'rgba(148,163,184,0.15)', borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

