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
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  const taskStats = getTaskStats();

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Overview
      </h2>

      {/* Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            3
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Services</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
            {taskStats.total}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>My Tasks</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            6.5
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>My Hours</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>
            2
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Pending Orders</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            Active
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Account Status</div>
        </div>
      </div>

      {/* Quick Time Clock */}
      <div style={{ marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#111827' }}>Quick Time Clock</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ fontSize: 16 }}>⏰</div>
              <div>Clock In</div>
            </button>
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ fontSize: 16 }}>🕐</div>
              <div>Clock Out</div>
            </button>
          </div>
        </div>
      </div>


      {/* Recent Activity */}
      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#10b981' }}>Recent Activity</div>
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No recent activity</div>
          <div style={{ fontSize: 12 }}>Work activities will appear here</div>
        </div>
      </div>

      {/* Communication Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* News & Updates */}
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            📰 News & Updates
          </div>
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Recent News</div>
            <div style={{ fontSize: 12 }}>Company news and updates will appear here</div>
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
            marginTop: 8,
            fontWeight: 500
          }}
          onClick={() => alert('Full News - Coming Soon!')}
          >
            View All News
          </button>
        </div>
        
        {/* Mail & Messages */}
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            📬 Mail
          </div>
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Messages</div>
            <div style={{ fontSize: 12 }}>Internal messages and notifications will appear here</div>
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
            marginTop: 8,
            fontWeight: 500
          }}
          onClick={() => alert('Full Mailbox - Coming Soon!')}
          >
            View Mailbox
          </button>
        </div>
      </div>
    </div>
  );
}