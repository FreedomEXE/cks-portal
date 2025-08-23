/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Customer Hub - FULLY INDEPENDENT)
 * 
 * Description: Complete Customer hub dashboard with all functionality in one file
 * Function: Customer landing page with navigation, profile, center management, and reports
 * Importance: Critical - Primary interface for customer users (center managers)
 * Connects to: Customer API, Customer authentication, Customer session management
 * 
 * Notes: 100% self-contained - no external component dependencies.
 *        Includes hardcoded Page styling, center management focus, and crew coordination.
 *        Uses Customer-specific API endpoints and center manager authentication.
 *        All Customer hub functionality consolidated for center management experience.
 *        Customers manage centers through contractor arrangements with CKS.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCustomerData from './hooks/useCustomerData';
import { setCustomerSession, getCustomerSession } from './utils/customerAuth';
import { buildCustomerApiUrl, customerApiFetch } from './utils/customerApi';

type CenterSummary = {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Maintenance' | 'Offline';
  crew_count: number;
  last_service: string;
};

type ServiceRequest = {
  id: string;
  center: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed';
  date: string;
};

type CustomerSection = 'dashboard' | 'profile' | 'centers' | 'crew' | 'reports' | 'orders' | 'services';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useCustomerData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<CustomerSection>('dashboard');
  const [centers, setCenters] = useState<CenterSummary[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  
  // Get customer code and name from profile data
  const session = getCustomerSession();
  const storedCode = session.code || '';
  const rawCode = storedCode || state.data?.customer_id || state.data?.code || 'cust-000';
  const code = String(rawCode);
  const customerName = state.data?.customer_name || 'Customer Demo Corp';

  // Store customer session for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['customer','cust-000'].includes(code)) {
      setCustomerSession(code, customerName);
    }
  }, [state.loading, state.error, code, customerName]);

  // Fetch customer centers and service data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDataLoading(true);
        
        // Fetch center and service data
        const centersUrl = buildCustomerApiUrl('/centers', { code });
        const requestsUrl = buildCustomerApiUrl('/requests', { code, limit: 5 });
        
        const [centersRes, requestsRes] = await Promise.all([
          customerApiFetch(centersUrl).catch(() => null),
          customerApiFetch(requestsUrl).catch(() => null)
        ]);
        
        if (!cancelled) {
          // Center summaries
          if (centersRes?.ok) {
            const centersData = await centersRes.json();
            setCenters(Array.isArray(centersData.centers) ? centersData.centers : []);
          } else {
            // Demo center data
            setCenters([
              { id: 'center-001', name: 'Downtown Office Complex', location: 'Downtown', status: 'Active', crew_count: 3, last_service: '2025-08-22' },
              { id: 'center-002', name: 'North District Plaza', location: 'North District', status: 'Active', crew_count: 2, last_service: '2025-08-21' },
              { id: 'center-003', name: 'West Side Mall', location: 'West Side', status: 'Maintenance', crew_count: 4, last_service: '2025-08-20' },
              { id: 'center-004', name: 'East End Warehouse', location: 'East End', status: 'Active', crew_count: 2, last_service: '2025-08-19' },
              { id: 'center-005', name: 'South Park Complex', location: 'South Park', status: 'Active', crew_count: 3, last_service: '2025-08-18' }
            ]);
          }
          
          // Service requests
          if (requestsRes?.ok) {
            const requestsData = await requestsRes.json();
            setServiceRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
          } else {
            // Demo service requests
            setServiceRequests([
              { id: 'req-001', center: 'Downtown Office Complex', type: 'Cleaning', priority: 'High', status: 'Open', date: '2025-08-23' },
              { id: 'req-002', center: 'North District Plaza', type: 'Maintenance', priority: 'Medium', status: 'In Progress', date: '2025-08-22' },
              { id: 'req-003', center: 'West Side Mall', type: 'Security', priority: 'Low', status: 'Completed', date: '2025-08-21' }
            ]);
          }
        }
      } catch (error) {
        console.error('[CustomerHome] data fetch error:', error);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const base = `/${username}/hub`;

  // Loading state
  if (state.loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Hardcoded Page header styling - Blue theme */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #eab308'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              Customer Hub
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
          <div style={{ padding: 16, background: '#fefce8', borderRadius: 12 }}>
            Loading customer hub...
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
          borderTop: '4px solid #eab308'
        }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Customer Hub
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
          Customer Hub Error: {state.error}
        </div>
      </div>
    );
  }

  // Main render with all sections
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hardcoded Page header with navigation tabs - Blue theme */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #eab308'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Customer Hub
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

      {/* Welcome message for center manager */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome, {customerName} ({code}) - Center Manager
      </div>

      {/* Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard' as CustomerSection, label: 'Center Dashboard' },
          { key: 'profile' as CustomerSection, label: 'Customer Profile' },
          { key: 'centers' as CustomerSection, label: 'My Centers' },
          { key: 'crew' as CustomerSection, label: 'My Crew' },
          { key: 'reports' as CustomerSection, label: 'Reports' },
          { key: 'orders' as CustomerSection, label: 'Orders' },
          { key: 'services' as CustomerSection, label: 'My Services' }
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
        
        {/* CENTER DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Center Management Overview</h2>
            
            {/* Center Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Active Centers', value: state.data?.centers_managed || 5, trend: '+1', color: '#eab308' },
                { label: 'Total Locations', value: state.data?.total_locations || 8, trend: '+2', color: '#8b5cf6' },
                { label: 'Account Status', value: state.data?.account_status || 'Active', color: '#10b981' },
                { label: 'Service Level', value: state.data?.service_level || 'Standard', color: '#f59e0b' },
                { label: 'Crew Assigned', value: state.data?.crew_assigned || 8, trend: '+1', color: '#ef4444' },
                { label: 'Pending Requests', value: state.data?.pending_requests || 2, color: '#f97316' }
              ].map((metric, i) => (
                <div key={i} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: metric.color || '#111827' }}>{metric.value}</div>
                  {metric.trend && (
                    <div style={{ fontSize: 12, color: metric.color || '#eab308', marginTop: 4 }}>{metric.trend}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Upsell Services Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <button style={{
                padding: 20,
                borderRadius: 12,
                border: '2px solid #eab308',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
                color: '#92400e',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                🛠️ REQUEST SERVICES
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                  Cleaning • Maintenance • Security • More
                </div>
              </button>
              
              <button style={{
                padding: 20,
                borderRadius: 12,
                border: '2px solid #f59e0b',
                background: 'linear-gradient(135deg, #fed7aa 0%, #f59e0b 100%)',
                color: '#9a3412',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                📦 REQUEST PRODUCTS
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                  Supplies • Equipment • Materials • More
                </div>
              </button>
            </div>

            {/* Centers Overview */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Center Status Overview</h3>
            <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Center</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Location</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Crew</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Last Service</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.map((center, i) => (
                    <tr key={center.id} style={{ borderBottom: i < centers.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>{center.name}</td>
                      <td style={{ padding: 12, fontSize: 14 }}>{center.location}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: center.status === 'Active' ? '#dbeafe' : center.status === 'Maintenance' ? '#fef3c7' : '#fee2e2',
                          color: center.status === 'Active' ? '#1e40af' : center.status === 'Maintenance' ? '#92400e' : '#991b1b'
                        }}>
                          {center.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>{center.crew_count}</td>
                      <td style={{ padding: 12, fontSize: 14 }}>{center.last_service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Customer Profile</h2>
            
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Customer Info', 'Centers', 'Contract', 'Contact Manager', 'Service Areas'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: profileTab === i ? '#eab308' : 'white',
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
                    {/* Customer Logo */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: 12,
                        background: '#fefce8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#eab308',
                        margin: '0 auto 12px',
                        border: '2px solid #eab308'
                      }}>
                        {customerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CU'}
                      </div>
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Logo</button>
                    </div>

                    {/* Customer Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Customer Name', state.data?.customer_name || customerName],
                            ['Customer ID', state.data?.customer_id || code],
                            ['Account Type', state.data?.account_type || 'Corporate'],
                            ['Contact Person', state.data?.contact_person || 'Jane Customer'],
                            ['Email', state.data?.email || 'contact@customer-demo.com'],
                            ['Phone', state.data?.phone || '(555) 456-7890'],
                            ['Address', state.data?.address || '456 Corporate Blvd, Suite 200'],
                            ['Established', state.data?.established || '2021-01-01']
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
                  Customer {['', 'Centers', 'Contract', 'Contact Manager', 'Service Areas'][profileTab]} data will be populated from Customer API
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTERS SECTION */}
        {activeSection === 'centers' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Center Management</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Detailed center management portal will be implemented here.<br/>
                This will show comprehensive center information, schedules, and management tools<br/>
                for all centers under this customer account.
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
                Crew coordination portal will be implemented here.<br/>
                This will show crew members assigned to customer centers,<br/>
                their schedules, and coordination with center operations.
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
                Customer report dashboard and communication center will be implemented here.<br/>
                This will handle center reports, service communications, and customer responses.<br/>
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
                This will show service orders from centers, order status,<br/>
                and coordination with contractor services.
              </div>
            </div>
          </div>
        )}

        {/* SERVICES SECTION */}
        {activeSection === 'services' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Services</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Service management portal will be implemented here.<br/>
                This will show available services, service agreements,<br/>
                and service configuration for customer centers.
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