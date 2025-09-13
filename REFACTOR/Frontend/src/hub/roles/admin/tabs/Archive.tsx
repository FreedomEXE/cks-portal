import React, { useState } from 'react';

export default function Archive() {
  const [selectedArchiveType, setSelectedArchiveType] = useState('users');
  
  const archiveTypes = [
    { value: 'users', label: 'Archived Users' },
    { value: 'orders', label: 'Archived Orders' },
    { value: 'data', label: 'Archived Data' },
    { value: 'logs', label: 'Archived Logs' }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
          Archive Management
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          View and manage archived data, users, and system records
        </p>
      </div>

      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          Archive Type
        </h2>
        
        <div style={{ marginBottom: 16 }}>
          <select
            value={selectedArchiveType}
            onChange={(e) => setSelectedArchiveType(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              color: '#111827',
              fontSize: 14
            }}
          >
            {archiveTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {archiveTypes.find(t => t.value === selectedArchiveType)?.label} (0)
          </h2>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>No archived items found</p>
        </div>
        
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 18, marginBottom: 8 }}>
            No archived {selectedArchiveType} found
          </div>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            Archived items will appear here when available.
          </p>
        </div>
      </div>
    </div>
  );
}

