import React, { useState } from 'react';

export default function Assign() {
  const [selectedUserType, setSelectedUserType] = useState('contractors');
  
  const userTypes = [
    { value: 'contractors', label: 'Unassigned - Contractors' },
    { value: 'managers', label: 'Unassigned - Managers' },
    { value: 'customers', label: 'Unassigned - Customers' },
    { value: 'centers', label: 'Unassigned - Centers' },
    { value: 'crew', label: 'Unassigned - Crew' },
    { value: 'warehouses', label: 'Unassigned - Warehouses' }
  ];

  const smartRules = [
    'Contractor -> Manager',
    'Customer -> Contractor', 
    'Center -> Customer',
    'Crew -> Manager',
    'Warehouse -> Manager'
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
          Smart Assignment System
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Select users from unassigned pools and assign them to appropriate roles
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Smart Rules:</span>
          {smartRules.map((rule, index) => (
            <span key={index} style={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#374151',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12
            }}>
              {rule}
            </span>
          ))}
        </div>
      </div>

      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          Select Unassigned User Type
        </h2>
        
        <div style={{ marginBottom: 16 }}>
          <select
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value)}
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
            {userTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Select a user type to view and assign unassigned users from that category.
        </p>
      </div>

      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {userTypes.find(t => t.value === selectedUserType)?.label} (0)
          </h2>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>Select users to assign to appropriate roles</p>
        </div>
        
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 18, marginBottom: 8 }}>
            No unassigned {selectedUserType} found
          </div>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            All {selectedUserType} have been assigned to appropriate roles or there are no pending assignments.
          </p>
        </div>
      </div>
    </div>
  );
}

