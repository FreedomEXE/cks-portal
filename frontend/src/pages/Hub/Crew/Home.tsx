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
  const centerId = state.data?.center_id || 'ctr-001';
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
            setDailyTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
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
            setTrainingModules(Array.isArray(trainingData.modules) ? trainingData.modules : []);
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
          <button
            className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
          >
            Log out
          </button>
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
          <button
            className="ui-button"
            style={{ padding: '10px 16px', fontSize: 14 }}
            onClick={() => navigate('/logout')}
          >
            Log out
          </button>
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
        <button
          className="ui-button"
          style={{ padding: '10px 16px', fontSize: 14 }}
          onClick={() => navigate('/logout')}
        >
          Log out
        </button>
      </div>

      {/* Welcome message for field worker */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        Welcome, {crewName} ({code}) - {state.data?.role || 'Crew Member'} at {centerName}
      </div>

      {/* Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard' as CrewSection, label: 'Work Dashboard' },
          { key: 'profile' as CrewSection, label: 'My Profile' },
          { key: 'schedule' as CrewSection, label: 'My Schedule' },
          { key: 'tasks' as CrewSection, label: 'Daily Tasks' },
          { key: 'timecard' as CrewSection, label: 'Time Card' },
          { key: 'training' as CrewSection, label: 'Training' },
          { key: 'center' as CrewSection, label: 'My Center' },
          { key: 'services' as CrewSection, label: 'My Services' }
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
            <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                            ['Full Name', state.data?.crew_name || crewName],
                            ['Employee ID', state.data?.employee_id || 'EMP-12345'],
                            ['Crew ID', state.data?.crew_id || code],
                            ['Role', state.data?.role || 'Crew Leader'],
                            ['Email', state.data?.email || 'mike.johnson@cks-crew.com'],
                            ['Phone', state.data?.phone || '(555) 234-5678'],
                            ['Hire Date', state.data?.hire_date || '2023-03-15'],
                            ['Supervisor', state.data?.supervisor || 'John Center']
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
                  Crew {['', 'Work Details', 'Certifications', 'Emergency Contact', 'Performance'][profileTab]} data will be populated from Crew API
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCHEDULE SECTION */}
        {activeSection === 'schedule' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Schedule</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Work schedule management will be implemented here.<br/>
                This will show weekly schedules, shift assignments, time-off requests,<br/>
                and schedule changes for this crew member.
              </div>
            </div>
          </div>
        )}

        {/* TASKS SECTION */}
        {activeSection === 'tasks' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Daily Tasks</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Task management system will be implemented here.<br/>
                This will show detailed task assignments, procedures,<br/>
                progress tracking, and task completion workflows.
              </div>
            </div>
          </div>
        )}

        {/* TIME CARD SECTION */}
        {activeSection === 'timecard' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Time Card</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Time tracking system will be implemented here.<br/>
                This will show clock in/out history, weekly hours,<br/>
                overtime tracking, and timesheet management.
              </div>
            </div>
          </div>
        )}

        {/* TRAINING SECTION */}
        {activeSection === 'training' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Training & Procedures</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Training management portal will be implemented here.<br/>
                This will show required training modules, procedure guides,<br/>
                certification tracking, and safety training requirements.
              </div>
            </div>
          </div>
        )}

        {/* CENTER SECTION */}
        {activeSection === 'center' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Center - {centerName}</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Center information portal will be implemented here.<br/>
                This will show center details, facility maps, equipment locations,<br/>
                and center-specific procedures for this work location.
              </div>
            </div>
          </div>
        )}

        {/* SERVICES SECTION */}
        {activeSection === 'services' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Services</h2>
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Service specialization portal will be implemented here.<br/>
                This will show service types this crew member performs,<br/>
                one-time job opportunities, and service-specific training.
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