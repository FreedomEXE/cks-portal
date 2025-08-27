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
  const [reqBucket, setReqBucket] = useState<'needs_scheduling'|'in_progress'|'archive'>('needs_scheduling');
  const [requests, setRequests] = useState<any[]>([]);
  const [schedLoading, setSchedLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{ order: any; items: any[]; approvals: any[] } | null>(null);
  const [counts, setCounts] = useState<{ needs: number; progress: number; archive: number }>({ needs: 0, progress: 0, archive: 0 });
  const [filter, setFilter] = useState('');
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedForm, setSchedForm] = useState<{ order_id: string; center_id: string; start: string; end: string }>({ order_id: '', center_id: '', start: '', end: '' });
  
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

  // Fetch counts for badges (approximate page-limited)
  useEffect(() => {
    if (activeSection !== 'orders') return;
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
  }, [activeSection]);

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
                  {requests.filter(o => {
                    const t = (filter||'').toLowerCase();
                    if (!t) return true;
                    return String(o.order_id).toLowerCase().includes(t) || String(o.center_id||'').toLowerCase().includes(t) || String(o.customer_id||'').toLowerCase().includes(t);
                  }).map((o, i) => (
                    <tr key={o.order_id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: 10, fontFamily: 'ui-monospace', color: '#2563eb', cursor: 'pointer' }} onClick={() => openOrderDetail(o.order_id)}>{o.order_id}</td>
                      <td style={{ padding: 10 }}>{o.customer_id || '—'}</td>
                      <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>{o.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.service_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{o.status}</td>
                      <td style={{ padding: 10 }}>
                        {reqBucket === 'needs_scheduling' ? (
                          <button disabled={schedLoading===o.order_id} onClick={() => { const now=new Date(); const twoH=new Date(Date.now()+2*60*60*1000); const toLocal=(d:Date)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); setSchedForm({ order_id:o.order_id, center_id:o.center_id||'', start: toLocal(now), end: toLocal(twoH) }); setSchedOpen(true); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#3b7af7', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Schedule</button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
