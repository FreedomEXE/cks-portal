import React, { useState } from 'react';

export default function Create() {
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
        <div style={{ display: 'grid', gap: 24 }}>
          <div className="ui-card" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Create Users</h2>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>Create and provision all types of CKS Portal users</p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Select User Type</label>
              <select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
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
                {userTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ui-card" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
              Create {userTypes.find(t => t.value === selectedUserType)?.label.split(' - ')[0]}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>Create new contractor company</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  placeholder="Enter company address"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Main Contact</label>
                <input
                  type="text"
                  value={formData.mainContact}
                  onChange={(e) => handleInputChange('mainContact', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  placeholder="Enter main contact name"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 8 }}>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  placeholder="Enter website URL"
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Create {userTypes.find(t => t.value === selectedUserType)?.label.split(' - ')[0]}
              </button>
            </form>
          </div>
        </div>
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
