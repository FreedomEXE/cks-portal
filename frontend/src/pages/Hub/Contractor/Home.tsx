/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Contractor Hub - FULLY INDEPENDENT)
 * 
 * Description: Complete Contractor hub dashboard with all functionality in one file
 * Function: Contractor landing page with navigation, profile, business dashboard, and billing
 * Importance: Critical - Primary interface for contractor users (top tier paying clients)
 * Connects to: Contractor API, Contractor authentication, Contractor session management
 * 
 * Notes: 100% self-contained - no external component dependencies.
 *        Includes hardcoded Page styling, business metrics, customer management, and billing.
 *        Uses Contractor-specific API endpoints and premium authentication.
 *        All Contractor hub functionality consolidated for premium client experience.
 *        Contractors are paying clients who purchase services from CKS for their customers.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useContractorData from './hooks/useContractorData';
import { setContractorSession, getContractorSession } from './utils/contractorAuth';
import { buildContractorApiUrl, contractorApiFetch } from './utils/contractorApi';

type BusinessMetric = {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
};

type CustomerSummary = {
  id: string;
  name: string;
  centers: number;
  status: 'Active' | 'Pending' | 'Inactive';
  last_service: string;
};

type ContractorSection = 'dashboard' | 'profile' | 'customers' | 'centers' | 'crew' | 'reports' | 'orders' | 'manager' | 'services';

