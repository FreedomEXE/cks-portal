/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Crew member profile management
 * Function: Display and manage crew member information and supervisor contact
 * Importance: Critical - Personal profile management for crew members
 * Connects to: Crew API profile endpoints, supervisor integration
 */

import React, { useState, useEffect } from 'react';

interface MyProfileProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface CrewProfile {
  crew_id: string;
  full_name: string;
  reports_to: string;
  primary_region: string;
  phone: string;
  email: string;
  emergency_contact: string;
  home_address: string;
  start_date: string;
  status: string;
  account_manager: {
    name: string;
    email: string;
    phone: string;
    manager_id: string;
  };
}

export default function MyProfile({ userId, config, features, api }: MyProfileProps) {
  const [profileTab, setProfileTab] = useState(0);
  const [crewData, setCrewData] = useState<CrewProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCrewProfile();
  }, [userId]);

  const loadCrewProfile = async () => {
    setLoading(true);
    try {
      setCrewData({
        crew_id: 'CREW-001',
        full_name: 'John Crew Member',
        reports_to: 'Alex Johnson - Site Supervisor',
        primary_region: 'Downtown Metro Area',
        phone: '(555) 345-6789',
        email: 'john@crew-member.com',
        emergency_contact: 'Jane Doe - Spouse (555) 123-4567',
        home_address: '123 Main St, Downtown City, ST 12345',
        start_date: '2024-03-15',
        status: 'Active',
        account_manager: {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@cks.com',
          phone: '(555) 567-8901',
          manager_id: 'MGR-001'
        }
      });
    } catch (error) {
      console.error('Error loading crew profile:', error);
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

  if (!crewData) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error loading crew profile</div>
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
              background: profileTab === i ? '#10b981' : 'white',
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
                {crewData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
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
                      {crewData.full_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Crew ID
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.crew_id}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Reports To
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.reports_to}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Primary Region
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.primary_region}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Email
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.email}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Phone
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.phone}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Emergency Contact
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.emergency_contact}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Home Address
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.home_address}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Start Date
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {crewData.start_date}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Status
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      <span style={{ 
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#dcfce7',
                        color: '#166534',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        {crewData.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profileTab === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#10b981' }}>CKS Account Manager</h3>
            
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
                  color: '#10b981',
                  margin: '0 auto 12px',
                  border: '3px solid #10b981'
                }}>
                  {crewData.account_manager.name ? crewData.account_manager.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AM'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Account Manager</div>
              </div>

              {/* Account Manager Details */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Manager Name', crewData.account_manager.name],
                      ['Manager ID', crewData.account_manager.manager_id],
                      ['Email', crewData.account_manager.email],
                      ['Phone', crewData.account_manager.phone]
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
                    background: '#10b981',
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
                    color: '#10b981',
                    border: '1px solid #10b981',
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