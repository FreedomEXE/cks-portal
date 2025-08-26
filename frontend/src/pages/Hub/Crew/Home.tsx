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

type CrewSection = 'dashboard' | 'profile' | 'schedule' | 'tasks' | 'timecard' | 'training' | 'center' | 'services';

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
  const crewName = state.data?.crew_name || 'Mike Johnson';
  const centerId = state.data?.center_id || 'CEN-001';
  const centerName = state.data?.center_assigned || 'Downtown Operations Center';

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
            // Demo task data
            setDailyTasks([
              { id: 'task-001', title: 'Clean main lobby', area: 'Main Floor', priority: 'High', status: 'Completed', estimated_time: '1.5 hrs', due_time: '9:00 AM' },
              { id: 'task-002', title: 'Restock restroom supplies', area: 'Upper Level', priority: 'Medium', status: 'In Progress', estimated_time: '30 min', due_time: '11:00 AM' },
              { id: 'task-003', title: 'Vacuum parking garage', area: 'Parking Garage', priority: 'Low', status: 'Pending', estimated_time: '45 min', due_time: '2:00 PM' }
            ]);
          }
          
          // Training modules
          if (trainingRes?.ok) {
            const trainingData = await trainingRes.json();
            const items = Array.isArray(trainingData?.data) ? trainingData.data : (Array.isArray(trainingData?.modules) ? trainingData.modules : []);
            setTrainingModules(items);
          } else {
            // Demo training data
            setTrainingModules([
              { id: 'train-001', title: 'Chemical Safety Refresher', type: 'Safety', status: 'Required', due_date: '2025-09-15' },
              { id: 'train-002', title: 'Equipment Maintenance', type: 'Equipment', status: 'Optional', due_date: '2025-10-01' },
              { id: 'train-003', title: 'Emergency Procedures', type: 'Safety', status: 'Completed', due_date: '2025-08-01' }
            ]);
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
          { key: 'supplies' as CrewSection, label: 'Supplies/Equipment' }
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
                { label: 'Hours This Week', value: state.data?.hours_this_week || 32, color: '#ef4444' },
                { label: 'Tasks Completed', value: state.data?.tasks_completed || 15, trend: '+3', color: '#ef4444' },
                { label: 'Current Status', value: state.data?.current_status || 'On Duty', color: '#10b981' },
                { label: 'Shift Schedule', value: state.data?.shift_schedule || '6 AM - 2 PM', color: '#3b82f6' },
                { label: 'Training Due', value: '1 Module', color: '#eab308' },
                { label: 'Hourly Rate', value: state.data?.hourly_rate || '$18.50', color: '#8b5cf6' }
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
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>6.5</div>
                <div style={{ fontSize: 12, color: '#10b981' }}>Standard Day</div>
              </div>
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
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #ef4444'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Safety Reminder - PPE Required</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>All crew members must wear safety equipment at all times during work hours</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>1 day ago • Important</div>
                  </div>
                  
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #10b981'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>New Training Module Available</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Equipment maintenance training is now available in My Training section</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>3 days ago • Training</div>
                  </div>
                </div>
              </div>
              
              {/* Mail & Messages */}
              <div className="ui-card" style={{ padding: 16 }}>
                <div className="title" style={{ marginBottom: 16, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📬 Mail
                  <span style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    fontSize: 10, 
                    padding: '2px 6px', 
                    borderRadius: 12, 
                    fontWeight: 600 
                  }}>
                    2
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #ef4444'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Manager - Sarah Johnson</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Your performance review is scheduled for Friday at 2 PM</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>4 hours ago • High Priority</div>
                  </div>
                  
                  <div style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Center - Facility Update</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Break room will be closed for maintenance tomorrow 12-2 PM</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>1 day ago • Info</div>
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
                          {[
                            ['Full Name', crewName || 'Not Set'],
                            ['Reports To (Manager ID)', 'Not Set'],
                            ['Crew ID', code || 'Not Set'],
                            ['Role', 'Not Set'],
                            ['Start Date', 'Not Set'],
                            ['Years with Company', 'Not Set'],
                            ['Primary Region', 'Not Set'],
                            ['Email', 'Not Set'],
                            ['Languages', 'Not Set'],
                            ['Phone', 'Not Set'],
                            ['Emergency Contact', 'Not Set'],
                            ['Home Address', 'Not Set'],
                            ['LinkedIn', 'Not Set'],
                            ['Status', 'Active'],
                            ['Availability', 'Not Set'],
                            ['Preferred Areas', 'Not Set'],
                            ['QR Code', 'Not Set']
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
                        ['Pay Rate', 'Not Set'],
                        ['Availability', 'Not Set']
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

              {/* Communication Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #06b6d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>💬 Communication</div>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Messages, announcements, and team communication
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#cffafe', color: '#0891b2', padding: '4px 8px', borderRadius: 4 }}>Messages</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Updates</span>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Downtown Office Complex - Floor Care</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Started: Today 8:00 AM • Progress: 60%</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Medical Center - Deep Clean</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Started: 2:00 PM • Progress: 25%</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>2 Active</span>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Retail Plaza - Window Cleaning</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Tomorrow 9:00 AM • Duration: 4 hours</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Corporate HQ - Carpet Care</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Friday 6:00 AM • Duration: 8 hours</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 4 }}>5 Upcoming</span>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, borderLeft: '3px solid #10b981', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Bank Branch - Sanitization • SRV-001234</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Aug 23, 2025 • Completed • 6 hours</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>✓ Completed Successfully</div>
                  </div>
                  
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, borderLeft: '3px solid #10b981', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Shopping Center - Floor Wax • SRV-001233</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Aug 22, 2025 • Completed • 8 hours</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>✓ Completed Successfully</div>
                  </div>
                  
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, borderLeft: '3px solid #10b981', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Office Building - Deep Clean • SRV-001232</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Aug 21, 2025 • Completed • 10 hours</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>✓ Completed Successfully</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#e5e7eb', color: '#374151', padding: '4px 8px', borderRadius: 4 }}>147 Total</span>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>OSHA Safety Training</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Completed: Aug 15, 2025 • Valid until: Aug 15, 2026</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Floor Care Specialist</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Completed: Jul 28, 2025 • Certificate ID: FC-2025-001</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>12 Modules</span>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Fire Safety Refresher</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Sep 15, 2025 • 2:00 PM • Duration: 2 hours</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Chemical Handling Training</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Sep 22, 2025 • 10:00 AM • Duration: 4 hours</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 4 }}>3 Pending</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Calendar</span>
                </div>
              </div>

              {/* Training Progress Card */}
              <div className="ui-card" style={{ padding: 20, borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>📊 Training Progress</div>
                  <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    85%
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
                      <div style={{ background: '#8b5cf6', borderRadius: 4, height: 8, width: '75%' }}></div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>24 of 32 hours completed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Certification Renewal</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>2 certifications expire within 90 days</div>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Level 3 Certified Cleaner</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Issued: Jan 2025 • Valid until: Jan 2027</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Equipment Operator Certified</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Issued: Mar 2025 • Valid until: Mar 2026</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 4 }}>5 Active</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Renew</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUPPLIES/EQUIPMENT SECTION */}
        {activeSection === 'supplies' && (
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Floor Buffer - Model FB200</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Assigned: Aug 20, 2025 • Condition: Good</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Status: In Use</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Cleaning Cart - Standard Kit</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Assigned: Aug 1, 2025 • Condition: Fair</div>
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Status: Needs Maintenance</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>8 Items</span>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Vacuum Cleaner Replacement</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Requested: Aug 24, 2025 • Status: Approved</div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Floor Cleaner Refill</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Requested: Aug 23, 2025 • Status: Processing</div>
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
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, borderLeft: '3px solid #6b7280' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Carpet Cleaner - Model CC150</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Used: Jun 15 - Aug 10, 2025 • Condition: Returned Good</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Status: Archived</div>
                  </div>
                  
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, borderLeft: '3px solid #ef4444' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Window Squeegee Set</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Used: May 20 - Jul 30, 2025 • Condition: Damaged</div>
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Status: Replaced</div>
                  </div>
                  
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, borderLeft: '3px solid #6b7280' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Safety Gear Set - PPE Kit</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Used: Apr 1 - Jun 30, 2025 • Condition: Worn Out</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Status: Archived</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ background: '#e5e7eb', color: '#374151', padding: '4px 8px', borderRadius: 4 }}>89 Records</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Export</span>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 4 }}>Filter</span>
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
