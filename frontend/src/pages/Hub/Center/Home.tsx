/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Center Hub - FULLY INDEPENDENT)
 * 
 * Description: Complete Center hub dashboard with all functionality in one file
 * Function: Center landing page with navigation, profile, crew coordination, and operational metrics
 * Importance: Critical - Primary interface for center users (facility coordinators)
 * Connects to: Center API, Center authentication, Center session management
 * 
 * Notes: 100% self-contained - no external component dependencies.
 *        Includes hardcoded Page styling, crew coordination focus, and operational tools.
 *        Uses Center-specific API endpoints and facility coordinator authentication.
 *        All Center hub functionality consolidated for operational coordination experience.
 *        Centers coordinate crew operations and report to customer managers.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCenterData from './hooks/useCenterData';
import { setCenterSession, getCenterSession } from './utils/centerAuth';
import { buildCenterApiUrl, centerApiFetch } from './utils/centerApi';
import CenterLogoutButton from './components/LogoutButton';
import CenterNewsPreview from './components/NewsPreview';

type CrewMember = {
  id: string;
  name: string;
  status: 'On Duty' | 'Off Duty' | 'Break';
  shift: string;
  area: string;
  last_update: string;
};

type OperationalMetric = {
  label: string;
  value: string | number;
  status?: 'Good' | 'Warning' | 'Critical';
  change?: string;
};

type CenterSection = 'dashboard' | 'profile' | 'services' | 'crew' | 'reports' | 'support';

