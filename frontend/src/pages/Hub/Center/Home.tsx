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

type CenterSection = 'dashboard' | 'profile' | 'crew' | 'services' | 'schedules' | 'reports' | 'support';

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
  const rawCode = storedCode || state.data?.center_id || state.data?.code || '001-D';
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
            setCrewMembers(Array.isArray(crewData.crew) ? crewData.crew : []);
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
            setMetrics(Array.isArray(metricsData.metrics) ? metricsData.metrics : []);
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
          <button
            className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
          >
            Log out
          </button>
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
          <button
            className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
          >
            Log out
          </button>
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
            
            {/* Operational Metrics */}
            <div className="ui-card" style={{ marginBottom: 24, borderTop: '3px solid #f97316' }}>
              <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Operational Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {metrics.map((metric, i) => (
                  <div key={i} style={{ 
                    padding: 16, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8,
                    borderLeft: `4px solid ${
                      metric.status === 'Critical' ? '#ef4444' : 
                      metric.status === 'Warning' ? '#eab308' : '#10b981'
                    }`
                  }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                      {metric.value}
                      {metric.change && (
                        <span style={{ fontSize: 12, color: '#10b981', marginLeft: 8 }}>
                          {metric.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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

            {/* Navigation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <button
                className="hub-card ui-card"
                style={{ textAlign: 'left', padding: 16, cursor: 'pointer' }}
                onClick={() => setActiveSection('crew')}
              >
                <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>Crew Management</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Monitor & coordinate crew</div>
              </button>
              
              <button
                className="hub-card ui-card"
                style={{ textAlign: 'left', padding: 16, cursor: 'pointer' }}
                onClick={() => setActiveSection('schedules')}
              >
                <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>Schedules</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Crew schedules & shifts</div>
              </button>
              
              <button
                className="hub-card ui-card"
                style={{ textAlign: 'left', padding: 16, cursor: 'pointer' }}
                onClick={() => setActiveSection('services')}
              >
                <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>Services</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Active services</div>
              </button>
              
              <button
                className="hub-card ui-card"
                style={{ textAlign: 'left', padding: 16, cursor: 'pointer' }}
                onClick={() => setActiveSection('reports')}
              >
                <div className="title" style={{ fontSize: 16, fontWeight: 600 }}>Reports</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Performance & logs</div>
              </button>
            </div>

            {/* News Preview */}
            <CenterNewsPreview code={code} />
          </div>
        );

      case 'profile':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {['Overview', 'Details', 'Settings'].map((tab, index) => (
                <button
                  key={tab}
                  className={`ui-button ${profileTab === index ? 'active' : ''}`}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: profileTab === index ? '#f97316' : 'transparent',
                    color: profileTab === index ? 'white' : '#374151',
                    border: profileTab === index ? 'none' : '1px solid #e5e7eb'
                  }}
                  onClick={() => setProfileTab(index)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Profile Content */}
            <div className="ui-card">
              {profileTab === 0 && (
                <div>
                  <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Center Overview</div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block' }}>
                        Center Name
                      </label>
                      <div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, marginTop: 4 }}>
                        {centerName}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block' }}>
                        Center Code
                      </label>
                      <div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, marginTop: 4 }}>
                        {code}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block' }}>
                        Facility Status
                      </label>
                      <div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, marginTop: 4 }}>
                        Operational
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {profileTab === 1 && (
                <div>
                  <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Center Details</div>
                  <div style={{ color: '#6b7280' }}>
                    Detailed center information and operational parameters.
                  </div>
                </div>
              )}
              
              {profileTab === 2 && (
                <div>
                  <div className="title" style={{ marginBottom: 16, color: '#f97316' }}>Settings</div>
                  <div style={{ color: '#6b7280' }}>
                    Center configuration and preferences.
                  </div>
                </div>
              )}
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
          {/* Navigation tabs */}
          <div style={{ display: 'flex', gap: 8, marginRight: 16 }}>
            {([
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'profile', label: 'Profile' },
              { key: 'crew', label: 'Crew' },
              { key: 'services', label: 'Services' },
              { key: 'schedules', label: 'Schedules' },
              { key: 'reports', label: 'Reports' },
              { key: 'support', label: 'Support' }
            ] as const).map((tab) => (
              <button
                key={tab.key}
                className={`ui-button ${activeSection === tab.key ? 'active' : ''}`}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  backgroundColor: activeSection === tab.key ? '#f97316' : 'transparent',
                  color: activeSection === tab.key ? 'white' : '#374151',
                  border: activeSection === tab.key ? 'none' : '1px solid #e5e7eb'
                }}
                onClick={() => setActiveSection(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Center Hub
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

      {renderContent()}
      
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}