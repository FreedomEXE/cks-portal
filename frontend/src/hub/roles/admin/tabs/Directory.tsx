import React, { useState } from 'react';
import { User } from '../../../../packages/domain-widgets/src/admin/types';

interface DirectoryProps {
  users?: User[];
  onUserUpdate?: (user: User) => void;
}

export default function Directory({ users = [], onUserUpdate }: DirectoryProps) {
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

  // Use provided users or fallback to mock data
  const mockContractors = users.length > 0 ?
    users.filter(user => user.role === 'contractor' && user.status !== 'archived') :
    [
      {
        id: 'CON-001',
        role: 'contractor' as const,
        status: 'active' as const,
        assignmentStatus: 'assigned' as const,
        assignedTo: 'MNG-001',
        assignedToRole: 'manager' as const,
        companyName: 'Network',
        createdDate: '2025-09-19',
        startDate: '2025-09-19',
        lastUpdated: '2025-09-19',
        createdBy: 'ADMIN-001',
        children: [],
        childrenRoles: []
      }
    ];

  const mockManagers = users.length > 0 ?
    users.filter(user => user.role === 'manager' && user.status !== 'archived') :
    [
      {
        id: 'MNG-001',
        role: 'manager' as const,
        status: 'active' as const,
        assignmentStatus: 'assigned' as const,
        name: 'John Manager',
        email: 'john@cks.com',
        createdDate: '2025-09-19',
        startDate: '2025-09-19',
        lastUpdated: '2025-09-19',
        createdBy: 'ADMIN-001',
        children: ['CON-001'],
        childrenRoles: ['contractor']
      }
    ];

  const mockCustomers = users.filter(user => user.role === 'customer' && user.status !== 'archived');
  const mockCenters = users.filter(user => user.role === 'center' && user.status !== 'archived');
  const mockCrew = users.filter(user => user.role === 'crew' && user.status !== 'archived');
  const mockWarehouses = users.filter(user => user.role === 'warehouse' && user.status !== 'archived');

  // Get the appropriate data for the active tab
  const getActiveTabData = () => {
    switch (activeTab) {
      case 'contractors':
        return mockContractors;
      case 'managers':
        return mockManagers;
      case 'customers':
        return mockCustomers;
      case 'centers':
        return mockCenters;
      case 'crew':
        return mockCrew;
      case 'warehouses':
        return mockWarehouses;
      default:
        return [];
    }
  };

  const activeTabData = getActiveTabData();

  // Filter by search term
  const filteredData = activeTabData.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchLower) ||
      (item.companyName && item.companyName.toLowerCase().includes(searchLower)) ||
      (item.name && item.name.toLowerCase().includes(searchLower))
    );
  });

  const getAssignmentDisplay = (user: User): string => {
    if (user.assignmentStatus === 'unassigned') {
      return 'Unassigned';
    }
    if (user.assignedTo) {
      return user.assignedTo;
    }
    return 'N/A';
  };

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
            {directoryTabs.find(t => t.id === activeTab)?.label} Directory ({filteredData.length} entries)
          </h2>
        </div>

        {filteredData.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', backgroundColor: '#ffffff' }}>
            No {directoryTabs.find(t => t.id === activeTab)?.label.toLowerCase()} found
            {searchTerm && <div style={{ marginTop: 8, fontSize: 12 }}>Try adjusting your search term</div>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>
                    {activeTab.toUpperCase().slice(0, -1)} ID
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>
                    {activeTab === 'managers' ? 'NAME' : 'ASSIGNED TO'}
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>
                    {activeTab === 'managers' || activeTab === 'crew' ? 'NAME' : 'COMPANY NAME'}
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>STATUS</th>
                  <th style={{ textAlign: 'left', padding: 12, color: '#374151', fontWeight: 600 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: 12, color: '#111827', fontWeight: 600 }}>{user.id}</td>
                    <td style={{ padding: 12, color: '#111827' }}>
                      {activeTab === 'managers' ?
                        (user.name || 'N/A') :
                        getAssignmentDisplay(user)
                      }
                    </td>
                    <td style={{ padding: 12, color: '#111827' }}>
                      {user.companyName || user.name || 'N/A'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        backgroundColor: user.status === 'active' ? '#10b981' : user.assignmentStatus === 'unassigned' ? '#f59e0b' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {user.assignmentStatus === 'unassigned' ? 'Unassigned' : user.status}
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
                        <button
                          onClick={() => onUserUpdate && onUserUpdate({...user, status: 'archived'})}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
