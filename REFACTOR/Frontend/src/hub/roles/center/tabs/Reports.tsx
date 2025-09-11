/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Reports.tsx
 * 
 * Description: Center reporting and feedback system
 * Function: Submit and view reports related to center operations
 * Importance: Critical - Quality control and feedback loop for centers
 * Connects to: Reporting API, feedback system, manager notifications
 */

import React, { useState, useEffect } from 'react';

interface CenterReportsProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

interface Report {
  id: string;
  title: string;
  type: 'incident' | 'maintenance' | 'feedback' | 'quality';
  status: 'submitted' | 'under_review' | 'resolved' | 'closed';
  date_submitted: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CenterReports({ userId, config, features, api }: CenterReportsProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadReports();
    }
  }, [activeTab]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Mock reports data
      const mockReports: Report[] = [
        {
          id: 'RPT-001',
          title: 'HVAC System Issue',
          type: 'maintenance',
          status: 'under_review',
          date_submitted: '2025-09-10',
          description: 'Air conditioning not working properly in Building A',
          priority: 'high'
        },
        {
          id: 'RPT-002',
          title: 'Cleaning Quality Feedback',
          type: 'quality',
          status: 'resolved',
          date_submitted: '2025-09-08',
          description: 'Excellent cleaning service in conference rooms',
          priority: 'low'
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#6b7280';
      case 'under_review': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'incident': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      case 'feedback': return '#10b981';
      case 'quality': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reports</h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['submit', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#059669' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'submit' ? 'Submit Report' : `History (${reports.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ui-card" style={{ padding: 24 }}>
        {activeTab === 'submit' ? (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' }}>
              Submit New Report
            </h3>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
              Report submission form will be implemented here
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' }}>
              Report History
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading reports...</div>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                  No reports submitted
                </div>
                <div style={{ fontSize: 12 }}>
                  Your submitted reports will appear here
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {reports.map(report => (
                  <div key={report.id} style={{
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                          {report.title}
                        </h4>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          Submitted: {report.date_submitted}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: getTypeColor(report.type),
                          color: 'white'
                        }}>
                          {report.type}
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: getStatusColor(report.status),
                          color: 'white'
                        }}>
                          {report.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#374151' }}>
                      {report.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}