export default function CenterHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useCenterData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<CenterSection>('dashboard');
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [metrics, setMetrics] = useState<OperationalMetric[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  
  // Get center code and name from profile data
  const session = getCenterSession();
  const storedCode = session.code || '';
  const rawCode = storedCode || state.data?.center_id || state.data?.code || 'CEN-000';
  const code = String(rawCode);
  const centerName = state.data?.name || state.data?.center_name || 'Center Demo';

  // Store center session for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['center','001-D'].includes(code)) {
      setCenterSession(code, centerName);
    }
  }, [state.loading, state.error, code, centerName]);

  // Fetch center operational data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDataLoading(true);
        
        // Fetch crew and metrics data
        const crewUrl = buildCenterApiUrl('/crew', { code });
        const metricsUrl = buildCenterApiUrl('/metrics', { code });
        
        const [crewRes, metricsRes] = await Promise.all([
          centerApiFetch(crewUrl).catch(() => null),
          centerApiFetch(metricsUrl).catch(() => null)
        ]);
        
        if (!cancelled) {
          // Crew data
          if (crewRes?.ok) {
            const crewData = await crewRes.json();
            const items = Array.isArray(crewData?.data) ? crewData.data : (Array.isArray(crewData?.crew) ? crewData.crew : []);
            setCrewMembers(items);
          } else {
            // Demo crew data
            setCrewMembers([
              { id: 'crew-001', name: 'Sarah Johnson', status: 'On Duty', shift: 'Day', area: 'North Wing', last_update: '10:30 AM' },
              { id: 'crew-002', name: 'Mike Chen', status: 'On Duty', shift: 'Day', area: 'South Wing', last_update: '10:25 AM' },
              { id: 'crew-003', name: 'Lisa Rodriguez', status: 'Break', shift: 'Day', area: 'Main Lobby', last_update: '10:15 AM' },
              { id: 'crew-004', name: 'James Wilson', status: 'Off Duty', shift: 'Night', area: 'Security', last_update: '6:00 AM' }
            ]);
          }
          
          // Metrics data
          if (metricsRes?.ok) {
            const metricsData = await metricsRes.json();
            const items = Array.isArray(metricsData?.data) ? metricsData.data : (Array.isArray(metricsData?.metrics) ? metricsData.metrics : []);
            setMetrics(items);
          } else {
            // Demo metrics
            setMetrics([
              { label: 'Active Crew', value: 3, status: 'Good', change: '+1' },
              { label: 'Areas Covered', value: '4/5', status: 'Warning' },
              { label: 'Last Inspection', value: '2 hours ago', status: 'Good' },
              { label: 'Safety Score', value: '98%', status: 'Good', change: '+2%' },
              { label: 'Equipment Status', value: '95%', status: 'Good' },
              { label: 'Incident Reports', value: 0, status: 'Good' }
            ]);
          }
        }
      } catch (error) {
        console.error('[CenterHome] data fetch error:', error);
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
        {/* Hardcoded Page header styling - Orange theme */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #f97316'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              Center Hub
            </h1>
          </div>
          <CenterLogoutButton />
        </div>
        <div className="animate-pulse" style={{ padding: 16 }}>
          Loading center hub...
        </div>
      </div>
    );
  }
  
  // Error state
  if (state.error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Hardcoded Page header styling - Orange theme */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #f97316'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              Center Hub
            </h1>
          </div>
          <CenterLogoutButton />
        </div>
        <div style={{ padding: 16, color: '#b91c1c' }}>
          Error: {state.error}
        </div>
      </div>
    );
  }

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>
              Welcome to {centerName} ({code})! Monitor crew operations and facility coordination.
            </div>
            
            {/* Center Dashboard */}
            <div className="ui-card" style={{ marginBottom: 24, borderTop: '3px solid #f97316' }}>
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Center Dashboard</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8,
                  borderLeft: '4px solid #10b981'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Crew Today</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                    {crewMembers.length}
                    <span style={{ fontSize: 12, color: '#10b981', marginLeft: 8 }}>
                      Active
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8,
                  borderLeft: '4px solid #f97316'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Open Requests</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                    3
                    <span style={{ fontSize: 12, color: '#f97316', marginLeft: 8 }}>
                      Pending
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8,
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>This Week</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                    12
                    <span style={{ fontSize: 12, color: '#3b82f6', marginLeft: 8 }}>
                      Services
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8,
                  borderLeft: '4px solid #8b5cf6'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Facility Status</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                    Good
                    <span style={{ fontSize: 12, color: '#10b981', marginLeft: 8 }}>
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Crew */}
            <div className="ui-card" style={{ marginBottom: 24 }}>
              <div className="title" style={{ marginBottom: 16 }}>Active Crew Status</div>
              {dataLoading ? (
                <div style={{ color: '#6b7280' }}>Loading crew data...</div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {crewMembers.map((member) => (
                    <div key={member.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      borderLeft: `4px solid ${
                        member.status === 'On Duty' ? '#10b981' : 
                        member.status === 'Break' ? '#eab308' : '#6b7280'
                      }`
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {member.area} • {member.shift} Shift
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: 12, 
                          fontWeight: 600,
                          color: member.status === 'On Duty' ? '#10b981' : 
                                member.status === 'Break' ? '#eab308' : '#6b7280'
                        }}>
                          {member.status}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          {member.last_update}
                        </div>
                      </div>
                    </div>
                  ))}
                  {crewMembers.length === 0 && (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                      No active crew members
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <button
                className="ui-card"
                style={{ 
                  padding: 24, 
                  cursor: 'pointer',
                  border: '2px solid #10b981',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 16,
                  fontWeight: 700
                }}
                onClick={() => {
                  // TODO: Implement service request modal/flow
                  alert('New Service Request - Coming Soon!');
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>🔧</div>
                <div>New Service Request</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Request cleaning, maintenance, or specialized services</div>
              </button>
              
              <button
                className="ui-card"
                style={{ 
                  padding: 24, 
                  cursor: 'pointer',
                  border: '2px solid #3b82f6',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 16,
                  fontWeight: 700
                }}
                onClick={() => {
                  // TODO: Implement product request modal/flow
                  alert('New Product Request - Coming Soon!');
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>📦</div>
                <div>New Product Request</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Order supplies, equipment, or materials</div>
              </button>
            </div>

            {/* Communication Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* News & Updates */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#f97316', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📰 News & Updates
                </div>
                <CenterNewsPreview code={code} />
              </div>
              
              {/* Mail & Messages */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#f97316', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                  <span style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    fontSize: 10, 
                    padding: '2px 6px', 
                    borderRadius: 12, 
                    fontWeight: 600 
                  }}>
                    3
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #f97316'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Manager - John Center</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Equipment inspection scheduled for tomorrow at 10 AM</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>2 hours ago • High Priority</div>
                  </div>
                  
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Admin - Safety Update</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>New safety protocols effective immediately</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>5 hours ago • Information</div>
                  </div>
                  
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #10b981'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Crew - Mike Johnson</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Floor cleaning in lobby completed ahead of schedule</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>1 day ago • Update</div>
                  </div>
                  
                  <button
                    style={{
                      padding: '8px 12px',
                      background: 'transparent',
                      border: '1px solid #f97316',
                      borderRadius: 6,
                      color: '#f97316',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      marginTop: 8
                    }}
                    onClick={() => {
                      // TODO: Implement full mailbox view
                      alert('Full Mailbox - Coming Soon!');
                    }}
                  >
                    View Mailbox
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        const profileTabs = [
          'Center Information',
          'Account Manager',
          'Service Information',
          'Management',
          'Operations',
          'Settings'
        ];
        
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Center Profile</h2>
            
            {/* Profile Tabs - At Top Like Crew Hub */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {profileTabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(index)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: profileTab === index ? '#f97316' : 'white',
                    color: profileTab === index ? 'white' : '#111827',
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
              <>
                {profileTab === 0 && (
                  <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
                    {/* Center Photo - Matching Crew Hub Style */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: '#fff7ed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#f97316',
                        margin: '0 auto 12px',
                        border: '2px solid #f97316'
                      }}>
                        {centerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CE'}
                      </div>
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Photo</button>
                    </div>

                    {/* Center Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Center ID', code || 'Not Set'],
                            ['Center Name', centerName || 'Not Set'],
                            ['Address', 'Not Set'],
                            ['Phone', 'Not Set'],
                            ['Email', 'Not Set'],
                            ['Website', 'Not Set'],
                            ['Social Media', 'Not Set'],
                            ['QR Code', 'Not Generated']
                          ].map(([label, value]) => (
                            <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 0', fontWeight: 600, color: '#374151', width: '40%' }}>
                                {label}:
                              </td>
                              <td style={{ padding: '12px 0', color: '#6b7280' }}>
                                {value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 1 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#f97316' }}>CKS Account Manager</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
                    {/* Manager Photo */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: '#fff7ed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#f97316',
                        margin: '0 auto 12px',
                        border: '2px solid #f97316'
                      }}>
                        MD
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Manager Demo</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Account Manager</div>
                    </div>

                    {/* Manager Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Manager Name', 'Manager Demo'],
                            ['Title', 'Senior Account Manager'],
                            ['Department', 'Customer Success'],
                            ['Email', 'manager.demo@cks-portal.com'],
                            ['Phone', '(555) 123-4567'],
                            ['Direct Line', '(555) 123-4567 ext. 1001'],
                            ['Office Location', 'CKS HQ - Building A, Floor 3'],
                            ['Assigned Since', 'January 2023'],
                            ['Specialty', 'Commercial Facility Management'],
                            ['Response Time', '< 4 hours during business hours'],
                            ['Emergency Contact', '(555) 999-0000 (24/7)'],
                            ['Preferred Contact', 'Email for non-urgent, Phone for urgent']
                          ].map(([label, value]) => (
                            <tr key={label}>
                              <td style={{ padding: '8px 0', fontWeight: 600, width: '35%' }}>{label}</td>
                              <td style={{ padding: '8px 0' }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Contact Actions */}
                      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <button style={{
                          padding: '8px 16px',
                          backgroundColor: '#f97316',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          Send Email
                        </button>
                        <button style={{
                          padding: '8px 16px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          Schedule Call
                        </button>
                        <button style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          Emergency Contact
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                
                {profileTab === 2 && (
                  <div>
                    <div className="title" style={{ marginBottom: 20, color: '#f97316' }}>Service Information</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['Service Start Date', 'Not Set'],
                          ['Status', 'Active'],
                          ['Services Active', 'Not Set'],
                          ['Service Frequency', 'Not Set'],
                          ['Facility Type', 'Commercial'],
                          ['Square Footage', 'Not Set']
                        ].map(([label, value]) => (
                          <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 0', fontWeight: 600, color: '#374151', width: '40%' }}>
                              {label}:
                            </td>
                            <td style={{ padding: '12px 0', color: '#6b7280' }}>
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {profileTab === 2 && (
                  <div>
                    <div className="title" style={{ marginBottom: 20, color: '#f97316' }}>Management</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['Manager ID (CKS)', 'Not Assigned'],
                          ['Supervisor ID (Crew Lead)', 'Not Assigned'],
                          ['Contractor ID', 'Not Assigned'],
                          ['Customer ID', 'Not Assigned']
                        ].map(([label, value]) => (
                          <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 0', fontWeight: 600, color: '#374151', width: '40%' }}>
                              {label}:
                            </td>
                            <td style={{ padding: '12px 0', color: '#6b7280' }}>
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {profileTab === 3 && (
                  <div>
                    <div className="title" style={{ marginBottom: 20, color: '#f97316' }}>Operations</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['Operating Hours', 'Not Set'],
                          ['Emergency Contact', 'Not Set'],
                          ['Special Requirements', 'Not Set']
                        ].map(([label, value]) => (
                          <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 0', fontWeight: 600, color: '#374151', width: '40%' }}>
                              {label}:
                            </td>
                            <td style={{ padding: '12px 0', color: '#6b7280' }}>
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {profileTab === 4 && (
                  <div>
                    <div className="title" style={{ marginBottom: 20, color: '#f97316' }}>Settings</div>
                    <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>
                      Settings and preferences coming soon.
                    </div>
                  </div>
                )}
              </>
            </div>
          </div>
        );

      case 'services':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="ui-card">
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Services Management</div>
              <div style={{ color: '#6b7280' }}>
                Active services, scheduling, and service history management coming soon.
              </div>
            </div>
          </div>
        );

      case 'crew':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="ui-card">
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Crew Management</div>
              <div style={{ color: '#6b7280' }}>
                Crew assignments, schedules, and performance tracking coming soon.
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="ui-card">
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Reports & Analytics</div>
              <div style={{ color: '#6b7280' }}>
                Performance reports, analytics, and data insights coming soon.
              </div>
            </div>
          </div>
        );

      case 'support':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="ui-card">
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Support & Help</div>
              <div style={{ color: '#6b7280' }}>
                Documentation, help resources, and support contacts coming soon.
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="ui-card">
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </div>
              <div style={{ color: '#6b7280' }}>
                {activeSection} functionality coming soon.
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hardcoded Page header styling - Orange theme */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #f97316'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Center Hub
          </h1>
        </div>
        
        <CenterLogoutButton />
      </div>

      {/* Welcome message for center coordinator */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome to {centerName} ({code})! Monitor crew operations and facility coordination.
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'profile', label: 'Profile' },
          { key: 'services', label: 'Services' },
          { key: 'crew', label: 'Crew' },
          { key: 'reports', label: 'Reports' },
          { key: 'support', label: 'Support' }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: activeSection === tab.key ? '#111827' : 'white',
              color: activeSection === tab.key ? 'white' : '#111827',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
      
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}
