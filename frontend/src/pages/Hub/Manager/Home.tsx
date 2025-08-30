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
import ManagerLogoutButton from './components/LogoutButton';
import ReactDOM from 'react-dom';

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

type ManagerSection = 'dashboard' | 'profile' | 'services' | 'contractors' | 'customers' | 'centers' | 'crew' | 'orders' | 'reports';

export default function ManagerHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useManagerData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<ManagerSection>('dashboard');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  const [reqBucket, setReqBucket] = useState<'needs_scheduling'|'in_progress'|'archive'>('needs_scheduling');
  const [requests, setRequests] = useState<any[]>([]);
  const [schedLoading, setSchedLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{ order: any; items: any[]; approvals: any[] } | null>(null);
  const [counts, setCounts] = useState<{ needs: number; progress: number; archive: number }>({ needs: 0, progress: 0, archive: 0 });
  const [hasTotals, setHasTotals] = useState(false);
  const [filter, setFilter] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [sortKey, setSortKey] = useState<'date'|'services'|'items'|'status'>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedForm, setSchedForm] = useState<{ order_id: string; center_id: string; start: string; end: string }>({ order_id: '', center_id: '', start: '', end: '' });
  // Reports & Feedback (manager)
  const [repTab, setRepTab] = useState<'reports'|'feedback'>('reports');
  const [repScope, setRepScope] = useState<'center'|'customer'>('center');
  const [repId, setRepId] = useState('');
  const [repLoading, setRepLoading] = useState(false);
  const [repReports, setRepReports] = useState<any[]>([]);
  const [repFeedback, setRepFeedback] = useState<any[]>([]);
  const [repTotals, setRepTotals] = useState<any>({});
  const [repDetailOpen, setRepDetailOpen] = useState(false);
  const [repDetail, setRepDetail] = useState<{ report:any; comments:any[] }|null>(null);
  const [repComment, setRepComment] = useState('');
  const [repStatus, setRepStatus] = useState<'open'|'in_progress'|'resolved'|'closed'>('open');
  const [fbDetailOpen, setFbDetailOpen] = useState(false);
  const [fbDetail, setFbDetail] = useState<any|null>(null);
  const [archReportId, setArchReportId] = useState('');
  const [archFeedbackId, setArchFeedbackId] = useState('');
  // (Support section removed per template parity request)
  
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
        const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []));
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

  // Fetch manager requests per bucket
  useEffect(() => {
    if (activeSection !== 'orders') return;
    let cancelled = false;
    (async () => {
      try {
        setReqLoading(true);
        const url = buildManagerApiUrl('/requests', { bucket: reqBucket });
        const r = await managerApiFetch(url);
        const j = await r.json();
        const arr = Array.isArray(j?.data) ? j.data : [];
        if (!cancelled) {
          setRequests(arr);
          if (j && j.totals && typeof j.totals === 'object') {
            const t = j.totals as { needs_scheduling?: number; in_progress?: number; archive?: number };
            setCounts({
              needs: Number(t.needs_scheduling ?? 0),
              progress: Number(t.in_progress ?? 0),
              archive: Number(t.archive ?? 0),
            });
            setHasTotals(true);
          } else {
            setHasTotals(false);
          }
        }
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setReqLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, reqBucket]);

  // Fetch counts for badges (approximate page-limited)
  useEffect(() => {
    if (activeSection !== 'orders') return;
    if (hasTotals) return; // backend provided totals; skip approximation
    let cancelled = false;
    (async () => {
      try {
        const [n, p, a] = await Promise.all([
          managerApiFetch(buildManagerApiUrl('/requests', { bucket: 'needs_scheduling' })).then(r=>r.json()).catch(()=>({data:[]})),
          managerApiFetch(buildManagerApiUrl('/requests', { bucket: 'in_progress' })).then(r=>r.json()).catch(()=>({data:[]})),
          managerApiFetch(buildManagerApiUrl('/requests', { bucket: 'archive' })).then(r=>r.json()).catch(()=>({data:[]})),
        ]);
        if (!cancelled) setCounts({ needs: (n.data||[]).length, progress: (p.data||[]).length, archive: (a.data||[]).length });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [activeSection, hasTotals]);

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
    } finally { setDetailLoading(false); }
  }
  function closeDetail() { setDetailOpen(false); setDetail(null); }

  // Fetch manager requests per bucket
  useEffect(() => {
    if (activeSection !== 'orders') return;
    let cancelled = false;
    (async () => {
      try {
        const url = buildManagerApiUrl('/requests', { bucket: reqBucket });
        const r = await managerApiFetch(url);
        const j = await r.json();
        const arr = Array.isArray(j?.data) ? j.data : [];
        if (!cancelled) setRequests(arr);
      } catch {
        if (!cancelled) setRequests([]);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, reqBucket]);

  async function schedule(id: string) {
    try {
      setSchedLoading(id);
      const start = new Date();
      const end = new Date(Date.now() + 2*60*60*1000);
      const body = { center_id: (requests.find(r => r.order_id===id)?.center_id)||'', start: start.toISOString(), end: end.toISOString() };
      const url = buildManagerApiUrl(`/requests/${id}/schedule`);
      const r = await managerApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('Schedule failed');
      setRequests(prev => prev.filter(x => x.order_id !== id));
    } catch (e) {
      alert((e as Error).message || 'Schedule failed');
    } finally {
      setSchedLoading(null);
    }
  }

  // Reports fetch + actions
  useEffect(() => {
    if (activeSection !== 'reports') return;
    if (!repId) return;
    let cancelled = false;
    (async () => {
      try {
        setRepLoading(true);
        const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const q = repScope === 'center' ? `center_id=${encodeURIComponent(repId)}` : `customer_id=${encodeURIComponent(repId)}`;
        if (repTab === 'reports') {
          const r = await fetch(`${base}/reports?${q}&limit=25`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) { setRepReports(Array.isArray(j?.data)?j.data:[]); setRepTotals(j?.totals||{}); }
        } else {
          const r = await fetch(`${base}/feedback?${q}&limit=25`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) { setRepFeedback(Array.isArray(j?.data)?j.data:[]); setRepTotals(j?.totals||{}); }
        }
      } finally { if (!cancelled) setRepLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [activeSection, repTab, repScope, repId]);

  async function openReport(id: string) {
    try {
      setRepDetailOpen(true);
      setRepDetail(null);
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const r = await fetch(`${base}/reports/${encodeURIComponent(id)}`, { credentials: 'include' });
      const j = await r.json();
      if (j?.success) {
        setRepDetail(j.data);
        setRepStatus(j?.data?.report?.status || 'open');
      }
    } catch { setRepDetail(null); }
  }
  function closeReport() { setRepDetailOpen(false); setRepDetail(null); setRepComment(''); }

  async function saveReportStatus() {
    if (!repDetail?.report?.report_id) return;
    const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
    const r = await fetch(`${base}/reports/${repDetail.report.report_id}/status`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json','x-user-role':'manager' }, credentials:'include',
      body: JSON.stringify({ status: repStatus })
    });
    if (r.ok) await openReport(repDetail.report.report_id);
  }

  async function addReportComment() {
    if (!repDetail?.report?.report_id || !repComment.trim()) return;
    const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
    const r = await fetch(`${base}/reports/${repDetail.report.report_id}/comments`, {
      method: 'POST', headers: { 'Content-Type':'application/json','x-user-role':'manager' }, credentials:'include',
      body: JSON.stringify({ body: repComment.trim() })
    });
    if (r.ok) { setRepComment(''); await openReport(repDetail.report.report_id); }
  }

  async function openFeedback(id: string) {
    try {
      setFbDetailOpen(true);
      setFbDetail(null);
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const r = await fetch(`${base}/feedback/${encodeURIComponent(id)}`, { credentials: 'include' });
      const j = await r.json();
      if (j?.success) setFbDetail(j.data);
    } catch { setFbDetail(null); }
  }

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
          <ManagerLogoutButton />
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
          <ManagerLogoutButton />
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
        <ManagerLogoutButton />
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
          { key: 'services' as ManagerSection, label: 'My Services' },
          { key: 'contractors' as ManagerSection, label: 'My Contractors' },
          { key: 'customers' as ManagerSection, label: 'My Customers' },
          { key: 'centers' as ManagerSection, label: 'My Centers' },
          { key: 'crew' as ManagerSection, label: 'My Crew' },
          { key: 'orders' as ManagerSection, label: 'Orders' },
          { key: 'reports' as ManagerSection, label: 'Reports' }
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
            
            {/* Key Metrics Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { title: 'Territory Overview', value: '12 Contractors', subtitle: '8 Centers • 45 Crew Members', color: '#3b7af7', trend: '+2 this month' },
                { title: 'Active Orders', value: '23', subtitle: '15 Needs Scheduling • 8 In Progress', color: '#10b981', trend: '+5 today' },
                { title: 'Open Reports', value: '7', subtitle: '3 High Priority • 4 Medium', color: '#f59e0b', trend: '2 resolved today' },
                { title: 'Performance', value: '92%', subtitle: 'Customer Satisfaction Score', color: '#8b5cf6', trend: '+3% this week' },
              ].map(metric => (
                <div key={metric.title} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.title}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: metric.color, marginBottom: 2 }}>{metric.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.subtitle}</div>
                  <div style={{ fontSize: 11, color: metric.color, fontWeight: 600 }}>{metric.trend}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="ui-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#3b7af7' }}>Priority Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { action: 'Review pending contractor approvals', count: 3, urgency: 'High', color: '#ef4444' },
                    { action: 'Schedule crew assignments', count: 5, urgency: 'Medium', color: '#f59e0b' },
                    { action: 'Process service requests', count: 8, urgency: 'Medium', color: '#f59e0b' },
                    { action: 'Update center capacity reports', count: 2, urgency: 'Low', color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 8,
                      border: '1px solid #f3f4f6',
                      borderRadius: 6,
                      borderLeft: `3px solid ${item.color}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.action}</span>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 12, background: item.color, color: 'white' }}>
                          {item.count}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.urgency}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="ui-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#3b7af7' }}>Territory Health</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { metric: 'Contractor Performance', value: 88, color: '#10b981' },
                    { metric: 'Center Utilization', value: 76, color: '#f59e0b' },
                    { metric: 'Crew Efficiency', value: 94, color: '#10b981' },
                    { metric: 'Service Quality', value: 91, color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{item.metric}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${item.value}%`, 
                          height: '100%', 
                          background: item.color,
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Communication Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
              {/* News & Updates */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#3b7af7', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📰 News & Updates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 1, title: "Territory performance review scheduled for Q4", date: "2025-08-20", priority: "High" },
                    { id: 2, title: "New contractor onboarding process updated", date: "2025-08-18", priority: "Medium" },
                    { id: 3, title: "Center capacity reports now available", date: "2025-08-15", priority: "Low" }
                  ].map((item) => (
                    <div key={item.id} style={{ 
                      padding: 8,
                      border: '1px solid #f3f4f6',
                      borderRadius: 4,
                      borderLeft: '3px solid #3b7af7'
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{item.date} • {item.priority} Priority</div>
                    </div>
                  ))}
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#dbeafe',
                  color: '#3b7af7',
                  border: '1px solid #60a5fa',
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
                <div className="title" style={{ marginBottom: 16, color: '#3b7af7', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                  <span style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    fontSize: 10, 
                    padding: '2px 6px', 
                    borderRadius: 12, 
                    fontWeight: 600 
                  }}>
                    4
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #3b7af7'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Regional Director</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Quarterly territory review meeting scheduled</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>45 minutes ago • High Priority</div>
                  </div>
                  
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #3b7af7'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From HR - Personnel Team</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Contractor performance evaluations due</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>1 hour ago • Medium Priority</div>
                  </div>
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#dbeafe',
                  color: '#3b7af7',
                  border: '1px solid #60a5fa',
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

        

        {/* ORDERS SECTION */}
        {activeSection === 'orders' && (
          <div>
            {notice && (
              <div className="card" style={{ padding: 10, marginBottom: 8, borderLeft: '4px solid #10b981', background: '#ecfdf5', color: '#065f46', fontSize: 13 }}>{notice}</div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Service Requests</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['needs_scheduling','in_progress','archive'] as const).map(b => {
                const label = b === 'needs_scheduling' ? 'Needs Scheduling' : b === 'in_progress' ? 'In Progress' : 'Archive';
                const count = b === 'needs_scheduling' ? counts.needs : b === 'in_progress' ? counts.progress : counts.archive;
                return (
                  <button key={b} onClick={() => setReqBucket(b)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: reqBucket===b? '#111827':'white', color: reqBucket===b? 'white':'#111827', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <span>{label}</span>
                    <span style={{ fontSize: 11, background: reqBucket===b? '#dbeafe':'#f3f4f6', color: '#111827', borderRadius: 12, padding: '2px 6px' }}>{count}</span>
                  </button>
                );
              })}
              <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by order/center/customer" style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#6b7280' }}>Sort</label>
                <select value={sortKey} onChange={e=>setSortKey(e.target.value as any)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <option value="date">Date</option>
                  <option value="services">Services</option>
                  <option value="items">Items</option>
                  <option value="status">Status</option>
                </select>
                <button onClick={()=>setSortDir(d=> d==='asc'?'desc':'asc')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>{sortDir==='asc'?'Asc':'Desc'}</button>
              </div>
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
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Status</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    reqLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`sk-${i}`}>
                            <td style={{ padding: 10 }} colSpan={7}>
                              <div className="animate-pulse" style={{ height: 10, background: '#f3f4f6', borderRadius: 6 }}></div>
                            </td>
                          </tr>
                        ))
                      : requests
                          .filter((o) => {
                            const t = (filter || '').toLowerCase();
                            if (!t) return true;
                            return (
                              String(o.order_id).toLowerCase().includes(t) ||
                              String(o.center_id || '').toLowerCase().includes(t) ||
                              String(o.customer_id || '').toLowerCase().includes(t)
                            );
                          })
                          .sort((a, b) => {
                            const mul = sortDir === 'asc' ? 1 : -1;
                            if (sortKey === 'date') return (new Date(a.order_date).getTime() - new Date(b.order_date).getTime()) * mul;
                            if (sortKey === 'services') return ((a.service_count || 0) - (b.service_count || 0)) * mul;
                            if (sortKey === 'items') return ((a.item_count || 0) - (b.item_count || 0)) * mul;
                            if (String(a.status) < String(b.status)) return -1 * mul;
                            if (String(a.status) > String(b.status)) return 1 * mul;
                            return 0;
                          })
                          .map((o, i) => (
                            <tr key={o.order_id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                              <td style={{ padding: 10, fontFamily: 'ui-monospace', color: '#2563eb', cursor: 'pointer' }} onClick={() => openOrderDetail(o.order_id)}>
                                {o.order_id}
                              </td>
                              <td style={{ padding: 10 }}>{o.customer_id || '—'}</td>
                              <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                              <td style={{ padding: 10 }}>{o.item_count ?? 0}</td>
                              <td style={{ padding: 10 }}>{o.service_count ?? 0}</td>
                              <td style={{ padding: 10 }}>{o.status}</td>
                              <td style={{ padding: 10 }}>
                                {reqBucket === 'needs_scheduling' ? (
                                  <button
                                    disabled={schedLoading === o.order_id}
                                    onClick={() => {
                                      const now = new Date();
                                      const twoH = new Date(Date.now() + 2 * 60 * 60 * 1000);
                                      const toLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                      setSchedForm({ order_id: o.order_id, center_id: o.center_id || '', start: toLocal(now), end: toLocal(twoH) });
                                      setSchedOpen(true);
                                    }}
                                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#3b7af7', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Schedule
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#6b7280' }}>—</span>
                                )}
                              </td>
                            </tr>
                          ))
                  )}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 16, color: '#6b7280' }}>No requests in this bucket.</td>
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
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Photo</button>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Reports & Feedback</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <button onClick={()=>setRepTab('reports')} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb', background: repTab==='reports'?'#3b7af7':'white', color: repTab==='reports'?'white':'#111827', fontSize:12, fontWeight:700 }}>Reports</button>
                <button onClick={()=>setRepTab('feedback')} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb', background: repTab==='feedback'?'#3b7af7':'white', color: repTab==='feedback'?'white':'#111827', fontSize:12, fontWeight:700 }}>Feedback</button>
              </div>
              <ManagerReportScopeSelect repScope={repScope} setRepScope={setRepScope} repId={repId} setRepId={setRepId} code={code} />
            </div>

            {repTab==='reports' ? (
              <div>
                <div style={{ display:'flex', gap:8, marginBottom: 12 }}>
                  {['open','in_progress','resolved','closed'].map(k => (
                    <span key={k} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', fontSize:12, fontWeight:700 }}>{k.replace('_',' ')}: {Number(repTotals?.[k]||0)}</span>
                  ))}
                </div>
                <div className="ui-card" style={{ padding:0, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f9fafb' }}>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Title</th>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Type</th>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Severity</th>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Status</th>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repLoading && (<tr><td colSpan={5} style={{ padding:16 }}>Loading...</td></tr>)}
                      {!repLoading && repReports.map((r:any, i:number) => (
                        <tr key={r.report_id} onClick={()=>openReport(r.report_id)} style={{ cursor:'pointer', borderBottom: i<repReports.length-1? '1px solid #e5e7eb':'none' }}>
                          <td style={{ padding:10, fontWeight:600 }}>{r.title}</td>
                          <td style={{ padding:10 }}>{r.type}</td>
                          <td style={{ padding:10 }}>{r.severity || '—'}</td>
                          <td style={{ padding:10 }}>{r.status}</td>
                          <td style={{ padding:10 }}>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!repLoading && repReports.length===0 && (<tr><td colSpan={5} style={{ padding:16, color:'#6b7280' }}>No reports.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', gap:8, marginBottom: 12 }}>
                  {['praise','request','issue'].map(k => (
                    <span key={k} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', fontSize:12, fontWeight:700 }}>{k.charAt(0).toUpperCase()+k.slice(1)}: {Number(repTotals?.[k]||0)}</span>
                  ))}
                </div>
                <div className="ui-card" style={{ padding:0, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f9fafb' }}>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Title</th>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Kind</th>
                        <th style={{ padding:10, textAlign:'left', fontSize:12 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repLoading && (<tr><td colSpan={3} style={{ padding:16 }}>Loading...</td></tr>)}
                      {!repLoading && repFeedback.map((f:any, i:number) => (
                        <tr key={f.feedback_id} style={{ borderBottom: i<repFeedback.length-1? '1px solid #e5e7eb':'none' }}>
                          <td style={{ padding:10, fontWeight:600 }}>{f.title}</td>
                          <td style={{ padding:10 }}>{f.kind}</td>
                          <td style={{ padding:10 }}>{new Date(f.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!repLoading && repFeedback.length===0 && (<tr><td colSpan={3} style={{ padding:16, color:'#6b7280' }}>No feedback.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Archive - Open by ID */}
            <div className="ui-card" style={{ padding: 12, marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Archive Search</div>
              <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
                <input placeholder="Report ID (e.g., RPT-1001)" value={archReportId} onChange={e=>setArchReportId(e.target.value)} onKeyDown={async (e)=>{ if (e.key==='Enter') { const id=archReportId.trim(); if (id) await openReport(id); } }} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, minWidth: 200 }} />
                <button onClick={async ()=>{ const id=archReportId.trim(); if (id) await openReport(id); }} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'white' }}>Open Report</button>
                <input placeholder="Feedback ID (e.g., FDB-1001)" value={archFeedbackId} onChange={e=>setArchFeedbackId(e.target.value)} onKeyDown={async (e)=>{ if (e.key==='Enter') { const id=archFeedbackId.trim(); if (id) await openFeedback(id); } }} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, minWidth: 200 }} />
                <button onClick={async ()=>{ const id=archFeedbackId.trim(); if (id) await openFeedback(id); }} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'white' }}>Open Feedback</button>
              </div>
            </div>

            {/* Report detail overlay */}
            {repDetailOpen && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }} onClick={closeReport}>
                <div className="ui-card" style={{ width: 720, maxWidth: '90%', padding: 16 }} onClick={e=>e.stopPropagation()}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>Report Detail</div>
                    <button onClick={closeReport} style={{ ...iconBtnStyle }}>✕</button>
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
                            <button onClick={addReportComment} style={{ padding:'8px 12px', borderRadius:6, background:'#3b7af7', color:'white', border:'1px solid #2563eb', fontWeight:700 }}>Post</button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Status</div>
                        <select value={repStatus} onChange={e=>setRepStatus(e.target.value as any)} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, width: '100%' }}>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button onClick={saveReportStatus} style={{ marginTop:8, width:'100%', padding:'8px 12px', borderRadius:6, background:'#10b981', color:'white', border:'1px solid #059669', fontWeight:700 }}>Save</button>
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
                    <button onClick={()=>{ setFbDetailOpen(false); setFbDetail(null); }} style={{ ...iconBtnStyle }}>✕</button>
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
          </div>
        )}

        {/* SERVICES SECTION */}
        {activeSection === 'services' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Services</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                {[
                  { name: 'Territory Management', description: 'Oversee contractor operations across assigned territory', status: 'Active', priority: 'High' },
                  { name: 'Quality Assurance', description: 'Monitor service quality and customer satisfaction', status: 'Active', priority: 'High' },
                  { name: 'Resource Coordination', description: 'Coordinate crew and equipment allocation', status: 'Active', priority: 'Medium' },
                  { name: 'Performance Analytics', description: 'Track KPIs and generate performance reports', status: 'Active', priority: 'Medium' },
                  { name: 'Training & Development', description: 'Manage contractor training programs', status: 'Planned', priority: 'Low' },
                  { name: 'Compliance Monitoring', description: 'Ensure regulatory and safety compliance', status: 'Active', priority: 'High' }
                ].map((service, i) => (
                  <div key={i} className="ui-card" style={{ padding: 16, borderLeft: `4px solid ${service.status === 'Active' ? '#10b981' : service.status === 'Planned' ? '#f59e0b' : '#6b7280'}` }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{service.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{service.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 12, background: service.status === 'Active' ? '#dcfce7' : service.status === 'Planned' ? '#fef3c7' : '#f3f4f6', color: service.status === 'Active' ? '#166534' : service.status === 'Planned' ? '#92400e' : '#6b7280' }}>{service.status}</span>
                      <span style={{ fontSize: 11, color: service.priority === 'High' ? '#dc2626' : service.priority === 'Medium' ? '#d97706' : '#6b7280' }}>{service.priority} Priority</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTORS SECTION */}
        {activeSection === 'contractors' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Contractors</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
                {[
                  { id: 'CON-001', name: 'Elite Services Co.', status: 'Active', performance: 94, orders: 23, region: 'North District' },
                  { id: 'CON-002', name: 'ProTech Solutions', status: 'Active', performance: 89, orders: 18, region: 'South District' },
                  { id: 'CON-003', name: 'Quality First LLC', status: 'Active', performance: 91, orders: 31, region: 'East District' },
                  { id: 'CON-004', name: 'Swift Services', status: 'Under Review', performance: 76, orders: 12, region: 'West District' },
                  { id: 'CON-005', name: 'Advanced Tech Corp', status: 'Active', performance: 88, orders: 27, region: 'Central District' },
                  { id: 'CON-006', name: 'Reliable Solutions', status: 'Active', performance: 92, orders: 19, region: 'North District' }
                ].map((contractor) => (
                  <div key={contractor.id} className="ui-card" style={{ padding: 16, borderLeft: `4px solid ${contractor.status === 'Active' ? '#10b981' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{contractor.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{contractor.id} • {contractor.region}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: contractor.status === 'Active' ? '#dcfce7' : '#fef3c7', color: contractor.status === 'Active' ? '#166534' : '#92400e' }}>{contractor.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: contractor.performance >= 90 ? '#10b981' : contractor.performance >= 80 ? '#f59e0b' : '#ef4444' }}>{contractor.performance}%</div>
                        <div style={{ color: '#6b7280' }}>Performance</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#3b7af7' }}>{contractor.orders}</div>
                        <div style={{ color: '#6b7280' }}>Active Orders</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <button style={{ fontSize: 10, padding: '4px 8px', background: '#3b7af7', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Manage</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS SECTION */}
        {activeSection === 'customers' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Customers</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
                {[
                  { id: 'CUS-001', name: 'Metro Property Group', type: 'Commercial', orders: 45, satisfaction: 96, region: 'Downtown' },
                  { id: 'CUS-002', name: 'Johnson Family Trust', type: 'Residential', orders: 12, satisfaction: 92, region: 'Suburbs' },
                  { id: 'CUS-003', name: 'Corporate Plaza LLC', type: 'Commercial', orders: 78, satisfaction: 89, region: 'Business District' },
                  { id: 'CUS-004', name: 'Riverside Apartments', type: 'Multi-Unit', orders: 34, satisfaction: 94, region: 'Riverside' },
                  { id: 'CUS-005', name: 'Tech Campus Inc.', type: 'Commercial', orders: 23, satisfaction: 88, region: 'Tech Park' },
                  { id: 'CUS-006', name: 'Heritage Homes', type: 'Residential', orders: 67, satisfaction: 91, region: 'Heritage District' }
                ].map((customer) => (
                  <div key={customer.id} className="ui-card" style={{ padding: 16, borderLeft: `4px solid ${customer.type === 'Commercial' ? '#3b7af7' : customer.type === 'Multi-Unit' ? '#8b5cf6' : '#10b981'}` }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{customer.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{customer.id} • {customer.type} • {customer.region}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#3b7af7' }}>{customer.orders}</div>
                        <div style={{ color: '#6b7280' }}>Total Orders</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: customer.satisfaction >= 90 ? '#10b981' : customer.satisfaction >= 85 ? '#f59e0b' : '#ef4444' }}>{customer.satisfaction}%</div>
                        <div style={{ color: '#6b7280' }}>Satisfaction</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <button style={{ fontSize: 10, padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>View</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CENTERS SECTION */}
        {activeSection === 'centers' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Centers</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
                {[
                  { id: 'CTR-001', name: 'Downtown Service Center', capacity: 85, utilization: 92, crew: 12, orders: 34 },
                  { id: 'CTR-002', name: 'North District Hub', capacity: 120, utilization: 78, crew: 18, orders: 28 },
                  { id: 'CTR-003', name: 'East Side Operations', capacity: 95, utilization: 88, crew: 15, orders: 41 },
                  { id: 'CTR-004', name: 'West End Facility', capacity: 110, utilization: 73, crew: 16, orders: 22 },
                  { id: 'CTR-005', name: 'South Point Center', capacity: 75, utilization: 94, crew: 10, orders: 37 },
                  { id: 'CTR-006', name: 'Central Processing Hub', capacity: 150, utilization: 81, crew: 22, orders: 45 }
                ].map((center) => (
                  <div key={center.id} className="ui-card" style={{ padding: 16, borderLeft: `4px solid ${center.utilization >= 85 ? '#10b981' : center.utilization >= 70 ? '#f59e0b' : '#ef4444'}` }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{center.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{center.id}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Utilization</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: center.utilization >= 85 ? '#10b981' : center.utilization >= 70 ? '#f59e0b' : '#ef4444' }}>{center.utilization}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${center.utilization}%`, height: '100%', background: center.utilization >= 85 ? '#10b981' : center.utilization >= 70 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s ease' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#3b7af7' }}>{center.capacity}</div>
                        <div style={{ color: '#6b7280' }}>Capacity</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#8b5cf6' }}>{center.crew}</div>
                        <div style={{ color: '#6b7280' }}>Crew</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#10b981' }}>{center.orders}</div>
                        <div style={{ color: '#6b7280' }}>Orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CREW SECTION */}
        {activeSection === 'crew' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Crew</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                {[
                  { id: 'CRW-001', name: 'Team Alpha', lead: 'Sarah Johnson', members: 4, center: 'CTR-001', status: 'Active', efficiency: 94 },
                  { id: 'CRW-002', name: 'Team Beta', lead: 'Mike Chen', members: 5, center: 'CTR-002', status: 'Active', efficiency: 87 },
                  { id: 'CRW-003', name: 'Team Gamma', lead: 'Lisa Rodriguez', members: 3, center: 'CTR-001', status: 'On Break', efficiency: 91 },
                  { id: 'CRW-004', name: 'Team Delta', lead: 'James Wilson', members: 6, center: 'CTR-003', status: 'Active', efficiency: 89 },
                  { id: 'CRW-005', name: 'Team Epsilon', lead: 'Amy Foster', members: 4, center: 'CTR-004', status: 'Active', efficiency: 92 },
                  { id: 'CRW-006', name: 'Team Zeta', lead: 'David Kim', members: 5, center: 'CTR-002', status: 'Training', efficiency: 85 }
                ].map((crew) => (
                  <div key={crew.id} className="ui-card" style={{ padding: 16, borderLeft: `4px solid ${crew.status === 'Active' ? '#10b981' : crew.status === 'Training' ? '#f59e0b' : '#6b7280'}` }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{crew.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Lead: {crew.lead}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{crew.id} • {crew.center}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: crew.status === 'Active' ? '#dcfce7' : crew.status === 'Training' ? '#fef3c7' : '#f3f4f6', color: crew.status === 'Active' ? '#166534' : crew.status === 'Training' ? '#92400e' : '#6b7280' }}>{crew.status}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{crew.members} members</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Efficiency: </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: crew.efficiency >= 90 ? '#10b981' : crew.efficiency >= 85 ? '#f59e0b' : '#ef4444' }}>{crew.efficiency}%</span>
                      </div>
                      <button style={{ fontSize: 10, padding: '4px 8px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Assign</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Schedule dialog */}
      {schedOpen && (
        <div onClick={()=>setSchedOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <div onClick={(e)=>e.stopPropagation()} className="card" style={{ width: 'min(520px, 95vw)', background: 'white', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 800 }}>Schedule Service</div>
              <button onClick={()=>setSchedOpen(false)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', background: 'white', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 12, color: '#6b7280' }}>Center ID
                <input value={schedForm.center_id} onChange={e=>setSchedForm(f=>({ ...f, center_id: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: 12, color: '#6b7280' }}>Start
                <input type="datetime-local" value={schedForm.start} onChange={e=>setSchedForm(f=>({ ...f, start: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: 12, color: '#6b7280' }}>End
                <input type="datetime-local" value={schedForm.end} onChange={e=>setSchedForm(f=>({ ...f, end: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={()=>setSchedOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button disabled={!!schedLoading} onClick={async ()=>{ try { setSchedLoading(schedForm.order_id); const url = buildManagerApiUrl(`/requests/${schedForm.order_id}/schedule`); const body = { center_id: schedForm.center_id, start: new Date(schedForm.start).toISOString(), end: new Date(schedForm.end).toISOString() }; const r = await managerApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error('Schedule failed'); setRequests(prev => prev.filter(x => x.order_id !== schedForm.order_id)); setSchedOpen(false); } catch (e) { alert((e as Error).message || 'Schedule failed'); } finally { setSchedLoading(null); } }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#111827', color: 'white', cursor: 'pointer' }}>{schedLoading? 'Scheduling…':'Schedule'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}

function ManagerReportScopeSelect({ repScope, setRepScope, repId, setRepId, code }:{ repScope:'center'|'customer'; setRepScope:(v:any)=>void; repId:string; setRepId:(v:string)=>void; code:string; }) {
  const [centers, setCenters] = React.useState<Array<{id:string; name:string}>>([]);
  const [customers, setCustomers] = React.useState<Array<{id:string; name:string}>>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const [c1, c2] = await Promise.all([
          fetch(`${base}/manager/centers?code=${encodeURIComponent(code)}`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`${base}/manager/customers?code=${encodeURIComponent(code)}`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({data:[]})),
        ]);
        if (!cancelled) {
          setCenters(Array.isArray(c1?.data)?c1.data:[]);
          setCustomers(Array.isArray(c2?.data)?c2.data:[]);
          if (!repId) {
            if (repScope==='center' && Array.isArray(c1?.data) && c1.data[0]) setRepId(c1.data[0].id);
            if (repScope==='customer' && Array.isArray(c2?.data) && c2.data[0]) setRepId(c2.data[0].id);
          }
        }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [code]);

  React.useEffect(() => {
    if (repScope==='center' && centers[0] && !centers.find(c=>c.id===repId)) setRepId(centers[0].id);
    if (repScope==='customer' && customers[0] && !customers.find(c=>c.id===repId)) setRepId(customers[0].id);
  }, [repScope]);

  return (
    <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
      <select value={repScope} onChange={e=>setRepScope(e.target.value as any)} style={{ padding: 8, border:'1px solid #e5e7eb', borderRadius:6, fontSize:12 }}>
        <option value="center">Center</option>
        <option value="customer">Customer</option>
      </select>
      {repScope==='center' ? (
        <select value={repId} onChange={e=>setRepId(e.target.value)} style={{ padding: 8, border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, minWidth: 200 }}>
          {centers.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.id})</option>))}
        </select>
      ) : (
        <select value={repId} onChange={e=>setRepId(e.target.value)} style={{ padding: 8, border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, minWidth: 200 }}>
          {customers.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.id})</option>))}
        </select>
      )}
    </div>
  );
}
