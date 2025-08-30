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

type CenterSection = 'dashboard' | 'profile' | 'services' | 'orders' | 'crew' | 'reports' | 'support';

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

  // Fetch orders when viewing Orders section
  useEffect(() => {
    if (activeSection !== 'orders') return;
    let cancelled = false;
    (async () => {
      try {
        const url = buildCenterApiUrl('/orders', { code, bucket: ordersBucket, limit: 25 });
        const res = await centerApiFetch(url);
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

  // Fetch counts for buckets
  useEffect(() => {
    if (activeSection !== 'orders') return;
    if (hasTotals) return; // backend provided totals; skip approximation fetches
    let cancelled = false;
    (async () => {
      try {
        const [p, a, r] = await Promise.all([
          centerApiFetch(buildCenterApiUrl('/orders', { code, bucket: 'pending', limit: 25 })).then(r=>r.json()).catch(()=>({data:[]})),
          centerApiFetch(buildCenterApiUrl('/orders', { code, bucket: 'approved', limit: 25 })).then(r=>r.json()).catch(()=>({data:[]})),
          centerApiFetch(buildCenterApiUrl('/orders', { code, bucket: 'archive', limit: 25 })).then(r=>r.json()).catch(()=>({data:[]})),
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
    } catch {
      setDetail(null);
    } finally { setDetailLoading(false); }
  }
  function closeDetail() { setDetailOpen(false); setDetail(null); }

  // Fetch reports/feedback for the center when viewing Reports section
  useEffect(() => {
    if (activeSection !== 'reports') return;
    let cancelled = false;
    (async () => {
      try {
        setRepLoading(true);
        const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        if (repTab === 'reports') {
          const r = await fetch(`${base}/reports?center_id=${encodeURIComponent(code)}&limit=25`, { credentials: 'include' });
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
          const r = await fetch(`${base}/feedback?center_id=${encodeURIComponent(code)}&limit=25`, { credentials: 'include' });
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
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'center' },
        credentials: 'include',
        body: JSON.stringify({ center_id: code, ...newReportForm }),
      });
      if (!res.ok) throw new Error('Create report failed');
      setNewReportOpen(false);
      setNewReportForm({ type: 'service_issue', severity: '', title: '', description: '' });
      // refresh list by toggling tab
      setRepTab('reports');
    } catch (e) { alert((e as Error).message); }
  }

  async function submitNewFeedback() {
    try {
      const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
      const res = await fetch(`${base}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'center' },
        credentials: 'include',
        body: JSON.stringify({ center_id: code, ...newFeedbackForm }),
      });
      if (!res.ok) throw new Error('Create feedback failed');
      setNewFeedbackOpen(false);
      setNewFeedbackForm({ kind: 'issue', title: '', message: '' });
      setRepTab('feedback');
    } catch (e) { alert((e as Error).message); }
  }

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
  async function addCenterComment() {
    if (!repDetail?.report?.report_id || !repComment.trim()) return;
    const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
    const r = await fetch(`${base}/reports/${repDetail.report.report_id}/comments`, {
      method: 'POST', headers: { 'Content-Type':'application/json', 'x-user-role':'center' }, credentials:'include',
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
                onClick={() => navigate('/catalog?type=service')}
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
                onClick={() => navigate('/catalog?type=product')}
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
                
                {profileTab === 3 && (
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

      case 'orders':
        return (
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['pending','approved','archive'] as const).map(b => {
                const label = b === 'pending' ? 'Pending Requests' : b === 'approved' ? 'Approved Requests' : 'Archive';
                const count = b === 'pending' ? orderCounts.pending : b === 'approved' ? orderCounts.approved : orderCounts.archive;
                return (
                  <button key={b} onClick={() => setOrdersBucket(b)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: ordersBucket===b? '#111827':'white', color: ordersBucket===b? 'white':'#111827', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span>{label}</span>
                    <span style={{ fontSize: 11, background: ordersBucket===b? '#fed7aa':'#f3f4f6', color: '#111827', borderRadius: 12, padding: '2px 6px' }}>{count}</span>
                  </button>
                );
              })}
              </div>
              <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Order ID</th>
                      <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Customer</th>
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
                        <td style={{ padding: 10 }}>{o.customer_id || '—'}</td>
                        <td style={{ padding: 10 }}>{o.item_count ?? 0}</td>
                        <td style={{ padding: 10 }}>{o.service_count ?? 0}</td>
                        <td style={{ padding: 10 }}>{o.product_count ?? 0}</td>
                        <td style={{ padding: 10 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, background: '#ffedd5', color: '#9a3412', fontSize: 12 }}>{o.status}</span>
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
          <>
          <div style={{ animation: 'fadeIn .12s ease-out' }}>
            <div className="title" style={{ marginBottom: 12, color: '#f97316', display: 'flex', alignItems: 'center', gap: 8 }}>
              Reports & Feedback
              <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
                <button onClick={()=>setRepTab('reports')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: repTab==='reports'?'#f97316':'white', color: repTab==='reports'?'white':'#111827', fontSize: 12, fontWeight: 700 }}>Reports</button>
                <button onClick={()=>setRepTab('feedback')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: repTab==='feedback'?'#f97316':'white', color: repTab==='feedback'?'white':'#111827', fontSize: 12, fontWeight: 700 }}>Feedback</button>
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
                      <button onClick={submitNewReport} style={{ padding: '8px 12px', borderRadius: 6, background: '#f97316', color: 'white', border: '1px solid #ea580c', fontWeight: 700 }}>Submit</button>
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
                        <tr><td colSpan={6} style={{ padding: 16 }}>Loading...</td></tr>
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
                      <button onClick={submitNewFeedback} style={{ padding: '8px 12px', borderRadius: 6, background: '#f97316', color: 'white', border: '1px solid #ea580c', fontWeight: 700 }}>Submit</button>
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
                        <tr><td colSpan={4} style={{ padding: 16 }}>Loading...</td></tr>
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
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
              <input placeholder="Report ID (e.g., RPT-1001)" value={archReportId} onChange={e=>setArchReportId(e.target.value)} onKeyDown={async (e)=>{ if (e.key==='Enter') { const id=archReportId.trim(); if (id) await openReportDetail(id); } }} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, minWidth: 200 }} />
              <button onClick={async ()=>{ const id=archReportId.trim(); if (id) await openReportDetail(id); }} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'white' }}>Open Report</button>
              <input placeholder="Feedback ID (e.g., FDB-1001)" value={archFeedbackId} onChange={e=>setArchFeedbackId(e.target.value)} onKeyDown={async (e)=>{ if (e.key==='Enter') { const id=archFeedbackId.trim(); if (id) await openFeedbackDetail(id); } }} style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:6, minWidth: 200 }} />
              <button onClick={async ()=>{ const id=archFeedbackId.trim(); if (id) await openFeedbackDetail(id); }} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'white' }}>Open Feedback</button>
            </div>
          </div>
          </>
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
          { key: 'orders', label: 'Orders' },
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
                      <button onClick={addCenterComment} style={{ padding:'8px 12px', borderRadius:6, background:'#f97316', color:'white', border:'1px solid #ea580c', fontWeight:700 }}>Post</button>
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
    </div>
  );
}
