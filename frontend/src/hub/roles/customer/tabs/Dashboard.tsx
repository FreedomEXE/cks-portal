/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Dashboard.tsx
 * 
 * Description: Customer dashboard with centers overview and quick actions
 * Function: Main landing page for customer users showing center status and service requests
 * Importance: Critical - Primary interface for center managers
 * Connects to: Customer API, center management, service requests
 * 
 * Notes: Customer-focused dashboard emphasizing center operations and management.
 *        Shows center status, crew counts, and service request priorities.
 *        Provides quick access to service ordering and ecosystem view.
 */

import React, { useState, useEffect } from 'react';

interface CenterSummary {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Maintenance' | 'Offline';
  crew_count: number;
  last_service: string;
}

interface ServiceRequest {
  id: string;
  center: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed';
  date: string;
}

interface CustomerDashboardProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

export default function CustomerDashboard({ userId, config, features, api }: CustomerDashboardProps) {
  const [centers, setCenters] = useState<CenterSummary[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data for centers
      setCenters([
        {
          id: 'CTR-001',
          name: 'Downtown Center',
          location: 'Main Street Complex',
          status: 'Active',
          crew_count: 8,
          last_service: '2025-09-09'
        },
        {
          id: 'CTR-002', 
          name: 'North Campus',
          location: 'University District',
          status: 'Active',
          crew_count: 12,
          last_service: '2025-09-08'
        },
        {
          id: 'CTR-003',
          name: 'Industrial Park',
          location: 'Warehouse District', 
          status: 'Maintenance',
          crew_count: 6,
          last_service: '2025-09-07'
        }
      ]);

      // Mock data for service requests
      setServiceRequests([
        {
          id: 'REQ-001',
          center: 'Downtown Center',
          type: 'Deep Cleaning',
          priority: 'High',
          status: 'Open',
          date: '2025-09-10'
        },
        {
          id: 'REQ-002',
          center: 'North Campus',
          type: 'Maintenance',
          priority: 'Medium', 
          status: 'In Progress',
          date: '2025-09-09'
        },
        {
          id: 'REQ-003',
          center: 'Industrial Park',
          type: 'Security Check',
          priority: 'Low',
          status: 'Completed',
          date: '2025-09-08'
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
      case 'Maintenance': return '#f59e0b';
      case 'Offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
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
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Overview
      </h2>

      {/* KPI Cards - Active Services, Active Centers, Active Crew, Pending Requests, Account Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            8
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Services</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#eab308', marginBottom: 4 }}>
            {centers.filter(c => c.status === 'Active').length}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Centers</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            {centers.reduce((sum, c) => sum + c.crew_count, 0)}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Crew</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            {serviceRequests.filter(r => r.status === 'Open').length}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Pending Requests</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            Active
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Account Status</div>
        </div>
      </div>

      {/* Request Services Buttons - Like original */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <button style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #eab308 0%, #fbbf24 100%)',
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
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
          <div>REQUEST SUPPLIES</div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9 }}>
            Supplies • Equipment • Materials • More
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#eab308' }}>Recent Activity</div>
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No recent activity</div>
          <div style={{ fontSize: 12 }}>Activity will appear here as it occurs</div>
        </div>
      </div>

      {/* Communication Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#eab308', display: 'flex', alignItems: 'center', gap: 8 }}>
            📰 News & Updates
          </h4>
          <div className="ui-card" style={{ padding: 16 }}>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Recent News</div>
              <div style={{ fontSize: 12 }}>Company news and updates will appear here</div>
            </div>
            <button style={{
              width: '100%',
              padding: '8px 16px',
              fontSize: 12,
              backgroundColor: '#fef3c7',
              color: '#eab308',
              border: '1px solid #f59e0b',
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
        </div>

        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#eab308', display: 'flex', alignItems: 'center', gap: 8 }}>
            📧 Mail
          </h4>
          <div className="ui-card" style={{ padding: 16 }}>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Messages</div>
              <div style={{ fontSize: 12 }}>Internal messages and notifications will appear here</div>
            </div>
            <button style={{
              width: '100%',
              padding: '8px 16px',
              fontSize: 12,
              backgroundColor: '#fef3c7',
              color: '#eab308',
              border: '1px solid #f59e0b',
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
    </div>
  );
}