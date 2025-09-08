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
import CustomerLogoutButton from './components/LogoutButton';

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

type CustomerSection = 'dashboard' | 'profile' | 'services' | 'centers' | 'reports' | 'orders' | 'support';

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
  const [ordersBucket, setOrdersBucket] = useState<'pending'|'approved'|'archive'>('pending');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderCounts, setOrderCounts] = useState<{pending:number; approved:number; archive:number}>({ pending: 0, approved: 0, archive: 0 });
  const [hasTotals, setHasTotals] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{ order: any; items: any[]; approvals: any[] } | null>(null);
  // Reports & Feedback state
  const [repTab, setRepTab] = useState<'reports'|'feedback'>('reports');
  const [reports, setReports] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [reportsTotals, setReportsTotals] = useState<{open:number; in_progress:number; resolved:number; closed:number}>({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [feedbackTotals, setFeedbackTotals] = useState<{praise:number; request:number; issue:number}>({ praise: 0, request: 0, issue: 0 });
  const [repLoading, setRepLoading] = useState(false);
  const [archReportId, setArchReportId] = useState('');
  const [archFeedbackId, setArchFeedbackId] = useState('');
  const [newReportOpen, setNewReportOpen] = useState(false);
  const [newFeedbackOpen, setNewFeedbackOpen] = useState(false);
  const [newReportForm, setNewReportForm] = useState<{ type:'incident'|'quality'|'service_issue'|'general'; severity:string; title:string; description:string }>({ type: 'service_issue', severity: '', title: '', description: '' });
  const [newFeedbackForm, setNewFeedbackForm] = useState<{ kind:'praise'|'request'|'issue'; title:string; message:string }>({ kind: 'issue', title: '', message: '' });
  const [repDetailOpen, setRepDetailOpen] = useState(false);
  const [repDetail, setRepDetail] = useState<{ report:any; comments:any[] }|null>(null);
  const [repComment, setRepComment] = useState('');
  const [fbDetailOpen, setFbDetailOpen] = useState(false);
  const [fbDetail, setFbDetail] = useState<any|null>(null);
  
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
            const items = Array.isArray(centersData?.data) ? centersData.data : (Array.isArray(centersData?.centers) ? centersData.centers : []);
            setCenters(items);
          } else {
            // No demo data - empty state
            setCenters([]);
          }
          
          // Service requests
          if (requestsRes?.ok) {
            const requestsData = await requestsRes.json();
            const items = Array.isArray(requestsData?.data) ? requestsData.data : (Array.isArray(requestsData?.requests) ? requestsData.requests : []);
            setServiceRequests(items);
          } else {
            // No demo data - empty state
            setServiceRequests([]);
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

  // Fetch orders for current bucket
  useEffect(() => {
    if (activeSection !== 'orders') return;
    let cancelled = false;
    (async () => {
      try {
        const url = buildCustomerApiUrl('/orders', { code, bucket: ordersBucket, limit: 25 });
        const res = await customerApiFetch(url);
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setOrders(data);
          if (json && json.totals && typeof json.totals === 'object') {
            const t = json.totals as { pending?: number; approved?: number; archive?: number };
            setOrderCounts({
              pending: Number(t.pending ?? 0),
              approved: Number(t.approved ?? 0),
              archive: Number(t.archive ?? 0),
            });
            setHasTotals(true);
          } else {
            setHasTotals(false);
          }
        }
      } catch {
        if (!cancelled) setOrders([]);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, ordersBucket, code]);

  // Fetch counts for all buckets (shallow, page-limited)
  useEffect(() => {
    if (activeSection !== 'orders') return;
    if (hasTotals) return; // backend provided totals; skip page-limited approximation
    let cancelled = false;
    (async () => {
      try {
        const [p, a, r] = await Promise.all([
          customerApiFetch(buildCustomerApiUrl('/orders', { code, bucket: 'pending', limit: 25 })).then(r=>r.json()).catch(()=>({data:[]})),
          customerApiFetch(buildCustomerApiUrl('/orders', { code, bucket: 'approved', limit: 25 })).then(r=>r.json()).catch(()=>({data:[]})),
          customerApiFetch(buildCustomerApiUrl('/orders', { code, bucket: 'archive', limit: 25 })).then(r=>r.json()).catch(()=>({data:[]})),
        ]);
        if (!cancelled) setOrderCounts({ pending: (p.data||[]).length, approved: (a.data||[]).length, archive: (r.data||[]).length });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [activeSection, code, hasTotals]);

  async function openOrderDetail(orderId: string) {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api'}/orders/${orderId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load order');
      setDetail(json.data || null);
    } catch (e) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }
  function closeDetail() { setDetailOpen(false); setDetail(null); }

  async function openReportDetail(id: string) {
    try {
      setRepDetailOpen(true);
      setRepDetail(null);
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const r = await fetch(`${base}/reports/${encodeURIComponent(id)}`, { credentials: 'include' });
      const j = await r.json();
      if (j?.success) setRepDetail(j.data);
    } catch { setRepDetail(null); }
  }
  function closeReportDetail() { setRepDetailOpen(false); setRepDetail(null); setRepComment(''); }
  async function addCustomerComment() {
    if (!repDetail?.report?.report_id || !repComment.trim()) return;
    const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
    const r = await fetch(`${base}/reports/${repDetail.report.report_id}/comments`, {
      method: 'POST', headers: { 'Content-Type':'application/json', 'x-user-role':'customer' }, credentials:'include',
      body: JSON.stringify({ body: repComment.trim() })
    });
    if (r.ok) { setRepComment(''); await openReportDetail(repDetail.report.report_id); }
  }
  async function openFeedbackDetail(id: string) {
    try {
      setFbDetailOpen(true);
      setFbDetail(null);
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const r = await fetch(`${base}/feedback/${encodeURIComponent(id)}`, { credentials: 'include' });
      const j = await r.json();
      if (j?.success) setFbDetail(j.data);
    } catch { setFbDetail(null); }
  }

  // Fetch reports/feedback for the customer when viewing Reports section
  useEffect(() => {
    if (activeSection !== 'reports') return;
    let cancelled = false;
    (async () => {
      try {
        setRepLoading(true);
        const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        if (repTab === 'reports') {
          const r = await fetch(`${base}/reports?customer_id=${encodeURIComponent(code)}&limit=25`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) {
            setReports(Array.isArray(j?.data) ? j.data : []);
            const t = j?.totals || {};
            setReportsTotals({
              open: Number(t.open || 0),
              in_progress: Number(t.in_progress || 0),
              resolved: Number(t.resolved || 0),
              closed: Number(t.closed || 0),
            });
          }
        } else {
          const r = await fetch(`${base}/feedback?customer_id=${encodeURIComponent(code)}&limit=25`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) {
            setFeedback(Array.isArray(j?.data) ? j.data : []);
            const t = j?.totals || {};
            setFeedbackTotals({
              praise: Number(t.praise || 0),
              request: Number(t.request || 0),
              issue: Number(t.issue || 0),
            });
          }
        }
      } finally { if (!cancelled) setRepLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [activeSection, repTab, code]);

  async function submitNewReport() {
    try {
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const res = await fetch(`${base}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'customer' },
        credentials: 'include',
        body: JSON.stringify({ customer_id: code, ...newReportForm }),
      });
      if (!res.ok) throw new Error('Create report failed');
      setNewReportOpen(false);
      setNewReportForm({ type: 'service_issue', severity: '', title: '', description: '' });
      setRepTab('reports');
    } catch (e) { alert((e as Error).message); }
  }

  async function submitNewFeedback() {
    try {
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const res = await fetch(`${base}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'customer' },
        credentials: 'include',
        body: JSON.stringify({ customer_id: code, ...newFeedbackForm }),
      });
      if (!res.ok) throw new Error('Create feedback failed');
      setNewFeedbackOpen(false);
      setNewFeedbackForm({ kind: 'issue', title: '', message: '' });
      setRepTab('feedback');
    } catch (e) { alert((e as Error).message); }
  }

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
          <CustomerLogoutButton />
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
          <CustomerLogoutButton />
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
        <CustomerLogoutButton />
      </div>

      {/* Welcome message for center manager */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome, {customerName} ({code}) - Center Manager
      </div>

      {/* Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard' as CustomerSection, label: 'Dashboard' },
          { key: 'profile' as CustomerSection, label: 'Customer Profile' },
          { key: 'services' as CustomerSection, label: 'My Services' },
          { key: 'centers' as CustomerSection, label: 'My Centers' },
          { key: 'orders' as CustomerSection, label: 'Orders' },
          { key: 'reports' as CustomerSection, label: 'Reports' },
          { key: 'support' as CustomerSection, label: 'Support' }
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
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Overview</h2>
            
            {/* Center Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Active Centers', value: state.data?.centers_managed || 0, color: '#eab308' },
                { label: 'Total Locations', value: state.data?.total_locations || 0, color: '#8b5cf6' },
                { label: 'Account Status', value: state.data?.account_status || 'Not Set', color: '#10b981' },
                { label: 'Service Level', value: state.data?.service_level || 'Not Set', color: '#f59e0b' },
                { label: 'Crew Assigned', value: state.data?.crew_assigned || 0, color: '#ef4444' },
                { label: 'Pending Requests', value: state.data?.pending_requests || 0, color: '#f97316' }
              ].map((metric, i) => (
                <div key={i} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: metric.color || '#111827' }}>{metric.value}</div>
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
              }} onClick={() => navigate('/catalog?type=service')}>
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
              }} onClick={() => navigate('/catalog?type=product')}>
                📦 REQUEST PRODUCTS
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                  Supplies • Equipment • Materials • More
                </div>
              </button>
            </div>

            {/* Centers Overview */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Activity</h3>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>No recent activity</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Center activity will appear here as it occurs</div>
              </div>
            </div>

            {/* Communication Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* News & Updates */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#eab308', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📰 News & Updates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No news updates available.
                  </div>
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#fef3c7',
                  color: '#eab308',
                  border: '1px solid #fbbf24',
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
                <div className="title" style={{ marginBottom: 16, color: '#eab308', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No mail messages available.
                  </div>
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#fef3c7',
                  color: '#eab308',
                  border: '1px solid #fbbf24',
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

        {/* CUSTOMER PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Customer Profile</h2>
            
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Customer Info', 'Account Manager', 'Operations', 'Settings'].map((tab, i) => (
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
                        borderRadius: '50%',
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
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Photo</button>
                    </div>

                    {/* Customer Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {(() => {
                            const rows: Array<[string, any]> = [
                              ['Customer ID', state.data?.customer_id || code],
                              ['Company Name', state.data?.company_name || customerName],
                              ['Address', state.data?.address || 'Not Set'],
                              ['CKS Manager (Assigned)', state.data?.cks_manager || 'Not Assigned'],
                              ['Email', state.data?.email || 'Not Set'],
                              ['Phone', state.data?.phone || 'Not Set'],
                              ['Main Contact', state.data?.main_contact || 'Not Set'],
                              ['Website', state.data?.website || 'Not Set'],
                              ['Years with CKS', state.data?.years_with_cks || 'Not Set'],
                              ['# of Centers', state.data?.num_centers || '0'],
                              ['Contract Start Date', state.data?.contract_start_date || ''],
                              ['Status', state.data?.status || 'Not Set']
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
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#eab308' }}>CKS Account Manager</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
                    {/* Manager Photo */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
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
                        MD
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Manager Demo</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Account Manager</div>
                    </div>

                    {/* Manager Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {(() => {
                            const m = (state.data as any)?.manager || {};
                            const rows: Array<[string, any]> = [
                              ['Manager Name', m.manager_name || 'Not Assigned'],
                              ['Manager ID', m.manager_id || (state.data?.cks_manager || 'Not Assigned')],
                              ['Email', m.email || 'Not Assigned'],
                              ['Phone', m.phone || 'Not Assigned']
                            ];
                            return rows.map(([label, value]) => (
                              <tr key={label}>
                                <td style={{ padding: '8px 0', fontWeight: 600, width: '35%' }}>{label}</td>
                                <td style={{ padding: '8px 0' }}>{String(value)}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {profileTab === 2 && (
                <div>
                  <div className="title" style={{ marginBottom: 20, color: '#eab308' }}>Operations</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Operating Hours', 'Not Set'],
                        ['Emergency Contact', 'Not Set'],
                        ['Preferred Communication', 'Email'],
                        ['Service Requirements', 'Not Set'],
                        ['Special Instructions', 'Not Set']
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
                  <div className="title" style={{ marginBottom: 20, color: '#eab308' }}>Settings</div>
                  <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>
                    Settings and preferences coming soon.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTERS SECTION */}
        {activeSection === 'centers' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Centers</h2>
            
            {/* Hierarchical Centers Overview */}
            <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#eab308' }}>📍 Centers Overview</div>
                <div style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '4px 8px', borderRadius: 12 }}>
                  Hierarchical View: Centers → Crew Assignments
                </div>
              </div>
              
              <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No Centers Assigned</div>
                <div style={{ fontSize: 14, marginBottom: 16 }}>Your centers will appear here once assigned by your CKS Manager</div>
                
                {/* Expected Hierarchy Visual Guide */}
                <div style={{ background: 'white', borderRadius: 8, padding: 16, marginTop: 16, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>Expected Structure:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13 }}>
                    <div style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
                      🏢 Center A
                    </div>
                    <span style={{ color: '#9ca3af' }}>→</span>
                    <div style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
                      👥 Assigned Crew
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                    Each center will show its assigned crew members, schedules, and coordination details
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeSection === 'reports' && (
          <>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reports & Feedback</h2>
              <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
                <button onClick={()=>setRepTab('reports')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: repTab==='reports'?'#eab308':'white', color: repTab==='reports'?'white':'#111827', fontSize: 12, fontWeight: 700 }}>Reports</button>
                <button onClick={()=>setRepTab('feedback')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: repTab==='feedback'?'#eab308':'white', color: repTab==='feedback'?'white':'#111827', fontSize: 12, fontWeight: 700 }}>Feedback</button>
              </div>
            </div>

            {repTab==='reports' ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[
                    { k:'open', label:'Open', v: reportsTotals.open },
                    { k:'in_progress', label:'In Progress', v: reportsTotals.in_progress },
                    { k:'resolved', label:'Resolved', v: reportsTotals.resolved },
                    { k:'closed', label:'Closed', v: reportsTotals.closed },
                  ].map(({k,label,v}) => (
                    <span key={k} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{label}: {v}</span>
                  ))}
                  <button onClick={()=>setNewReportOpen(o=>!o)} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 12, fontWeight: 700 }}>New Report</button>
                </div>

                {newReportOpen && (
                  <div className="ui-card" style={{ padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <select value={newReportForm.type} onChange={e=>setNewReportForm(f=>({...f, type: e.target.value as any}))} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        <option value="service_issue">Service Issue</option>
                        <option value="incident">Incident</option>
                        <option value="quality">Quality</option>
                        <option value="general">General</option>
                      </select>
                      <input placeholder="Severity (optional)" value={newReportForm.severity} onChange={e=>setNewReportForm(f=>({...f, severity: e.target.value}))} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, flex: 1, minWidth: 160 }} />
                      <input placeholder="Title" value={newReportForm.title} onChange={e=>setNewReportForm(f=>({...f, title: e.target.value}))} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, flex: 2, minWidth: 220 }} />
                    </div>
                    <textarea placeholder="Description" value={newReportForm.description} onChange={e=>setNewReportForm(f=>({...f, description: e.target.value}))} style={{ marginTop: 8, width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button onClick={submitNewReport} style={{ padding: '8px 12px', borderRadius: 6, background: '#eab308', color: 'white', border: '1px solid #ca8a04', fontWeight: 700 }}>Submit</button>
                      <button onClick={()=>setNewReportOpen(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
                    </div>
                  </div>
                )}

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
                        <tr><td colSpan={5} style={{ padding: 16 }}>Loading...</td></tr>
                      )}
                      {!repLoading && reports.map((r: any, i: number) => (
                        <tr key={r.report_id} onClick={()=>openReportDetail(r.report_id)} style={{ cursor:'pointer', borderBottom: i < reports.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{r.title}</td>
                          <td style={{ padding: 10 }}>{r.type}</td>
                          <td style={{ padding: 10 }}>{r.severity || '—'}</td>
                          <td style={{ padding: 10 }}>{r.status}</td>
                          <td style={{ padding: 10, fontSize: 12, color: '#6b7280' }}>{r.created_by_role}:{r.created_by_id}</td>
                          <td style={{ padding: 10 }}>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!repLoading && reports.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>No reports yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[
                    { k:'praise', label:'Praise', v: feedbackTotals.praise },
                    { k:'request', label:'Requests', v: feedbackTotals.request },
                    { k:'issue', label:'Issues', v: feedbackTotals.issue },
                  ].map(({k,label,v}) => (
                    <span key={k} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{label}: {v}</span>
                  ))}
                  <button onClick={()=>setNewFeedbackOpen(o=>!o)} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 12, fontWeight: 700 }}>New Feedback</button>
                </div>

                {newFeedbackOpen && (
                  <div className="ui-card" style={{ padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <select value={newFeedbackForm.kind} onChange={e=>setNewFeedbackForm(f=>({...f, kind: e.target.value as any}))} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        <option value="praise">Praise</option>
                        <option value="request">Request</option>
                        <option value="issue">Issue</option>
                      </select>
                      <input placeholder="Title" value={newFeedbackForm.title} onChange={e=>setNewFeedbackForm(f=>({...f, title: e.target.value}))} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, flex: 2, minWidth: 220 }} />
                    </div>
                    <textarea placeholder="Message" value={newFeedbackForm.message} onChange={e=>setNewFeedbackForm(f=>({...f, message: e.target.value}))} style={{ marginTop: 8, width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button onClick={submitNewFeedback} style={{ padding: '8px 12px', borderRadius: 6, background: '#eab308', color: 'white', border: '1px solid #ca8a04', fontWeight: 700 }}>Submit</button>
                      <button onClick={()=>setNewFeedbackOpen(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
                    </div>
                  </div>
                )}

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
                        <tr><td colSpan={3} style={{ padding: 16 }}>Loading...</td></tr>
                      )}
                      {!repLoading && feedback.map((f: any, i: number) => (
                        <tr key={f.feedback_id} onClick={()=>openFeedbackDetail(f.feedback_id)} style={{ cursor:'pointer', borderBottom: i < feedback.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{f.title}</td>
                          <td style={{ padding: 10 }}>{f.kind}</td>
                          <td style={{ padding: 10, fontSize: 12, color: '#6b7280' }}>{f.created_by_role}:{f.created_by_id}</td>
                          <td style={{ padding: 10 }}>{new Date(f.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!repLoading && feedback.length === 0 && (
                        <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>No feedback yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <div className="ui-card" style={{ padding: 12, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Archive Search</div>
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
              <input placeholder="Report ID (e.g., RPT-1001)" value={archReportId} onChange={e=>setArchReportId(e.target.value)} onKeyDown={async (e)=>{ if (e.key==='Enter') { const id=archReportId.trim(); if (id) await openReportDetail(id); } }} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, minWidth: 200 }} />
              <button onClick={async ()=>{ const id=archReportId.trim(); if (id) await openReportDetail(id); }} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'white' }}>Open Report</button>
              <input placeholder="Feedback ID (e.g., FDB-1001)" value={archFeedbackId} onChange={e=>setArchFeedbackId(e.target.value)} onKeyDown={async (e)=>{ if (e.key==='Enter') { const id=archFeedbackId.trim(); if (id) await openFeedbackDetail(id); } }} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, minWidth: 200 }} />
              <button onClick={async ()=>{ const id=archFeedbackId.trim(); if (id) await openFeedbackDetail(id); }} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'white' }}>Open Feedback</button>
            </div>
          </div>

          {/* Report detail overlay */}
          {repDetailOpen && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }} onClick={closeReportDetail}>
              <div className="ui-card" style={{ width: 720, maxWidth: '90%', padding: 16 }} onClick={e=>e.stopPropagation()}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800 }}>Report Detail</div>
                  <button onClick={closeReportDetail} style={{ padding: 6, border:'1px solid #e5e7eb', borderRadius: 999, background:'white' }}>✕</button>
                </div>
                {!repDetail && <div style={{ color:'#6b7280' }}>Loading...</div>}
                {!!repDetail && (
                  <div style={{ display:'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{repDetail.report.title}</div>
                      <div style={{ fontSize: 12, color:'#6b7280', marginBottom: 8 }}>{repDetail.report.type} • {repDetail.report.severity || '—'} • {repDetail.report.status}</div>
                      <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{repDetail.report.description || 'No description.'}</div>
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Comments</div>
                        <div style={{ display:'flex', flexDirection:'column', gap: 8, maxHeight: 220, overflow: 'auto' }}>
                          {repDetail.comments.map(c => (
                            <div key={c.comment_id} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                              <div style={{ fontSize: 12, color:'#6b7280', marginBottom: 4 }}>{c.author_role} • {new Date(c.created_at).toLocaleString()}</div>
                              <div style={{ fontSize: 14 }}>{c.body}</div>
                            </div>
                          ))}
                          {repDetail.comments.length === 0 && (<div style={{ color:'#6b7280' }}>No comments yet.</div>)}
                        </div>
                        <div style={{ display:'flex', gap: 8, marginTop: 8 }}>
                          <input placeholder="Add a comment" value={repComment} onChange={e=>setRepComment(e.target.value)} style={{ flex:1, padding:8, border:'1px solid #e5e7eb', borderRadius:6 }} />
                          <button onClick={addCustomerComment} style={{ padding:'8px 12px', borderRadius:6, background:'#eab308', color:'white', border:'1px solid #ca8a04', fontWeight:700 }}>Post</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color:'#6b7280' }}>By {repDetail.report.created_by_role}:{repDetail.report.created_by_id}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Feedback detail overlay */}
          {fbDetailOpen && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }} onClick={()=>{ setFbDetailOpen(false); setFbDetail(null); }}>
              <div className="ui-card" style={{ width: 600, maxWidth: '90%', padding: 16 }} onClick={e=>e.stopPropagation()}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800 }}>Feedback Detail</div>
                  <button onClick={()=>{ setFbDetailOpen(false); setFbDetail(null); }} style={{ padding: 6, border:'1px solid #e5e7eb', borderRadius: 999, background:'white' }}>✕</button>
                </div>
                {!fbDetail && <div style={{ color:'#6b7280' }}>Loading...</div>}
                {!!fbDetail && (
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{fbDetail.title}</div>
                    <div style={{ fontSize: 12, color:'#6b7280', marginBottom: 8 }}>{fbDetail.kind} • {fbDetail.center_id || fbDetail.customer_id} • {new Date(fbDetail.created_at).toLocaleString()}</div>
                    <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{fbDetail.message || 'No message.'}</div>
                    <div style={{ fontSize: 12, color:'#6b7280', marginTop: 8 }}>By {fbDetail.created_by_role}:{fbDetail.created_by_id}</div>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Orders</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['pending','approved','archive'] as const).map(b => (
                <button key={b} onClick={() => setOrdersBucket(b)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: ordersBucket===b? '#111827':'white', color: ordersBucket===b? 'white':'#111827', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {b === 'pending' ? 'Pending Requests' : b === 'approved' ? 'Approved Requests' : 'Archive'}
                </button>
              ))}
            </div>
            <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Order ID</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Center</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Items</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Services</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Products</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Status</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.order_id} onClick={() => openOrderDetail(o.order_id)} style={{ cursor: 'pointer', borderBottom: i < orders.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: 10, fontFamily: 'ui-monospace' }}>{o.order_id}</td>
                      <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>{o.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.service_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.product_count ?? 0}</td>
                      <td style={{ padding: 10 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#92400e', fontSize: 12 }}>{o.status}</span>
                      </td>
                      <td style={{ padding: 10 }}>{String(o.order_date).slice(0,10)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 16, color: '#6b7280' }}>No orders in this bucket yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                            user_role: 'customer',
                            user_hub: 'customer',
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
                      background: '#eab308', 
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
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Contact Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Technical Support</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>For app-related issues and questions</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Response: 4-24 hours</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Account Manager</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>For service and business questions</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>See Profile → Account Manager</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Animation styles */}
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>

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
  );
}
