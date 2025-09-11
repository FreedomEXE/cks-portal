/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Dashboard.tsx
 * 
 * Description: Crew dashboard with shift overview and task management
 * Function: Main landing page for crew members showing daily tasks and shift status
 * Importance: Critical - Primary interface for crew members
 * Connects to: Crew API, task management, shift tracking
 * 
 * Notes: Crew-focused dashboard emphasizing daily tasks and work progress.
 *        Shows shift status, assigned tasks, and quick actions.
 *        Provides access to time tracking and task completion.
 */

import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  location: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  estimated_time: string;
  assigned_time: string;
}

interface ShiftInfo {
  shift_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'Not Started' | 'Active' | 'Break' | 'Completed';
  center: string;
  supervisor: string;
}

interface CrewDashboardProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

export default function CrewDashboard({ userId, config, features, api }: CrewDashboardProps) {
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock shift info
      setShiftInfo({
        shift_id: 'SH-001',
        date: '2025-09-11',
        start_time: '06:00',
        end_time: '14:00',
        status: 'Active',
        center: 'Downtown Service Center',
        supervisor: 'Alex Johnson'
      });

      // Mock tasks for today
      setTasks([
        {
          id: 'TASK-001',
          title: 'Clean Office Floor 3',
          location: 'Building A - Floor 3',
          priority: 'High',
          status: 'In Progress',
          estimated_time: '45 minutes',
          assigned_time: '08:00'
        },
        {
          id: 'TASK-002',
          title: 'Empty Trash Bins',
          location: 'All Floors',
          priority: 'Medium',
          status: 'Pending',
          estimated_time: '30 minutes',
          assigned_time: '09:00'
        },
        {
          id: 'TASK-003',
          title: 'Sanitize Restrooms',
          location: 'Building A & B',
          priority: 'High',
          status: 'Pending',
          estimated_time: '60 minutes',
          assigned_time: '10:00'
        },
        {
          id: 'TASK-004',
          title: 'Window Cleaning Lobby',
          location: 'Main Lobby',
          priority: 'Low',
          status: 'Completed',
          estimated_time: '20 minutes',
          assigned_time: '07:00'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Break': return '#f59e0b';
      case 'Not Started': return '#6b7280';
      case 'Completed': return '#10b981';
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      case 'In Progress': return '#3b82f6';
      case 'Pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    return { completed, inProgress, pending, total: tasks.length };
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  const taskStats = getTaskStats();

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        My Shift
      </h2>

      {/* Shift Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: getStatusColor(shiftInfo?.status || ''), marginBottom: 4 }}>
            {shiftInfo?.status || 'Loading'}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Shift Status</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            {taskStats.completed}/{taskStats.total}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Tasks Complete</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
            {taskStats.inProgress}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>In Progress</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            {taskStats.pending}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Pending Tasks</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <button style={{
          padding: '24px 16px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 20 }}>⏰</div>
          <div>CLOCK IN/OUT</div>
        </button>

        <button style={{
          padding: '24px 16px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 20 }}>📋</div>
          <div>REPORT ISSUE</div>
        </button>

        <button style={{
          padding: '24px 16px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 20 }}>📦</div>
          <div>REQUEST SUPPLIES</div>
        </button>
      </div>

      {/* Shift Information */}
      {shiftInfo && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
            Today's Shift Information
          </h3>
          <div className="ui-card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div><strong>Date:</strong> {shiftInfo.date}</div>
              <div><strong>Time:</strong> {shiftInfo.start_time} - {shiftInfo.end_time}</div>
              <div><strong>Center:</strong> {shiftInfo.center}</div>
              <div><strong>Supervisor:</strong> {shiftInfo.supervisor}</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
          Today's Tasks
        </h3>
        <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
          {tasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ marginBottom: 8 }}>No tasks assigned</div>
              <div style={{ fontSize: 14, color: '#9ca3af' }}>Tasks will appear here when assigned</div>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: task.status === 'Completed' ? '#f0f9ff' : '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                          {task.title}
                        </h4>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {task.location} • Assigned: {task.assigned_time}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: getStatusColor(task.priority),
                          color: 'white'
                        }}>
                          {task.priority}
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: getStatusColor(task.status),
                          color: 'white'
                        }}>
                          {task.status}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <div style={{ color: '#6b7280' }}>
                        Estimated time: {task.estimated_time}
                      </div>
                      {task.status !== 'Completed' && (
                        <button style={{
                          padding: '6px 12px',
                          background: task.status === 'Pending' ? '#3b82f6' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          {task.status === 'Pending' ? 'Start Task' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
            👥 Team Members
          </h4>
          <div className="ui-card" style={{ padding: 16, minHeight: 120 }}>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              View team members in Ecosystem
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
            📢 Announcements
          </h4>
          <div className="ui-card" style={{ padding: 16, minHeight: 120 }}>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              No new announcements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}