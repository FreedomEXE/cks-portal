import React, { useState } from 'react';

export default function Support() {
  const [selectedTicketType, setSelectedTicketType] = useState('open');
  
  const ticketTypes = [
    { value: 'open', label: 'Open Tickets' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'resolved', label: 'Resolved Tickets' },
    { value: 'escalated', label: 'Escalated Issues' }
  ];

  const ticketStats = [
    { label: 'Open Tickets', value: 0, color: '#f59e0b' },
    { label: 'Pending Review', value: 0, color: '#3b82f6' },
    { label: 'Resolved Today', value: 0, color: '#10b981' },
    { label: 'Escalated', value: 0, color: '#ef4444' }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
          Support Management
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Manage support tickets and help desk operations
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {ticketStats.map((stat, index) => (
          <div key={index} className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: stat.color, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ color: '#9ca3af', fontSize: 14 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          Ticket Management
        </h2>
        
        <div style={{ marginBottom: 16 }}>
          <select
            value={selectedTicketType}
            onChange={(e) => setSelectedTicketType(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#111827',
              fontSize: '14px'
            }}
          >
            {ticketTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Create New Ticket
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Export Report
          </button>
        </div>
      </div>

      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {ticketTypes.find(t => t.value === selectedTicketType)?.label} (0)
          </h2>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>No tickets found</p>
        </div>
        
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 18, marginBottom: 8 }}>
            No {selectedTicketType} tickets found
          </div>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            Support tickets will appear here when available.
          </p>
        </div>
      </div>
    </div>
  );
}
