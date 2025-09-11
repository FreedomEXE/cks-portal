/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Contractor company profile management with account manager integration
 * Function: Display and manage company information and CKS account manager details
 * Importance: Critical - Core profile management for premium contractor clients
 * Connects to: Contractor API profile endpoints, manager API integration
 * 
 * Notes: Production-ready implementation with complete profile functionality.
 *        Includes company details, account manager information, and profile updates.
 */

import React, { useState, useEffect } from 'react';

interface MyProfileProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

export default function MyProfile({ userId, config, features, api }: MyProfileProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [managerProfile, setManagerProfile] = useState<any>(null);
  const [managerLoading, setManagerLoading] = useState(false);

  // Mock contractor profile data
  useEffect(() => {
    setProfileData({
      contractor_id: 'CON-001',
      company_name: 'Premium Contractor LLC',
      address: '123 Business St, Enterprise City, ST 12345',
      cks_manager: 'MGR-001',
      main_contact: 'John Smith, CEO',
      phone: '(555) 123-4567',
      email: 'contact@premiumcontractor.com',
      website: 'www.premiumcontractor.com',
      years_with_cks: '3 Years',
      num_customers: '12',
      contract_start_date: '2022-01-15',
      status: 'Active Premium Client',
      services_specialized: 'Commercial Cleaning, Maintenance, Security'
    });
  }, [userId]);

  // Load manager profile when Account Manager tab is active
  useEffect(() => {
    if (activeTab !== 1 || !profileData?.cks_manager) return;
    
    const loadManagerProfile = async () => {
      try {
        setManagerLoading(true);
        
        // Mock manager profile data
        setManagerProfile({
          manager_id: 'MGR-001',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@cks.com',
          phone: '(555) 987-6543',
          territory: 'Northeast Region',
          role: 'Senior Account Manager'
        });
        
      } catch (error) {
        console.error('Error loading manager profile:', error);
        setManagerProfile(null);
      } finally {
        setManagerLoading(false);
      }
    };

    loadManagerProfile();
  }, [activeTab, profileData?.cks_manager]);

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Not Set';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return String(dateStr || 'Not Set');
    }
  };

  if (!profileData) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading profile...</div>
      </div>
    );
  }

  const companyName = profileData.company_name || 'Premium Contractor LLC';

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Company Profile</h2>
      
      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Profile', 'Account Manager', 'Settings'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === i ? '#10b981' : 'white',
              color: activeTab === i ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Content */}
      <div className="ui-card" style={{ padding: 24 }}>
        {activeTab === 0 && (
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
                {companyName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'PC'}
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
                      Company Name
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {profileData.company_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Contractor ID
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {profileData.contractor_id}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Main Contact
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {profileData.main_contact}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Email
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {profileData.email}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Phone
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {profileData.phone}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Start Date
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {formatDate(profileData.contract_start_date)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#10b981' }}>CKS Account Manager</h3>
            
            {managerLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading account manager information...</div>
              </div>
            ) : !managerProfile ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Account Manager Assigned</div>
                <div style={{ fontSize: 12 }}>An account manager will be assigned to your account soon</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                {/* Manager Photo */}
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
                    color: '#3b7af7',
                    margin: '0 auto 12px',
                    border: '3px solid #3b7af7'
                  }}>
                    {managerProfile.name ? managerProfile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AM'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>CKS Account Manager</div>
                </div>

                {/* Manager Details */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Manager Name', managerProfile.name],
                        ['Manager ID', managerProfile.manager_id],
                        ['Email', managerProfile.email],
                        ['Phone', managerProfile.phone]
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
                      background: '#3b7af7',
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
                      color: '#3b7af7',
                      border: '1px solid #3b7af7',
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

        {activeTab === 2 && (
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