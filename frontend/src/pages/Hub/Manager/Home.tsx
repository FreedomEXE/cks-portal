/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Manager Hub - FULLY INDEPENDENT)
 * 
 * Description: Complete Manager hub dashboard with all functionality in one file
 * Function: Manager landing page with navigation, profile, reports, and news
 * Importance: Critical - Primary interface for manager users with full feature set
 * Connects to: Manager API, Manager authentication, Manager session management
 * 
 * Notes: 100% self-contained - no external component dependencies.
 *        Includes hardcoded Page styling, NavCards, NewsPreview, and Profile tabs.
 *        Uses Manager-specific API endpoints and authentication.
 *        All Manager hub functionality consolidated for template clarity.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useManagerData from './hooks/useManagerData';
import { setManagerSession, getManagerSession } from './utils/managerAuth';
import { buildManagerApiUrl, managerApiFetch } from './utils/managerApi';

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

type ManagerSection = 'dashboard' | 'profile' | 'reports' | 'orders' | 'news';

export default function ManagerHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useManagerData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<ManagerSection>('dashboard');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  
  // Get manager code and name from profile data
  const session = getManagerSession();
  const storedCode = session.code || '';
  const rawCode = storedCode || state.data?.manager_id || state.data?.code || 'mgr-000';
  const code = String(rawCode);
  const name = state.data?.name || 'Manager Demo';

  // Store manager session for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['manager','mgr-000'].includes(code)) {
      setManagerSession(code, name);
    }
  }, [state.loading, state.error, code, name]);

  // Fetch manager-specific news
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setNewsLoading(true);
        const url = buildManagerApiUrl('/news', { code, limit: 3 });
        const r = await managerApiFetch(url);
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setNewsItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) {
          // Manager demo news
          setNewsItems([
            { id: 1, title: "Territory performance review scheduled for Q4", date: "2025-08-15", scope: "manager" },
            { id: 2, title: "New contractor onboarding process updated", date: "2025-08-12", scope: "manager" },
            { id: 3, title: "Center capacity reports now available", date: "2025-08-10", scope: "manager" },
          ]);
        }
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const base = `/${username}/hub`;

  // Icon button style for navigation
  const iconBtnStyle = {
    width: 38,
    height: 38,
    borderRadius: 999,
    padding: 0,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    border: '1px solid #e5e7eb',
    background: 'white',
    cursor: 'pointer'
  };

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
          borderTop: '4px solid #3b7af7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              Manager Hub
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
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
            Loading manager hub...
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
          borderTop: '4px solid #3b7af7'
        }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Manager Hub
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
          Manager Hub Error: {state.error}
        </div>
      </div>
    );
  }

  // Main render with all sections
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* OG MANAGER HUB TEMPLATE DATA - Field names from original spreadsheet */}
      <div className="ui-card" style={{ margin: '24px 0 16px', padding: 16, borderTop: '4px solid #3b82f6' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#3b82f6' }}>
          🔗 CKS Brain Template Data (Field Names Only)
        </h2>
        
        {/* Profile Template Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Manager Profile Fields</h3>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
              • Full Name<br/>
              • Reports To<br/>
              • Manager ID<br/>
              • Role<br/>
              • Start Date<br/>
              • Years with Company<br/>
              • Primary Region<br/>
              • Email<br/>
              • Languages<br/>
              • Phone<br/>
              • Emergency Contact<br/>
              • Home Address<br/>
              • LinkedIn<br/>
              • Status<br/>
              • Availability<br/>
              • Preferred Areas<br/>
              • QR Code<br/>
              • Synced with Portal
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Hub Tabs Structure</h3>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
              • Dashboard (Territory Overview)<br/>
              • Profile (Personal & Work Details)<br/>
              • Reports (Performance Analytics)<br/>
              • Orders (Service Coordination)<br/>
              • News (Updates & Communications)
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Management Scope</h3>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
              • Assigned Contractors<br/>
              • Territory Customers<br/>
              • Center Oversight<br/>
              • Crew Coordination<br/>
              • Performance Reviews<br/>
              • Business Development
            </div>
          </div>
        </div>
        
        {/* Relationship Data Template */}
        <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#3b82f6' }}>Smart ID Relationships</h3>
          <div style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 }}>
            <strong>Template:</strong> MGR-001 → Oversees: CON-001, CON-002 → Customers: CUS-001, CUS-002 → Centers: Multiple locations → Crew: Territory staff<br/>
            <strong>When logged in:</strong> Dashboard shows only this manager's assigned contractors, customers, centers, and crew
          </div>
        </div>
      </div>

      {/* Hardcoded Page header with navigation tabs */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #3b7af7'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Manager Hub
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

      {/* Welcome message */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome, {name} ({code})!
      </div>

      {/* Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard' as ManagerSection, label: 'Dashboard' },
          { key: 'profile' as ManagerSection, label: 'My Profile' },
          { key: 'reports' as ManagerSection, label: 'Reports' },
          { key: 'orders' as ManagerSection, label: 'Orders' },
          { key: 'news' as ManagerSection, label: 'News' }
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
        
        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manager Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {[
                { title: 'Contractors', subtitle: 'Manage contractors', count: '12 Active' },
                { title: 'Centers', subtitle: 'Territory centers', count: '8 Locations' },
                { title: 'Crew', subtitle: 'Crew oversight', count: '45 Members' },
                { title: 'Services', subtitle: 'Service management', count: '23 Services' },
                { title: 'Reports', subtitle: 'Territory reports', count: '5 Pending' },
                { title: 'Documents', subtitle: 'Contracts & files', count: '89 Files' },
              ].map(card => (
                <div key={card.title} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{card.subtitle}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#3b7af7' }}>{card.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manager Profile</h2>
            
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Profile', 'Centers', 'Crew', 'Services', 'Performance'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: profileTab === i ? '#3b7af7' : 'white',
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
                    {/* Manager Avatar */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#6b7280',
                        margin: '0 auto 12px'
                      }}>
                        {name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'MG'}
                      </div>
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Change Photo</button>
                    </div>

                    {/* Manager Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Full Name', state.data?.name || 'Manager Demo'],
                            ['Manager ID', state.data?.manager_id || code],
                            ['Territory', state.data?.territory || 'Demo Territory'],
                            ['Reports To', state.data?.reports_to || 'Senior Manager'],
                            ['Email', state.data?.email || 'manager@demo.com'],
                            ['Phone', state.data?.phone || '(555) 123-4567'],
                            ['Start Date', state.data?.start_date || '2024-01-01'],
                            ['Role', state.data?.role || 'Territory Manager']
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
                  Manager {['', 'Centers', 'Crew', 'Services', 'Performance'][profileTab]} data will be populated from Manager API
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeSection === 'reports' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manager Reports</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Manager report dashboard and communication center will be implemented here.<br/>
                This will handle center reports, crew communications, and manager responses.
              </div>
            </div>
          </div>
        )}

        {/* ORDERS SECTION */}
        {activeSection === 'orders' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manager Orders</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Manager order coordination system will be implemented here.<br/>
                This will handle order routing, crew assignments, and order fulfillment<br/>
                coordination across the territory.
              </div>
            </div>
          </div>
        )}

        {/* NEWS SECTION */}
        {activeSection === 'news' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manager News & Updates</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              {newsLoading ? (
                <div style={{ color: '#6b7280' }}>Loading manager news...</div>
              ) : (
                <div>
                  {newsItems.map((item) => (
                    <div key={String(item.id)} style={{ 
                      padding: '12px 0', 
                      borderBottom: '1px solid #e5e7eb',
                      ':last-child': { borderBottom: 'none' }
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                      {item.date && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.date}</div>
                      )}
                    </div>
                  ))}
                  {newsItems.length === 0 && (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
                      No manager updates available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Animation styles */}
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}