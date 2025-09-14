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
import ContractorLogoutButton from './components/LogoutButton';
import ContractorEcosystemView from './components/EcosystemView';

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

type ContractorSection = 'dashboard' | 'profile' | 'services' | 'ecosystem' | 'reports' | 'orders' | 'support';

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
  const [reqBucket, setReqBucket] = useState<'pending'|'approved'|'archive'>('pending');
  const [requests, setRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{ order: any; items: any[]; approvals: any[] } | null>(null);
  // Reports viewer
  const [repTab, setRepTab] = useState<'reports'|'feedback'>('reports');
  const [reports, setReports] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [reportsTotals, setReportsTotals] = useState<any>({});
  const [feedbackTotals, setFeedbackTotals] = useState<any>({});
  const [repLoading, setRepLoading] = useState(false);
  const [archReportId, setArchReportId] = useState('');
  const [archFeedbackId, setArchFeedbackId] = useState('');
  const [repDetailOpen, setRepDetailOpen] = useState(false);
  const [repDetail, setRepDetail] = useState<any>(null);
  const [fbDetailOpen, setFbDetailOpen] = useState(false);
  const [fbDetail, setFbDetail] = useState<any>(null);
  // Activity feed
  const [activityLoading, setActivityLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  // Manager profile data for Account Manager tab
  const [managerProfile, setManagerProfile] = useState<any | null>(null);
  const [managerLoading, setManagerLoading] = useState(false);
  
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
            const items = Array.isArray(metricsData?.data) ? metricsData.data : (metricsData?.metrics || []);
            setBusinessMetrics(items);
          } else {
            // Demo business metrics for contractors (no revenue data)
            setBusinessMetrics([
              { label: 'Active Customers', value: state.data?.customers_served || 0, trend: 'No activity', color: '#3b7af7' },
              { label: 'Active Centers', value: state.data?.locations_active || 0, trend: 'No activity', color: '#8b5cf6' },
              { label: 'Account Status', value: state.data?.payment_status || 'Current', color: '#10b981' },
              { label: 'Services Used', value: state.data?.services_purchased?.length || 0, color: '#f59e0b' },
              { label: 'Active Crew', value: state.data?.crew_assigned || 0, trend: 'No activity', color: '#ef4444' },
              { label: 'Pending Orders', value: state.data?.pending_orders || 0, color: '#f97316' }
            ]);
          }
          
          // Customer summaries
          if (customersRes?.ok) {
            const customersData = await customersRes.json();
            const items = Array.isArray(customersData?.data) ? customersData.data : (Array.isArray(customersData?.customers) ? customersData.customers : []);
            setCustomers(items);
          } else {
            // Demo customer data
            setCustomers([]);
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

  // Load manager profile when Account Manager tab is active
  useEffect(() => {
    const mgrCode = (state.data?.cks_manager || '').toString();
    if (profileTab !== 1 || !mgrCode) return;
    let cancelled = false;
    (async () => {
      try {
        setManagerLoading(true);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const url = `${baseApi}/manager/profile?code=${encodeURIComponent(mgrCode)}`;
        const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
        const j = await res.json();
        if (!cancelled) setManagerProfile(res.ok ? (j?.data || null) : null);
      } catch {
        if (!cancelled) setManagerProfile(null);
      } finally {
        if (!cancelled) setManagerLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileTab, state.data?.cks_manager]);

  const base = `/${username}/hub`;

  // Fetch contractor requests per bucket
  useEffect(() => {
    if (activeSection !== 'orders') return;
    let cancelled = false;
    (async () => {
      try {
        const url = buildContractorApiUrl('/requests', { bucket: reqBucket });
        const r = await contractorApiFetch(url);
        const j = await r.json();
        const arr = Array.isArray(j?.data) ? j.data : [];
        if (!cancelled) setRequests(arr);
      } catch {
        if (!cancelled) setRequests([]);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, reqBucket]);

  // Fetch recent activity when on dashboard
  useEffect(() => {
    if (activeSection !== 'dashboard') return;
    let cancelled = false;
    (async () => {
      try {
        setActivityLoading(true);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const uc = String(code || '').toUpperCase();
        const r = await fetch(`${baseApi}/contractor/activity?code=${encodeURIComponent(uc)}`, { credentials: 'include' });
        const j = await r.json().catch(()=>({}));
        if (!cancelled && Array.isArray(j?.data)) setActivities(j.data);
      } catch {
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, code]);

  // Fetch reports/feedback when in Reports section
  useEffect(() => {
    if (activeSection !== 'reports') return;
    let cancelled = false;
    (async () => {
      try {
        setRepLoading(true);
        const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        
        if (repTab === 'reports') {
          const r = await fetch(`${base}/reports?limit=50`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) {
            setReports(Array.isArray(j?.data) ? j.data : []);
            setReportsTotals(j?.totalsByStatus || {});
          }
        } else {
          const r = await fetch(`${base}/feedback?limit=50`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) {
            setFeedback(Array.isArray(j?.data) ? j.data : []);
            setFeedbackTotals(j?.totalsByKind || {});
          }
        }
      } catch {}
      finally {
        if (!cancelled) setRepLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, repTab]);

  async function approve(id: string) {
    try {
      setActionLoading(id);
      const url = buildContractorApiUrl(`/requests/${id}/approve`);
      const r = await contractorApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: '' }) });
      if (!r.ok) throw new Error('Approve failed');
      setRequests(prev => prev.filter(x => x.order_id !== id));
      setNotice(`Approved ${id}`);
      setTimeout(()=> setNotice(null), 3000);
    } catch (e) {
      alert((e as Error).message || 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function deny(id: string) {
    try {
      setActionLoading(id);
      const url = buildContractorApiUrl(`/requests/${id}/deny`);
      const r = await contractorApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: '' }) });
      if (!r.ok) throw new Error('Deny failed');
      setRequests(prev => prev.filter(x => x.order_id !== id));
      setNotice(`Denied ${id}`);
      setTimeout(()=> setNotice(null), 3000);
    } catch (e) {
      alert((e as Error).message || 'Deny failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function openOrderDetail(orderId: string) {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api'}/orders/${orderId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load order');
      setDetail(json.data || null);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }
  function closeDetail() { setDetailOpen(false); setDetail(null); }

  // Report detail functions
  async function openReportDetail(reportId: string) {
    try {
      setRepDetailOpen(true);
      setRepDetail(null);
      const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${base}/reports/${reportId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load report');
      setRepDetail(json.data || null);
    } catch (e) {
      console.error('Error loading report:', e);
      setRepDetail(null);
    }
  }
  function closeReportDetail() { setRepDetailOpen(false); setRepDetail(null); }

  // Feedback detail functions
  async function openFeedbackDetail(feedbackId: string) {
    try {
      setFbDetailOpen(true);
      setFbDetail(null);
      const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${base}/feedback/${feedbackId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load feedback');
      setFbDetail(json.data || null);
    } catch (e) {
      console.error('Error loading feedback:', e);
      setFbDetail(null);
    }
  }
  function closeFeedbackDetail() { setFbDetailOpen(false); setFbDetail(null); }

  // Clear activity function
  async function handleClearActivity() {
    if (!confirm('Are you sure you want to clear your recent activity? This action cannot be undone.')) {
      return;
    }
    try {
      const code = state.data?.code || '';
      const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const r = await fetch(`${baseApi}/contractor/clear-activity?code=${encodeURIComponent(code)}`, { 
        method: 'POST',
        credentials: 'include' 
      });
      const j = await r.json();
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Failed to clear activity');
      setActivities([]);
    } catch (e: any) {
      console.error('Failed to clear activity:', e);
      alert('Failed to clear activity: ' + (e?.message || 'Unknown error'));
    }
  }

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
          <ContractorLogoutButton />
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
          <ContractorLogoutButton />
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
        <ContractorLogoutButton />
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
          { key: 'services' as ContractorSection, label: 'My Services' },
          { key: 'ecosystem' as ContractorSection, label: 'Ecosystem' },
          { key: 'orders' as ContractorSection, label: 'Orders' },
          { key: 'reports' as ContractorSection, label: 'Reports' },
          { key: 'support' as ContractorSection, label: 'Support' }
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

            {/* Recent Activity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Activity</h3>
              {activities.length > 0 && (
                <button 
                  onClick={handleClearActivity}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: 11, 
                    background: '#ef4444', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="ui-card" style={{ padding: 16 }}>
              {activityLoading ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Loading activity...</div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No recent activity</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Business activity will appear here as it occurs</div>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {activities.slice(0, 8).map((a:any) => {
                    const type = String(a.activity_type || '');
                    const isWelcome = type === 'user_welcome' || type === 'welcome_message';
                    if (isWelcome) {
                      return (
                        <li key={a.activity_id || `${a.description}-${a.created_at}`}
                            style={{ padding: 12, borderBottom: '1px solid #e5e7eb', fontSize: 13, background: '#ecfdf5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700, color: '#065f46' }}>Welcome</div>
                          <div style={{ margin: '2px 0', color: '#065f46' }}>{a.description}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 11, color: '#047857' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                            <button
                              style={{ padding: '6px 10px', fontSize: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => alert('Interactive walkthrough coming soon!')}
                            >
                              Launch Walkthrough
                            </button>
                          </div>
                        </li>
                      );
                    }
                    if (type === 'manager_assigned') {
                      const meta = a?.metadata || {};
                      return (
                        <li key={a.activity_id || `${a.description}-${a.created_at}`}
                            style={{ padding: 12, borderBottom: '1px solid #e5e7eb', fontSize: 13, background: '#eff6ff', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700, color: '#1e3a8a' }}>Manager Assigned</div>
                          <div style={{ margin: '2px 0', color: '#1e3a8a' }}>{a.description}</div>
                          <div style={{ fontSize: 11, color: '#1d4ed8' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                        </li>
                      );
                    }

                    return (
                      <li key={a.activity_id || `${a.description}-${a.created_at}`}
                          style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{(a.activity_type || 'activity').toString().replace(/_/g,' ')}</div>
                        <div style={{ opacity: 0.8 }}>{a.description}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Communication Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* News & Updates */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📰 News & Updates
                </div>
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  No news or updates available.
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#dcfce7',
                  color: '#10b981',
                  border: '1px solid #22c55e',
                  borderRadius: 4,
                  cursor: 'pointer',
                  marginTop: 8
                }}
                onClick={() => {
                  alert('Full News - Coming Soon!');
                }}
                >
                  View All News
                </button>
              </div>
              
              {/* Mail & Messages */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                </div>
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  No messages available.
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#dcfce7',
                  color: '#10b981',
                  border: '1px solid #22c55e',
                  borderRadius: 4,
                  cursor: 'pointer',
                  marginTop: 8
                }}
                onClick={() => {
                  alert('Full Mailbox - Coming Soon!');
                }}
                >
                  View Mailbox
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ORDERS / APPROVALS SECTION */}
        {activeSection === 'orders' && (
          <div>
            {notice && (
              <div className="card" style={{ padding: 10, marginBottom: 8, borderLeft: '4px solid #10b981', background: '#ecfdf5', color: '#065f46', fontSize: 13 }}>{notice}</div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Requests</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['pending','approved','archive'] as const).map(b => (
                <button key={b} onClick={() => setReqBucket(b)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: reqBucket===b? '#111827':'white', color: reqBucket===b? 'white':'#111827', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {b === 'pending' ? 'Pending Approvals' : b === 'approved' ? 'Approved' : 'Archive'}
                </button>
              ))}
            </div>
            <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Order ID</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Customer</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Center</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Items</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Services</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Products</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Status</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((o, i) => (
                    <tr key={o.order_id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: 10, fontFamily: 'ui-monospace', color: '#2563eb', cursor: 'pointer' }} onClick={() => openOrderDetail(o.order_id)}>{o.order_id}</td>
                      <td style={{ padding: 10 }}>{o.customer_id || '—'}</td>
                      <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>{o.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.service_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.product_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.status}</td>
                      <td style={{ padding: 10 }}>
                        {reqBucket === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button disabled={actionLoading===o.order_id} onClick={(e)=>{ e.stopPropagation?.(); approve(o.order_id); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#10b981', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                            <button disabled={actionLoading===o.order_id} onClick={(e)=>{ e.stopPropagation?.(); deny(o.order_id); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Deny</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 16, color: '#6b7280' }}>No requests in this bucket.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Order detail overlay */}
            {detailOpen && (
              <div onClick={closeDetail} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 'min(800px, 95vw)', maxHeight: '85vh', overflowY: 'auto', background: 'white', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>Order Details</div>
                    <button onClick={closeDetail} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', background: 'white', cursor: 'pointer' }}>Close</button>
                  </div>
                  {detailLoading && <div style={{ padding: 12 }}>Loading…</div>}
                  {!detailLoading && detail && (
                    <>
                      <div style={{ marginBottom: 12, fontSize: 13, color: '#374151' }}>
                        <div><b>Order ID:</b> {detail.order.order_id}</div>
                        <div><b>Status:</b> {detail.order.status}</div>
                        <div><b>Customer:</b> {detail.order.customer_id || '—'}</div>
                        <div><b>Center:</b> {detail.order.center_id || '—'}</div>
                        <div><b>Date:</b> {String(detail.order.order_date).slice(0,10)}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="card" style={{ padding: 12 }}>
                          <div style={{ fontWeight: 700, marginBottom: 8 }}>Items</div>
                          <div style={{ display: 'grid', gap: 6 }}>
                            {detail.items.map((it, idx) => (
                              <div key={it.order_item_id || idx} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: it.item_type === 'service' ? '#ecfdf5' : '#eff6ff', color: it.item_type === 'service' ? '#065f46' : '#1e40af' }}>{it.item_type}</span>
                                <span style={{ fontFamily: 'ui-monospace' }}>{it.item_id}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 12 }}>qty: {it.quantity}</span>
                              </div>
                            ))}
                            {detail.items.length === 0 && <div style={{ fontSize: 13, color: '#6b7280' }}>No items.</div>}
                          </div>
                        </div>
                        <div className="card" style={{ padding: 12 }}>
                          <div style={{ fontWeight: 700, marginBottom: 8 }}>Approvals</div>
                          <div style={{ display: 'grid', gap: 6 }}>
                            {detail.approvals.map((ap, idx) => (
                              <div key={ap.approval_id || idx} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#f3f4f6', color: '#111827' }}>{ap.approver_type}</span>
                                <span style={{ fontSize: 12 }}>{ap.status}</span>
                                {ap.decided_at && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{String(ap.decided_at).slice(0,10)}</span>}
                              </div>
                            ))}
                            {detail.approvals.length === 0 && <div style={{ fontSize: 13, color: '#6b7280' }}>No approvals yet.</div>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPANY PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Company Profile</h2>
            
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Company Info', 'Account Manager'].map((tab, i) => (
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
                        borderRadius: '50%',
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
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Photo</button>
                    </div>

                    {/* Company Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {(() => {
                            const rows: Array<[string, any]> = [
                              ['Contractor ID', state.data?.contractor_id || code],
                              ['Company Name', state.data?.company_name || companyName],
                              ['Address', state.data?.address || 'Not Set'],
                              ['CKS Manager (Assigned)', state.data?.cks_manager || 'Not Assigned'],
                              ['Main Contact', state.data?.main_contact || 'Not Set'],
                              ['Phone', state.data?.phone || 'Not Set'],
                              ['Email', state.data?.email || 'Not Set'],
                              ['Website', state.data?.website || 'Not Set'],
                              ['Years with CKS', state.data?.years_with_cks || '0 Years'],
                              ['# of Customers', state.data?.num_customers || '0'],
                              ['Contract Start Date', state.data?.contract_start_date || ''],
                              ['Status', state.data?.status || 'Not Set'],
                              ['Services Specialized In', state.data?.services_specialized || 'Not Set']
                            ];
                            function fmtDate(v: any) {
                              try { if (!v) return 'Not Set'; const d=new Date(v); if(isNaN(d.getTime())) return String(v); return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'});} catch { return String(v||'Not Set'); }
                            }
                            return rows.map(([label, val]) => {
                              const display = label === 'Contract Start Date' ? fmtDate(val) : String(val ?? '');
                              return (
                                <tr key={label}>
                                  <td style={{ padding: '8px 0', fontWeight: 600, width: '30%' }}>{label}</td>
                                  <td style={{ padding: '8px 0' }}>{display}</td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {profileTab === 1 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#10b981' }}>CKS Account Manager</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
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
                        border: '2px solid #3b7af7'
                      }}>
                        '--'
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Account Manager</div>
                    </div>

                    {/* Manager Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {(() => {
                            const mgr = (state.data as any)?.account_manager || null;
                            const rows: Array<[string, any]> = [
                              ['Manager Name', (mgr?.name || mgr?.manager_name) || 'Not Assigned'],
                              ['Manager ID', mgr?.manager_id || 'Not Assigned'],
                              ['Email', mgr?.email || 'Not Assigned'],
                              ['Phone', mgr?.phone || 'Not Assigned']
                            ];
                            return rows.map(([label, value]) => (
                              <tr key={label}>
                                <td style={{ padding: '8px 0', fontWeight: 600, width: '40%' }}>{label}</td>
                                <td style={{ padding: '8px 0', color: '#6b7280' }}>{value}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}

        {/* ECOSYSTEM SECTION */}
        {activeSection === 'ecosystem' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Ecosystem</h2>
            <ContractorEcosystemView code={code} />
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeSection === 'reports' && (
          <>
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="title" style={{ marginBottom: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
              Reports & Feedback
              <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
                <button onClick={() => setRepTab('reports')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: repTab === 'reports' ? '#10b981' : 'white', color: repTab === 'reports' ? 'white' : '#111827', fontSize: 12, fontWeight: 700 }}>Reports</button>
                <button onClick={() => setRepTab('feedback')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: repTab === 'feedback' ? '#10b981' : 'white', color: repTab === 'feedback' ? 'white' : '#111827', fontSize: 12, fontWeight: 700 }}>Feedback</button>
              </div>
            </div>

            {repTab === 'reports' ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[
                    { k: 'open', label: 'Open', v: reportsTotals.open },
                    { k: 'in_progress', label: 'In Progress', v: reportsTotals.in_progress },
                    { k: 'resolved', label: 'Resolved', v: reportsTotals.resolved },
                    { k: 'closed', label: 'Closed', v: reportsTotals.closed },
                  ].map(({ k, label, v }) => (
                    <span key={k} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{label}: {v}</span>
                  ))}
                </div>

                <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Title</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Type</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Severity</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Status</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>By</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repLoading && (
                        <tr><td colSpan={6} style={{ padding: 16 }}>Loading...</td></tr>
                      )}
                      {!repLoading && reports.map((r, i) => (
                        <tr key={r.report_id} onClick={() => openReportDetail(r.report_id)} style={{ cursor: 'pointer', borderBottom: i < reports.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{r.title}</td>
                          <td style={{ padding: 10 }}>{r.type}</td>
                          <td style={{ padding: 10 }}>{r.severity || '—'}</td>
                          <td style={{ padding: 10 }}>{r.status}</td>
                          <td style={{ padding: 10, fontSize: 12, color: '#6b7280' }}>{r.created_by_role}:{r.created_by_id}</td>
                          <td style={{ padding: 10 }}>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!repLoading && reports.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 16, color: '#6b7280' }}>No reports yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[
                    { k: 'praise', label: 'Praise', v: feedbackTotals.praise },
                    { k: 'request', label: 'Requests', v: feedbackTotals.request },
                    { k: 'issue', label: 'Issues', v: feedbackTotals.issue },
                  ].map(({ k, label, v }) => (
                    <span key={k} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{label}: {v}</span>
                  ))}
                </div>

                <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Title</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Kind</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>By</th>
                        <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repLoading && (
                        <tr><td colSpan={4} style={{ padding: 16 }}>Loading...</td></tr>
                      )}
                      {!repLoading && feedback.map((f, i) => (
                        <tr key={f.feedback_id} onClick={() => openFeedbackDetail(f.feedback_id)} style={{ cursor: 'pointer', borderBottom: i < feedback.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{f.title}</td>
                          <td style={{ padding: 10 }}>{f.kind}</td>
                          <td style={{ padding: 10, fontSize: 12, color: '#6b7280' }}>{f.created_by_role}:{f.created_by_id}</td>
                          <td style={{ padding: 10 }}>{new Date(f.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!repLoading && feedback.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: 16, color: '#6b7280' }}>No feedback yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Archive - Open by ID */}
          <div className="ui-card" style={{ padding: 12, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Archive Search</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Report ID (e.g., RPT-1001)" value={archReportId} onChange={e => setArchReportId(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') { const id = archReportId.trim(); if (id) await openReportDetail(id); } }} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 200 }} />
              <button onClick={async () => { const id = archReportId.trim(); if (id) await openReportDetail(id); }} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white' }}>Open Report</button>
              <input placeholder="Feedback ID (e.g., FDB-1001)" value={archFeedbackId} onChange={e => setArchFeedbackId(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') { const id = archFeedbackId.trim(); if (id) await openFeedbackDetail(id); } }} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 200 }} />
              <button onClick={async () => { const id = archFeedbackId.trim(); if (id) await openFeedbackDetail(id); }} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white' }}>Open Feedback</button>
            </div>
          </div>

          {/* Report Detail Overlay */}
          {repDetailOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={closeReportDetail}>
              <div className="ui-card" style={{ width: 720, maxWidth: '90%', padding: 16 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800 }}>Report Detail</div>
                  <button onClick={closeReportDetail} style={{ padding: 6, border: '1px solid #e5e7eb', borderRadius: 999, background: 'white' }}>✕</button>
                </div>
                {!repDetail && <div style={{ color: '#6b7280' }}>Loading...</div>}
                {!!repDetail && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{repDetail.report.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{repDetail.report.type} • {repDetail.report.severity || '—'} • {repDetail.report.status}</div>
                      <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{repDetail.report.description || 'No description.'}</div>
                      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600 }}>Comments:</div>
                      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginTop: 4 }}>
                        {repDetail.comments.map(c => (
                          <div key={c.comment_id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{c.commenter_role}:{c.commenter_id} • {new Date(c.created_at).toLocaleString()}</div>
                            <div style={{ fontSize: 13, marginTop: 2 }}>{c.content}</div>
                          </div>
                        ))}
                        {repDetail.comments.length === 0 && (<div style={{ color: '#6b7280' }}>No comments yet.</div>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Created: {new Date(repDetail.report.created_at).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Updated: {new Date(repDetail.report.updated_at).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>By {repDetail.report.created_by_role}:{repDetail.report.created_by_id}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Detail Overlay */}
          {fbDetailOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={closeFeedbackDetail}>
              <div className="ui-card" style={{ width: 600, maxWidth: '90%', padding: 16 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800 }}>Feedback Detail</div>
                  <button onClick={closeFeedbackDetail} style={{ padding: 6, border: '1px solid #e5e7eb', borderRadius: 999, background: 'white' }}>✕</button>
                </div>
                {!fbDetail && <div style={{ color: '#6b7280' }}>Loading...</div>}
                {!!fbDetail && (
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{fbDetail.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{fbDetail.kind} • {fbDetail.center_id || fbDetail.customer_id} • {new Date(fbDetail.created_at).toLocaleString()}</div>
                    <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{fbDetail.message || 'No message.'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>By {fbDetail.created_by_role}:{fbDetail.created_by_id}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
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

        {/* SUPPORT SECTION */}
        {activeSection === 'support' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Support</h2>
            
            {/* Support ticket form */}
            <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Submit Support Ticket</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#6b7280' }}>Issue Type</label>
                    <select style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4 }}>
                      <option value="bug">Bug Report</option>
                      <option value="how_to">How-To Question</option>
                      <option value="feature_question">Feature Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6b7280' }}>Priority</label>
                    <select style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4 }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Subject</label>
                  <input 
                    placeholder="Brief description of your issue"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4 }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Please provide detailed information about your issue"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Steps to Reproduce (optional)</label>
                  <textarea 
                    rows={3}
                    placeholder="If applicable, list the steps that lead to this issue"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button 
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb', 
                      background: 'white', 
                      fontSize: 14, 
                      cursor: 'pointer' 
                    }}
                  >
                    Clear
                  </button>
                  <button 
                    onClick={async (e) => {
                      const form = e.target.closest('.ui-card');
                      const issueType = form.querySelector('select').value;
                      const priority = form.querySelectorAll('select')[1].value;
                      const subject = form.querySelector('input').value;
                      const description = form.querySelector('textarea').value;
                      const stepsToReproduce = form.querySelectorAll('textarea')[1].value;
                      
                      if (!subject || !description) {
                        alert('Please fill in subject and description');
                        return;
                      }
                      
                      try {
                        const response = await fetch('/api/support/tickets', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            user_id: code,
                            user_role: 'contractor',
                            user_hub: 'contractor',
                            issue_type: issueType,
                            priority: priority,
                            subject: subject,
                            description: description,
                            steps_to_reproduce: stepsToReproduce,
                            browser_info: navigator.userAgent,
                            current_url: window.location.href
                          })
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to submit support ticket');
                        }
                        
                        const result = await response.json();
                        alert(`Support ticket ${result.data.ticket_id} submitted successfully!`);
                        
                        // Clear form
                        form.querySelector('input').value = '';
                        form.querySelector('textarea').value = '';
                        form.querySelectorAll('textarea')[1].value = '';
                      } catch (error) {
                        alert('Failed to submit support ticket. Please try again.');
                        console.error('Support ticket submission error:', error);
                      }
                    }}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      border: 'none', 
                      background: '#10b981', 
                      color: 'white', 
                      fontSize: 14, 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    Submit Ticket
                  </button>
                </div>
              </div>
            </div>
            
            {/* Support info */}
            <div className="ui-card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Premium Support</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Technical Support</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>For app-related issues and questions</div>
                  <div style={{ fontSize: 13, color: '#10b981', marginTop: 4, fontWeight: 600 }}>Priority Response: 1-4 hours</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Account Manager</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>For business and contract questions</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>See Profile → Account Manager</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY SERVICES SECTION */}
        {activeSection === 'services' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Services</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Manage your selected services and favorites. Favorites (max 3) appear on your profile as “Services Specialized In”.</div>
              <button
                onClick={() => window.location.assign('/catalog?type=service&context=contractor')}
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#111827', color: 'white', fontSize: 12, fontWeight: 600 }}
              >
                Browse CKS Catalog
              </button>
            </div>
            <ContractorMyServices code={code} />
          </div>
        )}

      </div>

      {/* Animation styles */}
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}

function ContractorMyServices({ code }: { code?: string }) {
  const [loading, setLoading] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [msg, setMsg] = React.useState<string | null>(null);

  const base = '/api/contractor';

  async function load() {
    try {
      setLoading(true);
      const url = code ? `${base}/my-services?code=${encodeURIComponent(code)}` : `${base}/my-services`;
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const j = await r.json();
      if (r.ok && j?.success) {
        const rows = j.data.selected || [];
        setSelectedRows(rows);
        setSelected(rows.map((s:any)=>s.service_id));
        setFavorites(rows.filter((s:any)=>s.is_favorite).map((s:any)=>s.service_id));
      } else {
        setMsg(j?.error || 'Failed to load services');
      }
    } catch (e:any) {
      setMsg(e?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [code]);

  function toggleSelected(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
    setFavorites(prev => prev.filter(x => x !== id));
  }

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      if (prev.includes(id)) return prev.filter(x=>x!==id);
      if (prev.length >= 3) { setMsg('You can only favorite up to 3 services'); return prev; }
      if (!selected.includes(id)) setSelected(s => [...s, id]);
      return [...prev, id];
    });
  }

  async function saveSelected() {
    try {
      setMsg(null);
      const r = await fetch(`${base}/my-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, services: selected })
      });
      const j = await r.json();
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Save failed');
      setMsg('Saved selections');
    } catch (e:any) {
      setMsg(e?.message || 'Save failed');
    }
  }

  async function saveFavorites() {
    try {
      setMsg(null);
      const r = await fetch(`${base}/my-services/favorites`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, favorites })
      });
      const j = await r.json();
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Save favorites failed');
      setMsg('Saved favorites');
    } catch (e:any) {
      setMsg(e?.message || 'Save favorites failed');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>My Services</div>
        {loading && <div style={{ fontSize: 12, color: '#6b7280' }}>Loading…</div>}
      </div>
      {msg && <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="ui-card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>My Selected Services</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {selected.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6b7280' }}>No services selected yet.</div>
            ) : (
              selected.map(id => {
                const svc = selectedRows.find((s:any)=>s.service_id===id);
                const isFav = favorites.includes(id);
                if (!svc) return null;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{svc.service_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{svc.category || ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => toggleFavorite(id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: isFav ? '#10b981' : 'white', color: isFav ? 'white' : '#111827' }}>★</button>
                      <button onClick={() => toggleSelected(id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Remove</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={saveSelected} className="btn" style={{ padding: '8px 12px', background: '#10b981', color: 'white', borderRadius: 6, border: 'none' }}>Save Selections</button>
            <button onClick={saveFavorites} className="btn" style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', borderRadius: 6, border: 'none' }}>Save Favorites (max 3)</button>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Tip: Use “Browse CKS Catalog” to add more services. Favorite up to 3; they appear on your profile.</div>
        </div>
      </div>
    </div>
  );
}
