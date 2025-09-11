/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Warehouse staff profile management
 * Function: Display and manage warehouse employee information and supervisor contact
 * Importance: Critical - Personal profile management for warehouse staff
 * Connects to: Warehouse API profile endpoints, management integration
 */

import React, { useState, useEffect } from 'react';

interface MyProfileProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface WarehouseProfile {
  employee_id: string;
  full_name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  shift_schedule: string;
  hire_date: string;
  certifications: string;
  clearance_level: string;
  supervisor: {
    name: string;
    email: string;
    phone: string;
    supervisor_id: string;
  };
}

export default function MyProfile({ userId, config, features, api }: MyProfileProps) {
  const [profileTab, setProfileTab] = useState(0);
  const [warehouseData, setWarehouseData] = useState<WarehouseProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouseProfile();
  }, [userId]);

  const loadWarehouseProfile = async () => {
    setLoading(true);
    try {
      setWarehouseData({
        employee_id: 'WH-001',
        full_name: 'Sarah Warehouse',
        role: 'Inventory Specialist',
        department: 'Warehouse Operations',
        phone: '(555) 456-7890',
        email: 'sarah@warehouse.com',
        shift_schedule: 'Day Shift (8AM-4PM)',
        hire_date: '2024-02-10',
        certifications: 'Forklift Operation, Inventory Management, Safety Training',
        clearance_level: 'Level 2',
        supervisor: {
          name: 'Mike Warehouse Manager',
          email: 'mike.manager@warehouse.com',
          phone: '(555) 678-9012',
          supervisor_id: 'WH-MGR-001'
        }
      });
    } catch (error) {
      console.error('Error loading warehouse profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading profile...</div>
      </div>
    );
  }

  if (!warehouseData) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error loading warehouse profile</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        My Profile
      </h2>

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['Profile', 'Supervisor', 'Settings'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setProfileTab(i)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: profileTab === i ? '#8b5cf6' : 'white',
              color: profileTab === i ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Content */}
      <div className="ui-card" style={{ padding: 24 }}>
        {profileTab === 0 && (
          <div style={{ display: 'flex', gap: 32 }}>
            {/* Profile Photo - Left Side */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                color: '#6b7280',
                fontWeight: 'bold',
                marginBottom: 16
              }}>
                {warehouseData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </div>
              <button style={{
                padding: '8px 16px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                Update Photo
              </button>
            </div>

            {/* Profile Info Grid - Right Side */}
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', borderSpacing: '0 16px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, width: '200px', verticalAlign: 'top' }}>
                      Full Name
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.full_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Employee ID
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.employee_id}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Role
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.role}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Department
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.department}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Email
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.email}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Phone
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.phone}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Shift Schedule
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.shift_schedule}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Clearance Level
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {warehouseData.clearance_level}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profileTab === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#8b5cf6' }}>Supervisor Contact</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
              {/* Supervisor Photo */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#8b5cf6',
                  margin: '0 auto 12px',
                  border: '3px solid #8b5cf6'
                }}>
                  {warehouseData.supervisor.name ? warehouseData.supervisor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'WM'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Warehouse Supervisor</div>
              </div>

              {/* Supervisor Details */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Supervisor Name', warehouseData.supervisor.name],
                      ['Supervisor ID', warehouseData.supervisor.supervisor_id],
                      ['Email', warehouseData.supervisor.email],
                      ['Phone', warehouseData.supervisor.phone]
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ 
                          padding: '12px 0', 
                          fontWeight: 600, 
                          width: '40%',
                          color: '#374151',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          {label}
                        </td>
                        <td style={{ 
                          padding: '12px 0', 
                          color: '#6b7280',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          {value || 'Not Available'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                  <button style={{
                    padding: '8px 16px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    Contact Supervisor
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    background: 'white',
                    color: '#8b5cf6',
                    border: '1px solid #8b5cf6',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {profileTab === 2 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' }}>
              Settings
            </h3>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
              Settings options will be displayed here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}