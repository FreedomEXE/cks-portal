import React, { useState } from 'react';
import { AdminUsersSection } from '../../../../../packages/domain-widgets/src/admin';

interface CreateProps {
  onDirectoryUpdate?: (users: any[]) => void;
}

export default function Create({ onDirectoryUpdate }: CreateProps) {
  const [selectedUserType, setSelectedUserType] = useState('contractor');
  const [activeTab, setActiveTab] = useState('users');
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    mainContact: '',
    phone: '',
    email: '',
    website: ''
  });

  const userTypes = [
    { value: 'contractor', label: 'Contractor - Create new contractor company' },
    { value: 'manager', label: 'Manager - Create new manager account' },
    { value: 'customer', label: 'Customer - Create new customer account' },
    { value: 'center', label: 'Center - Create new center location' },
    { value: 'crew', label: 'Crew - Create new crew team' },
    { value: 'warehouse', label: 'Warehouse - Create new warehouse facility' }
  ];

  const createTabs = [
    { id: 'users', label: 'Users' },
    { id: 'services', label: 'Services' },
    { id: 'products', label: 'Products & Supplies' },
    { id: 'training', label: 'Training & Procedures' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating', selectedUserType, 'with data:', formData);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', margin: 0 }}>Create</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {createTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? '#3b82f6' : '#f3f4f6',
              color: activeTab === tab.id ? 'white' : '#374151',
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <AdminUsersSection
          onDirectoryUpdate={onDirectoryUpdate}
          adminId="ADMIN-001"
        />
      )}

      {activeTab !== 'users' && (
        <div className="ui-card" style={{ padding: 48, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Create {createTabs.find(t => t.id === activeTab)?.label}
          </h2>
          <p style={{ color: '#6b7280' }}>
            {createTabs.find(t => t.id === activeTab)?.label} creation interface coming soon
          </p>
        </div>
      )}
    </div>
  );
}
