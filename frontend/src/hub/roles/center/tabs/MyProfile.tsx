/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Center profile management with facility information
 * Function: Display and manage center information and customer contact details  
 * Importance: Critical - Core profile management for center facilities
 * Connects to: Center API profile endpoints, customer integration
 */

import React, { useState, useEffect } from 'react';

interface MyProfileProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface CenterProfile {
  center_name: string;
  center_id: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  account_manager: {
    name: string;
    manager_id: string;
    email: string;
    phone: string;
  };
}

export default function MyProfile({ userId, config, features, api }: MyProfileProps) {
  const [profileTab, setProfileTab] = useState(0);
  const [centerData, setCenterData] = useState<CenterProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Load center profile data
  useEffect(() => {
    loadCenterProfile();
  }, [userId]);

  const loadCenterProfile = async () => {
    setLoading(true);
    try {
      // Mock center profile data
      setCenterData({
        center_name: 'Downtown Service Center',
        center_id: 'CTR-001',
        address: '123 Main Street, Business District, ST 12345',
        phone: '(555) 234-5678',
        email: 'manager@downtown-center.com',
        website: 'www.downtown-center.com',
        account_manager: {
          name: 'Alex Johnson',
          manager_id: 'MGR-001',
          email: 'alex.johnson@cks.com',
          phone: '(555) 567-8901'
        }
      });
    } catch (error) {
      console.error('Error loading center profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading profile...</div>
      </div>
    );
  }

  if (!centerData) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error loading center profile</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        My Profile
      </h2>

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['Profile', 'Account Manager', 'Settings'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setProfileTab(i)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: profileTab === i ? '#3b82f6' : 'white',
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
                🏢
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
                      Center Name
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {centerData.center_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Center ID
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {centerData.center_id}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Address
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {centerData.address}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Phone
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {centerData.phone}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Email
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {centerData.email}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Website
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {centerData.website}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profileTab === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#059669' }}>CKS Account Manager</h3>
            
            {centerData.account_manager.name === 'Not Assigned' ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Account Manager Assigned</div>
                <div style={{ fontSize: 12 }}>An account manager will be assigned to your center soon</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                {/* Account Manager Photo */}
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
                    color: '#059669',
                    margin: '0 auto 12px',
                    border: '3px solid #059669'
                  }}>
                    {centerData.account_manager.name ? centerData.account_manager.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AM'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>CKS Account Manager</div>
                </div>

                {/* Account Manager Details */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Manager Name', centerData.account_manager.name],
                        ['Manager ID', centerData.account_manager.manager_id],
                        ['Email', centerData.account_manager.email],
                        ['Phone', centerData.account_manager.phone]
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
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}>
                      Contact Manager
                    </button>
                    <button style={{
                      padding: '8px 16px',
                      background: 'white',
                      color: '#059669',
                      border: '1px solid #059669',
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
            )}
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