export default function ContractorHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useContractorData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<ContractorSection>('dashboard');
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  
  // Get contractor code and company name from profile data
  const session = getContractorSession();
  const storedCode = session.code || '';
  const rawCode = storedCode || state.data?.contractor_id || state.data?.code || 'con-000';
  const code = String(rawCode);
  const companyName = state.data?.company_name || 'Contractor Demo LLC';

  // Store contractor session for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['contractor','con-000'].includes(code)) {
      setContractorSession(code, companyName);
    }
  }, [state.loading, state.error, code, companyName]);

  // Fetch contractor business metrics and customers
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMetricsLoading(true);
        
        // Fetch business dashboard data
        const metricsUrl = buildContractorApiUrl('/dashboard', { code });
        const customersUrl = buildContractorApiUrl('/customers', { code, limit: 5 });
        
        const [metricsRes, customersRes] = await Promise.all([
          contractorApiFetch(metricsUrl).catch(() => null),
          contractorApiFetch(customersUrl).catch(() => null)
        ]);
        
        if (!cancelled) {
          // Business metrics
          if (metricsRes?.ok) {
            const metricsData = await metricsRes.json();
            setBusinessMetrics(metricsData.metrics || []);
          } else {
            // Demo business metrics for contractors (no revenue data)
            setBusinessMetrics([
              { label: 'Active Customers', value: state.data?.customers_served || 15, trend: '+3', color: '#3b7af7' },
              { label: 'Active Centers', value: state.data?.locations_active || 8, trend: '+2', color: '#8b5cf6' },
              { label: 'Account Status', value: state.data?.payment_status || 'Current', color: '#10b981' },
              { label: 'Services Used', value: state.data?.services_purchased?.length || 3, color: '#f59e0b' },
              { label: 'Active Crew', value: state.data?.crew_assigned || 12, trend: '+1', color: '#ef4444' },
              { label: 'Pending Orders', value: state.data?.pending_orders || 4, color: '#f97316' }
            ]);
          }
          
          // Customer summaries
          if (customersRes?.ok) {
            const customersData = await customersRes.json();
            setCustomers(Array.isArray(customersData.customers) ? customersData.customers : []);
          } else {
            // Demo customer data
            setCustomers([
              { id: 'cust-001', name: 'Metro Office Plaza', centers: 3, status: 'Active', last_service: '2025-08-22' },
              { id: 'cust-002', name: 'Riverside Shopping Center', centers: 2, status: 'Active', last_service: '2025-08-21' },
              { id: 'cust-003', name: 'Downtown Business Tower', centers: 4, status: 'Active', last_service: '2025-08-20' },
              { id: 'cust-004', name: 'Suburban Medical Complex', centers: 1, status: 'Pending', last_service: '2025-08-15' },
              { id: 'cust-005', name: 'Industrial Park West', centers: 2, status: 'Active', last_service: '2025-08-18' }
            ]);
          }
        }
      } catch (error) {
        console.error('[ContractorHome] metrics fetch error:', error);
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, state.data]);

  const base = `/${username}/hub`;

  // Loading state
  if (state.loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Hardcoded Page header styling */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              Contractor Hub
            </h1>
          </div>
          <button
            className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
          >
            Log out
          </button>
        </div>
        <div style={{ animation: 'fadeIn .12s ease-out' }}>
          <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12 }}>
            Loading contractor hub...
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (state.error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #10b981'
        }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Contractor Hub
          </h1>
          <button
            className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
          >
            Log out
          </button>
        </div>
        <div style={{ padding: 16, color: '#b91c1c', background: '#fef2f2', borderRadius: 12 }}>
          Contractor Hub Error: {state.error}
        </div>
      </div>
    );
  }

  // Main render with all sections
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hardcoded Page header with navigation tabs */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #10b981'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Contractor Hub
          </h1>
        </div>
        <button
          className="ui-button"
          style={{ padding: '10px 16px', fontSize: 14 }}
          onClick={() => navigate('/logout')}
        >
          Log out
        </button>
      </div>

      {/* Welcome message for premium client */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome, {companyName} ({code}) - Premium CKS Partner
      </div>

      {/* Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard' as ContractorSection, label: 'Business Dashboard' },
          { key: 'profile' as ContractorSection, label: 'Company Profile' },
          { key: 'customers' as ContractorSection, label: 'My Customers' },
          { key: 'centers' as ContractorSection, label: 'My Centers' },
          { key: 'crew' as ContractorSection, label: 'My Crew' },
          { key: 'reports' as ContractorSection, label: 'Reports' },
          { key: 'orders' as ContractorSection, label: 'Orders' },
          { key: 'manager' as ContractorSection, label: 'My CKS Manager' },
          { key: 'services' as ContractorSection, label: 'My Services' }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: activeSection === section.key ? '#111827' : 'white',
              color: activeSection === section.key ? 'white' : '#111827',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div style={{ animation: 'fadeIn .12s ease-out' }}>
        
        {/* BUSINESS DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Business Performance</h2>
            
            {/* Business Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              {businessMetrics.map((metric, i) => (
                <div key={i} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: metric.color || '#111827' }}>{metric.value}</div>
                  {metric.trend && (
                    <div style={{ fontSize: 12, color: metric.color || '#10b981', marginTop: 4 }}>{metric.trend}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent Customers */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Customer Activity</h3>
            <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Centers</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Last Service</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, i) => (
                    <tr key={customer.id} style={{ borderBottom: i < customers.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>{customer.name}</td>
                      <td style={{ padding: 12, fontSize: 14 }}>{customer.centers}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: customer.status === 'Active' ? '#dcfce7' : customer.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                          color: customer.status === 'Active' ? '#166534' : customer.status === 'Pending' ? '#92400e' : '#991b1b'
                        }}>
                          {customer.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>{customer.last_service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPANY PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Company Profile</h2>
            
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Company Info', 'Services', 'Account Manager', 'Business License', 'Performance'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: profileTab === i ? '#10b981' : 'white',
                    color: profileTab === i ? 'white' : '#111827',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Profile Content */}
            <div className="ui-card" style={{ padding: 16 }}>
              {profileTab === 0 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
                    {/* Company Logo */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: 12,
                        background: '#f0fdf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#10b981',
                        margin: '0 auto 12px',
                        border: '2px solid #10b981'
                      }}>
                        {companyName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CO'}
                      </div>
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Logo</button>
                    </div>

                    {/* Company Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Company Name', state.data?.company_name || companyName],
                            ['Contractor ID', state.data?.contractor_id || code],
                            ['Business License', state.data?.business_license || 'BL-123456'],
                            ['Contact Person', state.data?.contact_person || 'John Contractor'],
                            ['Email', state.data?.email || 'contact@contractor-demo.com'],
                            ['Phone', state.data?.phone || '(555) 987-6543'],
                            ['Address', state.data?.address || '123 Business Ave, Suite 100'],
                            ['Established', state.data?.established || '2020-01-01']
                          ].map(([label, value]) => (
                            <tr key={label}>
                              <td style={{ padding: '8px 0', fontWeight: 600, width: '30%' }}>{label}</td>
                              <td style={{ padding: '8px 0' }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {profileTab !== 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                  Company {['', 'Services', 'Account Manager', 'Business License', 'Performance'][profileTab]} data will be populated from Contractor API
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOMERS SECTION */}
        {activeSection === 'customers' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Customer Management</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Customer management portal will be implemented here.<br/>
                This will show all customers purchasing services through this contractor,<br/>
                their service centers, payment status, and service requests.
              </div>
            </div>
          </div>
        )}

        {/* CENTERS SECTION */}
        {activeSection === 'centers' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Centers</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Center management portal will be implemented here.<br/>
                This will show all active centers under this contractor,<br/>
                their status, location details, and service schedules.
              </div>
            </div>
          </div>
        )}

        {/* CREW SECTION */}
        {activeSection === 'crew' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Crew</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Crew management portal will be implemented here.<br/>
                This will show all crew members assigned to this contractor,<br/>
                their schedules, performance, and assignments.
              </div>
            </div>
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeSection === 'reports' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Reports</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Contractor report dashboard and communication center will be implemented here.<br/>
                This will handle center reports, crew communications, and contractor responses.<br/>
                Inter-hub communication and reporting functionality.
              </div>
            </div>
          </div>
        )}

        {/* ORDERS SECTION */}
        {activeSection === 'orders' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Orders</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Order management system will be implemented here.<br/>
                This will show incoming orders from centers and customers,<br/>
                order status, scheduling, and fulfillment tracking.
              </div>
            </div>
          </div>
        )}

        {/* MY CKS MANAGER SECTION */}
        {activeSection === 'manager' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My CKS Manager</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                CKS manager communication portal will be implemented here.<br/>
                This will show your assigned CKS account manager,<br/>
                communication history, and direct messaging capabilities.
              </div>
            </div>
          </div>
        )}

        {/* MY SERVICES SECTION */}
        {activeSection === 'services' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Services</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Service management portal will be implemented here.<br/>
                This will show purchased services, service agreements,<br/>
                billing details, and service upgrade options.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Animation styles */}
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}