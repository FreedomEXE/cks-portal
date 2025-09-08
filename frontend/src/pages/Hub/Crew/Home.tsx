/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Crew Hub - FULLY INDEPENDENT)
 * 
 * Description: Complete Crew hub dashboard with all functionality in one file
 * Function: Crew landing page with navigation, profile, time tracking, and task management
 * Importance: Critical - Primary interface for crew members (field workers)
 * Connects to: Crew API, Crew authentication, Crew session management
 * 
 * Notes: 100% self-contained - no external component dependencies.
 *        Includes hardcoded Page styling, center-focused work, and time tracking.
 *        Uses Crew-specific API endpoints and field worker authentication.
 *        All Crew hub functionality consolidated for operational worker experience.
 *        Crew members work at centers and report to facility coordinators.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCrewData from './hooks/useCrewData';
import { setCrewSession, getCrewSession } from './utils/crewAuth';
import { buildCrewApiUrl, crewApiFetch } from './utils/crewApi';
import CrewLogoutButton from './components/LogoutButton';

type DailyTask = {
  id: string;
  title: string;
  area: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  estimated_time: string;
  due_time: string;
};

type TrainingModule = {
  id: string;
  title: string;
  type: 'Safety' | 'Equipment' | 'Procedure';
  status: 'Required' | 'Optional' | 'Completed';
  due_date: string;
};

type CrewSection = 'dashboard' | 'profile' | 'schedule' | 'tasks' | 'timecard' | 'training' | 'reports' | 'center' | 'services' | 'support';

