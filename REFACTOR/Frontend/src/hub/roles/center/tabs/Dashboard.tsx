/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Dashboard.tsx
 * 
 * Description: Center dashboard with facility overview and operations status
 * Function: Main landing page for center users showing facility operations and crew status
 * Importance: Critical - Primary interface for center managers
 * Connects to: Center API, crew management, service tracking
 * 
 * Notes: Center-focused dashboard emphasizing facility operations and crew management.
 *        Shows operational status, crew counts, and service schedules.
 *        Provides quick access to operational tools and reporting.
 */

import React, { useState, useEffect } from 'react';

interface CenterSummary {
  id: string;
  name: string;
  location: string;
  status: 'Operational' | 'Maintenance' | 'Closed';
  crew_count: number;
  last_service: string;
}

interface ServiceSchedule {
  id: string;
  service_type: string;
  contractor: string;
  scheduled_time: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

interface CenterDashboardProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

export default function CenterDashboard({ userId, config, features, api }: CenterDashboardProps) {
  const [centerInfo, setCenterInfo] = useState<CenterSummary | null>(null);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data for center info
      setCenterInfo({
        id: 'CTR-001',
        name: 'Downtown Service Center',
        location: '123 Main Street, Business District',
        status: 'Operational',
        crew_count: 8,
        last_service: '2025-09-09'
      });

      // Mock data for service schedules
      setSchedules([
        {
          id: 'SCH-001',
          service_type: 'Daily Cleaning',
          contractor: 'Premium Cleaning Solutions',
          scheduled_time: '2025-09-11 08:00',
          status: 'Scheduled'
        },
        {
          id: 'SCH-002',
          service_type: 'HVAC Maintenance',
          contractor: 'TechCorp Services', 
          scheduled_time: '2025-09-11 14:00',
          status: 'In Progress'
        },
        {
          id: 'SCH-003',
          service_type: 'Security Check',
          contractor: 'SecureWatch LLC',
          scheduled_time: '2025-09-10 18:00',
          status: 'Completed'
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
      case 'Operational': return '#10b981';
      case 'Maintenance': return '#f59e0b';
      case 'Closed': return '#ef4444';
      case 'Scheduled': return '#3b82f6';
      case 'In Progress': return '#f59e0b';
      case 'Completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Overview
      </h2>

      {/* Center Status Cards - Active Services, Active Crew, Pending Orders, Account Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            8
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Services</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            {centerInfo?.crew_count || 0}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Crew</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            {schedules.filter(s => s.status === 'Scheduled').length}
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

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <button style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 24 }}>🔧</div>
          <div>REQUEST SERVICE</div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9 }}>
            Explore new services • Request new services
          </div>
        </button>

        <button style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 24 }}>📦</div>
          <div>REQUEST PRODUCTS</div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9 }}>
            Supplies • Equipment • Materials • More
          </div>
        </button>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
          Recent Activity
        </h3>
        <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
          {schedules.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <div style={{ marginBottom: 8 }}>No services scheduled</div>
              <div style={{ fontSize: 14, color: '#9ca3af' }}>Today's schedule is clear</div>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {schedules.map(schedule => (
                  <div key={schedule.id} style={{
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                          {schedule.service_type}
                        </h4>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {schedule.contractor}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: getStatusColor(schedule.status),
                        color: 'white'
                      }}>
                        {schedule.status}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Scheduled: {schedule.scheduled_time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* News & Updates and Mail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            📰 News & Updates
          </h4>
          <div className="ui-card" style={{ padding: 16, minHeight: 200 }}>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              No new updates available
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✉️ Mail
          </h4>
          <div className="ui-card" style={{ padding: 16, minHeight: 200 }}>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              No new messages
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}