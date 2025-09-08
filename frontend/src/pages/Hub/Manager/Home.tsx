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

type ManagerSection = 'dashboard' | 'profile' | 'services' | 'contractors' | 'assign' | 'orders' | 'reports' | 'support';

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
  // Contractor hierarchical expansion state
  const [expandedContractors, setExpandedContractors] = useState<Set<string>>(new Set());
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  // Assignment type selection state
  const [assignmentType, setAssignmentType] = useState<'training' | 'services' | 'crew'>('training');
  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState<{ contractors: number; customers: number; centers: number; crew: number }>({ contractors: 0, customers: 0, centers: 0, crew: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(false);
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

  // Fetch dashboard metrics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDashboardLoading(true);
        const url = buildManagerApiUrl('/dashboard', { code });
        const r = await managerApiFetch(url);
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (!cancelled && j?.success) {
          setDashboardMetrics({
            contractors: j.data?.contractors || 0,
            customers: j.data?.customers || 0,
            centers: j.data?.centers || 0,
            crew: j.data?.crew || 0
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        if (!cancelled) {
          setDashboardMetrics({ contractors: 0, customers: 0, centers: 0, crew: 0 });
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
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

  // Helper functions for hierarchical expansion
  function toggleContractorExpansion(contractorId: string) {
    setExpandedContractors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractorId)) {
        newSet.delete(contractorId);
      } else {
        newSet.add(contractorId);
      }
      return newSet;
    });
  }

  function toggleCustomerExpansion(customerId: string) {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  }

  const base = `/${username}/hub`;

  // Impersonation helper
  function jumpToId(id: string) {
    const up = (id || '').toUpperCase();
    let role = '';
    if (up.startsWith('CON-')) role = 'contractor';
    else if (up.startsWith('CUS-')) role = 'customer';
    else if (up.startsWith('CEN-') || up.startsWith('CTR-')) role = 'center';
    else if (up.startsWith('CRW-')) role = 'crew';
    if (role) {
      try {
        sessionStorage.setItem('impersonate','true');
        sessionStorage.setItem('me:lastRole', role);
        sessionStorage.setItem('me:lastCode', up);
      } catch {}
      navigate(`/${up}/hub`);
    }
  }

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
          { key: 'assign' as ManagerSection, label: 'Assign' },
          { key: 'orders' as ManagerSection, label: 'Orders' },
          { key: 'reports' as ManagerSection, label: 'Reports' },
          { key: 'support' as ManagerSection, label: 'Support' }
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
            
            {/* Simple Entity Count Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { title: 'My Contractors', value: dashboardLoading ? '—' : String(dashboardMetrics.contractors), subtitle: 'Total contractors managed', color: '#3b7af7' },
                { title: 'My Customers', value: dashboardLoading ? '—' : String(dashboardMetrics.customers), subtitle: 'Total customers served', color: '#10b981' },
                { title: 'My Centers', value: dashboardLoading ? '—' : String(dashboardMetrics.centers), subtitle: 'Service centers managed', color: '#8b5cf6' },
                { title: 'My Crew', value: dashboardLoading ? '—' : String(dashboardMetrics.crew), subtitle: 'Total crew members', color: '#f59e0b' },
              ].map(metric => (
                <div key={metric.title} className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.title}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: metric.color, marginBottom: 2 }}>{metric.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{metric.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Recent Actions */}
            <ManagerRecentActions code={code} />

            {/* Communication Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
              {/* News & Updates */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#3b7af7', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📰 News & Updates
                </div>
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📰</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No recent news</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Company news and updates will appear here</div>
                </div>
              </div>
              
              {/* Mail & Messages */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#3b7af7', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                </div>
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📬</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No messages</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Internal messages and notifications will appear here</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGN SECTION */}
        {activeSection === 'assign' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Assignment Management</h2>
            
            {/* Assignment Type Selection */}
            <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#3b7af7' }}>What would you like to assign?</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { key: 'training' as const, label: '📚 Training', desc: 'Assign training programs to crew' },
                  { key: 'services' as const, label: '⚙️ Services', desc: 'Assign services to contractors/crew' },
                  { key: 'crew' as const, label: '👥 Crew', desc: 'Assign crew to centers/jobs' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setAssignmentType(option.key)}
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 8,
                      border: assignmentType === option.key ? '2px solid #3b7af7' : '1px solid #e5e7eb',
                      background: assignmentType === option.key ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: assignmentType === option.key ? '#3b7af7' : '#111827', marginBottom: 4 }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment Content Based on Type */}
            {assignmentType === 'training' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Training Assignment</h3>
                
                {/* Training Catalog Browser */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="ui-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#3b7af7' }}>Available Training Programs</div>
                    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>📚</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>No Training Catalog</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Training programs will be created by Admin and appear here</div>
                    </div>
                  </div>

                  <div className="ui-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#3b7af7' }}>Assignment Target</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, color: '#6b7280' }}>Assign To</label>
                        <select style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}>
                          <option value="">Select crew member or team</option>
                          <option value="individual">Individual Crew Member</option>
                          <option value="team">Entire Team</option>
                          <option value="center">All Crew at Center</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#6b7280' }}>Due Date</label>
                        <input type="date" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#6b7280' }}>Notes (optional)</label>
                        <textarea rows={3} placeholder="Assignment notes..." style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}></textarea>
                      </div>
                      <button style={{ 
                        padding: '8px 16px', 
                        background: '#10b981', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 6, 
                        cursor: 'pointer',
                        fontWeight: 600,
                        opacity: 0.5
                      }} disabled>
                        Assign Training
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {assignmentType === 'services' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Service Assignment</h3>
                <div className="ui-card" style={{ padding: 16 }}>
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>⚙️</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Service Assignment</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Service assignment workflow will be implemented based on services catalog</div>
                  </div>
                </div>
              </div>
            )}

            {assignmentType === 'crew' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Crew Assignment</h3>
                <div className="ui-card" style={{ padding: 16 }}>
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Crew Assignment</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Crew assignment workflow for assigning crew to centers and jobs</div>
                  </div>
                </div>
              </div>
            )}
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
                            user_role: 'manager',
                            user_hub: 'manager',
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

            {/* Help Resources */}
            <div className="ui-card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Help Resources</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>📖</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Manager Guide</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Complete guide to manager operations</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>🎥</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Video Tutorials</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Step-by-step video instructions</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>❓</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>FAQ</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Frequently asked questions</div>
                </div>
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
                              <td style={{ padding: 10 }}>
                                {o.customer_id ? (
                                  <a onClick={() => jumpToId(o.customer_id)} style={{ color:'#2563eb', cursor:'pointer', textDecoration:'underline' }}>{o.customer_id}</a>
                                ) : '—'}
                              </td>
                              <td style={{ padding: 10 }}>
                                {o.center_id ? (
                                  <a onClick={() => jumpToId(o.center_id)} style={{ color:'#2563eb', cursor:'pointer', textDecoration:'underline' }}>{o.center_id}</a>
                                ) : '—'}
                              </td>
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
                        <div><b>Customer:</b> {detail.order.customer_id ? (
                          <a onClick={() => jumpToId(detail.order.customer_id)} style={{ color:'#2563eb', cursor:'pointer', textDecoration:'underline' }}>{detail.order.customer_id}</a>
                        ) : '—'}</div>
                        <div><b>Center:</b> {detail.order.center_id ? (
                          <a onClick={() => jumpToId(detail.order.center_id)} style={{ color:'#2563eb', cursor:'pointer', textDecoration:'underline' }}>{detail.order.center_id}</a>
                        ) : '—'}</div>
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
              {['Profile', 'Settings'].map((tab, i) => (
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
                          {(() => {
                            const rows: Array<[string, any]> = [
                              ['Full Name', state.data?.name || 'Manager Demo'],
                              ['Manager ID', state.data?.manager_id || code],
                              ['Territory', state.data?.territory || 'Demo Territory'],
                              ['Reports To', state.data?.reports_to || 'Senior Manager'],
                              ['Email', state.data?.email || 'manager@demo.com'],
                              ['Phone', state.data?.phone || '(555) 123-4567'],
                              ['Start Date', state.data?.start_date || ''],
                              ['Role', state.data?.role || 'Territory Manager']
                            ];
                            function fmtDate(v: any) {
                              try {
                                if (!v) return '—';
                                const dt = new Date(v);
                                if (isNaN(dt.getTime())) return String(v);
                                return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
                              } catch { return String(v || '—'); }
                            }
                            return rows.map(([label, val]) => {
                              const display = label === 'Start Date' ? fmtDate(val) : String(val ?? '');
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
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Manager Settings</h3>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {/* Notification Settings */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Notifications</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input type="checkbox" defaultChecked />
                          Email notifications for new assignments
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input type="checkbox" defaultChecked />
                          SMS alerts for urgent issues
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input type="checkbox" />
                          Weekly performance reports
                        </label>
                      </div>
                    </div>

                    {/* Display Settings */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Display</h4>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 12, color: '#6b7280' }}>Dashboard Refresh Rate</label>
                          <select style={{ width: '200px', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}>
                            <option value="30">30 seconds</option>
                            <option value="60" selected>1 minute</option>
                            <option value="300">5 minutes</option>
                            <option value="600">10 minutes</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: '#6b7280' }}>Time Zone</label>
                          <select style={{ width: '200px', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ marginTop: 16 }}>
                      <button style={{ 
                        padding: '8px 16px', 
                        background: '#10b981', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 6, 
                        fontSize: 14, 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}>
                        Save Settings
                      </button>
                    </div>
                  </div>
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
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>⚙️</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Services Assigned</div>
                <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                  Services will be assigned to this manager territory via the Admin Hub.<br />
                  Available services will appear here once assigned.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTORS SECTION - Hierarchical View */}
        {activeSection === 'contractors' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Contractors</h2>
            
            <ContractorsSection code={code} />
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

function ManagerRecentActions({ code }: { code: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const url = `${baseApi}/manager/activity?code=${encodeURIComponent(code)}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();
        
        if (!res.ok) {
          console.error('Failed to load manager activities:', json?.error);
          if (!cancelled) setActivities([]);
          return;
        }
        
        if (!cancelled) {
          setActivities(Array.isArray(json?.data) ? json.data.slice(0, 5) : []);
        }
      } catch (err: any) {
        console.error('[ManagerRecentActions] fetch error:', err);
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#3b7af7' }}>Recent Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            Loading recent actions...
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={activity.activity_id} style={{ 
              padding: 12, 
              background: '#f8fafc', 
              borderRadius: 8, 
              borderLeft: '3px solid #3b7af7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                  {activity.description}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {activity.activity_type} • {activity.actor_role}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {new Date(activity.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No recent actions</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Manager actions will appear here as they occur</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractorsSection({ code }: { code: string }) {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const url = `${baseApi}/manager/contractors?code=${encodeURIComponent(code)}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        
        if (!cancelled) {
          setContractors(Array.isArray(json?.data) ? json.data : []);
        }
      } catch (err: any) {
        console.error('[ContractorsSection] fetch error:', err);
        if (!cancelled) {
          setError(err?.message || 'Failed to load contractors');
          setContractors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (loading) {
    return (
      <div className="ui-card" style={{ padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          Loading contractors...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-card" style={{ padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 20, color: '#dc2626' }}>
          Error loading contractors: {error}
        </div>
      </div>
    );
  }

  if (contractors.length === 0) {
    return (
      <div className="ui-card" style={{ padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Contractors Assigned</div>
          <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
            When contractors are assigned to your territory via the Admin Hub,<br />
            they will appear here in a hierarchical view:<br />
            <strong>Contractor → Customers → Centers → Crew</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Contractor</th>
            <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Company</th>
            <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Contact</th>
            <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Email</th>
            <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Phone</th>
            <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {contractors.map((contractor, index) => (
            <tr key={contractor.contractor_id} style={{ 
              borderBottom: index < contractors.length - 1 ? '1px solid #e5e7eb' : 'none',
              backgroundColor: 'white'
            }}>
              <td style={{ padding: 12, fontFamily: 'ui-monospace', fontWeight: 600 }}>
                <Link
                  to={`/${contractor.contractor_id}/hub`}
                  onClick={() => { try { sessionStorage.setItem('impersonate','true'); sessionStorage.setItem('me:lastRole','contractor'); sessionStorage.setItem('me:lastCode', contractor.contractor_id); } catch {} }}
                  className="text-blue-600 hover:underline cursor-pointer font-medium"
                  style={{ textDecoration: 'none', color: '#2563eb' }}
                >
                  {contractor.contractor_id}
                </Link>
              </td>
              <td style={{ padding: 12, fontWeight: 500 }}>
                {contractor.company_name || '—'}
              </td>
              <td style={{ padding: 12 }}>
                {contractor.main_contact || '—'}
              </td>
              <td style={{ padding: 12 }}>
                {contractor.email || '—'}
              </td>
              <td style={{ padding: 12 }}>
                {contractor.phone || '—'}
              </td>
              <td style={{ padding: 12 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: contractor.status === 'active' ? '#d1fae5' : '#fef3c7',
                  color: contractor.status === 'active' ? '#065f46' : '#92400e'
                }}>
                  {contractor.status || 'active'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