export default function CrewHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useCrewData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<CrewSection>('dashboard');
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Get crew code and name from profile data
  const session = getCrewSession();
  const storedCode = session.code || '';
  const rawCode = storedCode || state.data?.crew_id || state.data?.code || 'crew-000';
  const code = String(rawCode);
  const crewName = state.data?.crew_name || 'Crew Member';
  const centerId = state.data?.center_id || 'Not Assigned';
  const centerName = state.data?.center_assigned || 'Not Assigned';
  // Reports & Feedback (read-only)
  const [repTab, setRepTab] = useState<'reports'|'feedback'>('reports');
  const [repReports, setRepReports] = useState<any[]>([]);
  const [repFeedback, setRepFeedback] = useState<any[]>([]);
  const [repTotals, setRepTotals] = useState<any>({});
  const [repLoading, setRepLoading] = useState(false);
  const [archReportId, setArchReportId] = useState('');
  const [archFeedbackId, setArchFeedbackId] = useState('');
  const [repDetailOpen, setRepDetailOpen] = useState(false);
  const [repDetail, setRepDetail] = useState<{ report:any; comments:any[] }|null>(null);
  const [fbDetailOpen, setFbDetailOpen] = useState(false);
  const [fbDetail, setFbDetail] = useState<any|null>(null);

  // Store crew session for navigation context
  useEffect(() => {
    if (!state.loading && !state.error && code && !['crew','crew-000'].includes(code)) {
      setCrewSession(code, crewName, centerId);
    }
  }, [state.loading, state.error, code, crewName, centerId]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch crew tasks and training data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDataLoading(true);
        
        // Fetch daily tasks and training
        const tasksUrl = buildCrewApiUrl('/tasks', { code, date: 'today' });
        const trainingUrl = buildCrewApiUrl('/training', { code });
        
        const [tasksRes, trainingRes] = await Promise.all([
          crewApiFetch(tasksUrl).catch(() => null),
          crewApiFetch(trainingUrl).catch(() => null)
        ]);
        
        if (!cancelled) {
          // Daily tasks
          if (tasksRes?.ok) {
            const tasksData = await tasksRes.json();
            const items = Array.isArray(tasksData?.data) ? tasksData.data : (Array.isArray(tasksData?.tasks) ? tasksData.tasks : []);
            setDailyTasks(items);
          } else {
            // No task data available
            setDailyTasks([]);
          }
          
          // Training modules
          if (trainingRes?.ok) {
            const trainingData = await trainingRes.json();
            const items = Array.isArray(trainingData?.data) ? trainingData.data : (Array.isArray(trainingData?.modules) ? trainingData.modules : []);
            setTrainingModules(items);
          } else {
            // No training data available
            setTrainingModules([]);
          }
        }
      } catch (error) {
        console.error('[CrewHome] data fetch error:', error);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  // Fetch center reports/feedback when viewing Reports section  
  useEffect(() => {
    if (activeSection !== 'reports') return;
    let cancelled = false;
    (async () => {
      try {
        setRepLoading(true);
        const base = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        if (repTab === 'reports') {
          const r = await fetch(`${base}/reports?center_id=${encodeURIComponent(centerId)}&limit=25`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) { setRepReports(Array.isArray(j?.data)?j.data:[]); setRepTotals(j?.totals||{}); }
        } else {
          const r = await fetch(`${base}/feedback?center_id=${encodeURIComponent(centerId)}&limit=25`, { credentials: 'include' });
          const j = await r.json();
          if (!cancelled) { setRepFeedback(Array.isArray(j?.data)?j.data:[]); setRepTotals(j?.totals||{}); }
        }
      } finally { if (!cancelled) setRepLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [activeSection, repTab, centerId]);

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
        {/* Hardcoded Page header styling - Red theme */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              Crew Hub
            </h1>
          </div>
          <CrewLogoutButton />
        </div>
        <div style={{ animation: 'fadeIn .12s ease-out' }}>
          <div style={{ padding: 16, background: '#fef2f2', borderRadius: 12 }}>
            Loading crew hub...
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
          borderTop: '4px solid #ef4444'
        }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Crew Hub
          </h1>
          <CrewLogoutButton />
        </div>
        <div style={{ padding: 16, color: '#b91c1c', background: '#fef2f2', borderRadius: 12 }}>
          Crew Hub Error: {state.error}
        </div>
      </div>
    );
  }

  // Main render with all sections
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hardcoded Page header with navigation tabs - Red theme */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #ef4444'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Crew Hub
          </h1>
        </div>
        <CrewLogoutButton />
      </div>

      {/* Welcome message for field worker */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome, {crewName} ({code}) - {state.data?.role || 'Crew Member'} at {centerName}
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard' as CrewSection, label: 'Work Dashboard' },
          { key: 'profile' as CrewSection, label: 'My Profile' },
          { key: 'center' as CrewSection, label: 'My Center' },
          { key: 'services' as CrewSection, label: 'My Services' },
          { key: 'training' as CrewSection, label: 'My Training' },
          { key: 'reports' as CrewSection, label: 'Reports' },
          { key: 'support' as CrewSection, label: 'Support' }
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
        
        {/* WORK DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Work Dashboard</h2>
            
            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Hours This Week', value: state.data?.hours_this_week || 0, color: '#ef4444' },
                { label: 'Tasks Completed', value: state.data?.tasks_completed || 0, color: '#ef4444' },
                { label: 'Current Status', value: state.data?.current_status || 'Off Duty', color: '#ef4444' },
                { label: 'Shift Schedule', value: state.data?.shift_schedule || 'Not scheduled', color: '#3b82f6' },
                { label: 'Training Due', value: trainingModules.filter(m => m.status === 'Required').length + ' Modules', color: '#eab308' }
              ].map((metric, i) => (
                <div key={i} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: metric.color || '#111827' }}>{metric.value}</div>
                  {metric.trend && (
                    <div style={{ fontSize: 12, color: metric.color || '#ef4444', marginTop: 4 }}>{metric.trend}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Clock In/Out */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="ui-card" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Quick Time Clock</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>
                    Current Time: {currentTime.toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => setClockedIn(!clockedIn)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: clockedIn ? '#dc2626' : '#16a34a',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {clockedIn ? '🔴 Clock Out' : '🟢 Clock In'}
                  </button>
                </div>
              </div>
              
              <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Today's Hours</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{state.data?.hours_today || 0}</div>
                <div style={{ fontSize: 12, color: '#10b981' }}>Standard Day</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
              <div className="title" style={{ marginBottom: 12, color: '#ef4444' }}>Recent Activity</div>
              {activityLoading ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Loading activity...</div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No recent activity</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Your work updates will appear here</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activities.slice(0, 6).map((a:any) => {
                    const type = String(a.activity_type || '');
                    const isWelcome = type === 'user_welcome' || type === 'welcome_message';
                    if (isWelcome) {
                      return (
                        <div key={a.activity_id || `${a.description}-${a.created_at}`}
                             style={{ padding: 12, background: '#ecfdf5', borderLeft: '4px solid #10b981', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700, color: '#065f46' }}>Welcome</div>
                          <div style={{ margin: '2px 0', color: '#065f46' }}>{a.description}</div>
                          <div style={{ fontSize: 11, color: '#047857' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                        </div>
                      );
                    }
                    if (type === 'center_assigned') {
                      return (
                        <div key={a.activity_id || `${a.description}-${a.created_at}`}
                             style={{ padding: 12, background: '#fee2e2', borderLeft: '4px solid #ef4444', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700, color: '#991b1b' }}>Center Assignment</div>
                          <div style={{ margin: '2px 0', color: '#991b1b' }}>{a.description}</div>
                          <div style={{ fontSize: 11, color: '#b91c1c' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                        </div>
                      );
                    }
                    return (
                      <div key={a.activity_id || `${a.description}-${a.created_at}`}
                           style={{ padding: 12, background: '#f8fafc', borderLeft: '3px solid #e5e7eb', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600 }}>{(a.activity_type || 'activity').toString().replace(/_/g,' ')}</div>
                        <div style={{ opacity: 0.9 }}>{a.description}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today's Tasks */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Today's Tasks</h3>
            <div className="ui-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Task</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Area</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Priority</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Due Time</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Est. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyTasks.map((task, i) => (
                    <tr key={task.id} style={{ borderBottom: i < dailyTasks.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>{task.title}</td>
                      <td style={{ padding: 12, fontSize: 14 }}>{task.area}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: task.priority === 'High' ? '#fecaca' : task.priority === 'Medium' ? '#fed7aa' : '#e5e7eb',
                          color: task.priority === 'High' ? '#991b1b' : task.priority === 'Medium' ? '#9a3412' : '#374151'
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: task.status === 'Completed' ? '#dcfce7' : task.status === 'In Progress' ? '#fef3c7' : '#fee2e2',
                          color: task.status === 'Completed' ? '#166534' : task.status === 'In Progress' ? '#92400e' : '#991b1b'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>{task.due_time}</td>
                      <td style={{ padding: 12, fontSize: 14 }}>{task.estimated_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Communication Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* News & Updates */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📰 News & Updates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No news updates available.
                  </div>
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                  border: '1px solid #fecaca',
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
                <div className="title" style={{ marginBottom: 16, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No mail messages available.
                  </div>
                  
                  <button
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      borderRadius: 6,
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      marginTop: 8,
                      padding: '8px 16px'
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
        )}

        {/* CREW PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Profile</h2>
            
            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Personal Info', 'Work Details', 'Certifications', 'Emergency Contact', 'Performance'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: profileTab === i ? '#ef4444' : 'white',
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
                    {/* Crew Photo */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#ef4444',
                        margin: '0 auto 12px',
                        border: '2px solid #ef4444'
                      }}>
                        {crewName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CR'}
                      </div>
                      <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Photo</button>
                    </div>

                    {/* Crew Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {(() => {
                            function fmtDate(v: any) {
                              try { if (!v) return 'Not Set'; const d=new Date(v); if(isNaN(d.getTime())) return String(v); return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'});} catch { return String(v||'Not Set'); }
                            }
                            const rows: Array<[string, any]> = [
                              ['Full Name', crewName || 'Not Set'],
                              ['Reports To (Manager ID)', 'Not Set'],
                              ['Crew ID', code || 'Not Set'],
                              ['Role', 'Not Set'],
                              ['Start Date', ''],
                              ['Years with Company', 'Not Set'],
                              ['Primary Region', 'Not Set'],
                              ['Email', 'Not Set'],
                              ['Languages', 'Not Set'],
                              ['Phone', 'Not Set'],
                              ['Emergency Contact', 'Not Set'],
                              ['Home Address', 'Not Set'],
                              ['LinkedIn', 'Not Set'],
                              ['Status', 'Active'],
                              ['QR Code', 'Not Set']
                            ];
                            return rows.map(([label, val]) => (
                              <tr key={label}>
                                <td style={{ padding: '8px 0', fontWeight: 600, width: '30%' }}>{label}</td>
                                <td style={{ padding: '8px 0' }}>{label==='Start Date'?fmtDate(val):String(val ?? '')}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {profileTab === 1 && (
                <div style={{ padding: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <tbody>
                      {[
                        ['Assigned Center', 'Not Assigned'],
                        ['Manager/Supervisor', 'Not Assigned'],
                        ['Hire Date', 'Not Set'],
                        ['Years with Company', 'Not Set'],
                        ['Primary Region', 'Not Set'],
                        ['Shift Schedule', 'Not Set'],
                        ['Employment Type', 'Not Set'],
                        ['Department', 'Not Set'],
                        ['Availability', 'Not Set'],
                        ['Preferred Areas', 'Not Set']
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
                <div style={{ padding: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <tbody>
                      {[
                        ['Primary Skills', 'Not Set'],
                        ['Certification Level', 'Not Set'],
                        ['OSHA Training', 'Not Certified'],
                        ['Equipment Training', 'Not Set'],
                        ['Specialized Training', 'Not Set']
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
                <div style={{ padding: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <tbody>
                      {[
                        ['Emergency Contact Name', 'Not Set'],
                        ['Relationship', 'Not Set'],
                        ['Emergency Phone', 'Not Set'],
                        ['Emergency Email', 'Not Set'],
                        ['Medical Conditions', 'None'],
                        ['Medications', 'None'],
                        ['Allergies', 'None'],
                        ['Blood Type', 'Not Set'],
                        ['Insurance Provider', 'Not Set'],
                        ['Insurance ID', 'Not Set']
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
                <div style={{ padding: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <tbody>
                      {[
                        ['Overall Rating', 'Not Rated'],
                        ['Last Review Date', 'Not Set'],
                        ['Next Review Due', 'Not Set'],
                        ['Quality Rating', 'Not Rated'],
                        ['Reliability Rating', 'Not Rated'],
                        ['Teamwork Rating', 'Not Rated'],
                        ['Punctuality', 'Not Set'],
                        ['Tasks Completed YTD', 'Not Set'],
                        ['Customer Feedback Score', 'Not Set'],
                        ['Goals for Next Quarter', 'Not Set'],
                        ['Manager Notes', 'Not Set'],
                        ['Disciplinary Actions', 'None']
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
            </div>
          </div>
        )}


        {/* MY CENTER SECTION */}
        {activeSection === 'center' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>My Center - {centerName}</h2>
            
            {/* Center Subsections Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
              
              {/* My Schedule Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📅 My Schedule</div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Weekly schedules, shift assignments, and time-off requests
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 4 }}>This Week</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Shifts</span>
                </div>
              </div>

              {/* Daily Tasks Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>✓ Daily Tasks</div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Task assignments and completion tracking
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>Active</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Pending</span>
                </div>
              </div>

              {/* Time Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>⏰ Time Card</div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Clock in/out, hours tracking, and timesheet management
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 4 }}>Week</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>History</span>
                </div>
              </div>

              {/* Procedures Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📋 Procedures</div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Center-specific procedures, guidelines, and protocols
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 8px', borderRadius: 4 }}>Guides</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Protocols</span>
                </div>
              </div>

              {/* Center Info Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>🏢 Center Info</div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Facility details, equipment locations, and procedures
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 4 }}>Details</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Map</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* MY SERVICES SECTION */}
        {activeSection === 'services' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>My Services</h2>
            
            {/* Services Subsections Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, marginBottom: 24 }}>
              
              {/* Active Services Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>🔥 Active Services</div>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Live
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Currently assigned services and ongoing work orders
                </div>
                
                {/* Active Services List */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No active services.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>0 Active</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>View All</span>
                </div>
              </div>

              {/* Scheduled Services Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📅 Scheduled Services</div>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Upcoming
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Future service assignments and planned work orders
                </div>
                
                {/* Scheduled Services List */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No scheduled services.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 4 }}>0 Upcoming</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Calendar</span>
                </div>
              </div>

              {/* Service History Card - Full Width */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #6b7280', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📋 Service History</div>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Archive
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Search and view completed services and work order history
                </div>
                
                {/* Search Bar */}
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Search services by location, type, date, or service ID..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'white'
                    }}
                  />
                </div>
                
                {/* Recent Service History */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24, gridColumn: '1 / -1' }}>
                    No service history available.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#e5e7eb', color: '#374151', padding: '4px 8px', borderRadius: 4 }}>0 Total</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Export</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Filter</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY TRAINING SECTION */}
        {activeSection === 'training' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>My Training</h2>
            
            {/* Training Subsections Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, marginBottom: 24 }}>
              
              {/* Completed Training Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>✅ Completed Training</div>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Certified
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Successfully completed training modules and certifications
                </div>
                
                {/* Completed Training List */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No completed training available.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>0 Modules</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Certificates</span>
                </div>
              </div>

              {/* Scheduled Training Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📅 Scheduled Training</div>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Upcoming
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Upcoming training sessions and required modules
                </div>
                
                {/* Scheduled Training List */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No scheduled training available.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 4 }}>0 Pending</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Calendar</span>
                </div>
              </div>

              {/* Training Progress Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📊 Training Progress</div>
                  <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    0%
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Current training progress and annual requirements
                </div>
                
                {/* Progress Items */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Annual Training Hours</div>
                    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, marginBottom: 4 }}>
                      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, width: '0%' }}></div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>0 of 40 hours completed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Certification Renewal</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>0 certifications expire within 90 days</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 8px', borderRadius: 4 }}>Progress</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Reports</span>
                </div>
              </div>

              {/* Certifications Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>🏆 Certifications</div>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Active
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Current certifications and professional credentials
                </div>
                
                {/* Certifications List */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No certifications available.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 4 }}>0 Active</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Renew</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeSection === 'reports' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Reports & Feedback</h2>
            
            {/* Reports & Feedback (read-only) */}
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Center Reports & Feedback</div>
                <div style={{ display:'inline-flex', gap:8, marginLeft: 12 }}>
                  <button onClick={()=>setRepTab('reports')} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb', background: repTab==='reports'?'#ef4444':'white', color: repTab==='reports'?'white':'#111827', fontSize:12, fontWeight:700 }}>Reports</button>
                  <button onClick={()=>setRepTab('feedback')} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb', background: repTab==='feedback'?'#ef4444':'white', color: repTab==='feedback'?'white':'#111827', fontSize:12, fontWeight:700 }}>Feedback</button>
                </div>
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
                          <tr key={r.report_id} onClick={()=>openReportDetail(r.report_id)} style={{ cursor:'pointer', borderBottom: i<repReports.length-1? '1px solid #e5e7eb':'none' }}>
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
                          <tr key={f.feedback_id} onClick={()=>openFeedbackDetail(f.feedback_id)} style={{ cursor:'pointer', borderBottom: i<repFeedback.length-1? '1px solid #e5e7eb':'none' }}>
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

            {/* Detail overlays (read-only) */}
            {repDetailOpen && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }} onClick={()=>{ setRepDetailOpen(false); setRepDetail(null); }}>
                <div className="ui-card" style={{ width: 700, maxWidth: '90%', padding: 16 }} onClick={e=>e.stopPropagation()}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>Report Detail</div>
                    <button onClick={()=>{ setRepDetailOpen(false); setRepDetail(null); }} style={{ padding: 6, border:'1px solid #e5e7eb', borderRadius: 999, background:'white' }}>✕</button>
                  </div>
                  {!repDetail && <div style={{ color:'#6b7280' }}>Loading...</div>}
                  {!!repDetail && (
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
                      </div>
                      <div style={{ fontSize: 12, color:'#6b7280', marginTop: 8 }}>By {repDetail.report.created_by_role}:{repDetail.report.created_by_id}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        )}

        {/* SUPPLIES/EQUIPMENT SECTION - Future feature */}
        {false && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Supplies & Equipment</h2>
            
            {/* Supplies Subsections Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, marginBottom: 24 }}>
              
              {/* Current Active Supplies Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📦 Active Supplies</div>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    In Use
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Currently assigned supplies and equipment
                </div>
                
                {/* Active Supplies List */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No active supplies assigned.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>0 Items</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Request New</span>
                </div>
              </div>

              {/* Supply Requests Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📋 Supply Requests</div>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Pending
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Request new supplies and report equipment issues
                </div>
                
                {/* Recent Requests */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No recent requests.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 4 }}>New Request</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>History</span>
                </div>
              </div>

              {/* Supply History/Archive - Full Width */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #6b7280', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📂 Supply History</div>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    Archive
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Historical log of all supplies used and equipment assignments
                </div>
                
                {/* Search Bar */}
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Search by supply name, equipment ID, date, or condition..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'white'
                    }}
                  />
                </div>
                
                {/* Historical Supply Records */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: 24, gridColumn: '1 / -1' }}>
                    No supply history available.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#e5e7eb', color: '#374151', padding: '4px 8px', borderRadius: 4 }}>0 Records</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Export</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Filter</span>
                </div>
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
                            user_role: 'crew',
                            user_hub: 'crew',
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
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Contact Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Technical Support</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>For app-related issues and questions</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Response: 4-24 hours</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Center Coordinator</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>For work-related questions and support</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Contact your center coordinator</div>
                </div>
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
