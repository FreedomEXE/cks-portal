/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Customer profile management matching original design
 * Function: Display customer information and account manager details
 * Importance: Critical - Customer account management and contact information
 * Connects to: Customer API, account manager system
 */

import React, { useState, useEffect } from 'react';

interface CustomerProfileProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

interface CustomerProfile {
  customer_id: string;
  customer_name: string;
  business_type: string;
  address: string;
  main_contact: string;
  phone: string;
  email: string;
  website?: string;
  years_with_cks: string;
  contract_start_date: string;
  status: string;
  centers_managed: number;
  account_manager: {
    name: string;
    email: string;
    phone: string;
    manager_id: string;
  };
}

export default function CustomerProfile({ userId, config, features, api }: CustomerProfileProps) {
  const [profileTab, setProfileTab] = useState(0);
  const [customerData, setCustomerData] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Load customer profile data
  useEffect(() => {
    loadCustomerProfile();
  }, [userId]);

  const loadCustomerProfile = async () => {
    setLoading(true);
    try {
      // Mock customer profile data matching original
      setCustomerData({
        customer_id: 'CUS-000',
        customer_name: 'Customer Demo Corp',
        business_type: 'Commercial Property Management',
        address: '456 Corporate Blvd, Suite 200',
        main_contact: 'Jane Customer',
        phone: '(555) 456-7890',
        email: 'contact@customer-demo.com',
        website: 'Not Set',
        years_with_cks: 'Not Set',
        contract_start_date: 'Not Set',
        status: 'Not Set',
        centers_managed: 0,
        account_manager: {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@cks.com',
          phone: '(555) 567-8901',
          manager_id: 'MGR-001'
        }
      });
    } catch (error) {
      console.error('Error loading customer profile:', error);
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

  if (!customerData) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error loading customer profile</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Customer Profile
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
              background: profileTab === i ? '#eab308' : 'white',
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
                CD
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
                      {customerData.main_contact}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Customer ID
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {customerData.customer_id}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Company
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {customerData.customer_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Reports To
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {customerData.account_manager.name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Email
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {customerData.email}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Phone
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {customerData.phone}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Start Date
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {customerData.contract_start_date || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profileTab === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#eab308' }}>CKS Account Manager</h3>
            
            {customerData.account_manager.name === 'Not Assigned' ? (
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
                    color: '#eab308',
                    margin: '0 auto 12px',
                    border: '3px solid #eab308'
                  }}>
                    {customerData.account_manager.name ? customerData.account_manager.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AM'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Account Manager</div>
                </div>

                {/* Manager Details */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Manager Name', customerData.account_manager.name],
                        ['Manager ID', customerData.account_manager.manager_id],
                        ['Email', customerData.account_manager.email],
                        ['Phone', customerData.account_manager.phone]
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
                      background: '#eab308',
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
                      color: '#eab308',
                      border: '1px solid #eab308',
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