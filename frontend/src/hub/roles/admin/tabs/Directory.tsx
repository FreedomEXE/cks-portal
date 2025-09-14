import React, { useState } from 'react';

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('contractors');
  
  const directoryTabs = [
    { id: 'contractors', label: 'Contractors', color: '#10b981' },
    { id: 'managers', label: 'Managers', color: '#3b82f6' },
    { id: 'customers', label: 'Customers', color: '#8b5cf6' },
    { id: 'centers', label: 'Centers', color: '#f59e0b' },
    { id: 'crew', label: 'Crew', color: '#ef4444' },
    { id: 'warehouses', label: 'Warehouses', color: '#eab308' },
    { id: 'services', label: 'Services', color: '#06b6d4' },
    { id: 'orders', label: 'Orders', color: '#6366f1' },
    { id: 'products', label: 'Products & Supplies', color: '#ec4899' },
    { id: 'training', label: 'Training & Procedures', color: '#14b8a6' },
    { id: 'reports', label: 'Reports & Feedback', color: '#64748b' }
  ];

  const mockContractors = [
    {
      id: 'CON-001',
      managerId: 'MGR-001',
      companyName: 'Network',
      status: 'active'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
          CKS Directory - Complete Business Intelligence
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          At-a-glance directory showing essential fields. Click on ID to view detailed profile with complete information.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', padding: '8px 0' }}>
        {directoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? tab.color : '#f3f4f6',
              color: activeTab === tab.id ? 'white' : '#374151',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search contractors... (first 25 rows shown)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#111827',
            fontSize: '14px'
          }}
        />
      </div>

      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {directoryTabs.find(t => t.id === activeTab)?.label} Directory ({activeTab === 'contractors' ? 1 : 0} entries)
          </h2>
        </div>
        
        {activeTab === 'contractors' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>CONTRACTOR ID</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>CKS MANAGER</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>COMPANY NAME</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>STATUS</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {mockContractors.map((contractor) => (
                  <tr key={contractor.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: 12, color: '#111827' }}>{contractor.id}</td>
                    <td style={{ padding: 12, color: '#111827' }}>{contractor.managerId}</td>
                    <td style={{ padding: 12, color: '#111827' }}>{contractor.companyName}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        backgroundColor: contractor.status === 'active' ? '#10b981' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {contractor.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #e5e7eb',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          Details
                        </button>
                        <button style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', backgroundColor: '#ffffff' }}>
            No {directoryTabs.find(t => t.id === activeTab)?.label.toLowerCase()} found
          </div>
        )}
      </div>
    </div>
  );
}
