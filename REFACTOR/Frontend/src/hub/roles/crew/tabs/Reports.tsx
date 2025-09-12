/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Reports.tsx
 * 
 * Description: Crew reports and feedback view system (view only)
 * Function: View reports and feedback that involve or are created by crew
 * Importance: Critical - Enables crew to stay informed about communications
 * Connects to: Crew API reports endpoints, ecosystem visibility system
 * 
 * Notes: Crew view only - no create or resolve functionality
 *        Shows reports/feedback involving the crew member
 */

import React, { useState, useEffect } from 'react';

interface ReportsProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface Report {
  report_id: string;
  title: string;
  type: string;
  severity?: string;
  status: string;
  created_by_role: string;
  created_by_id: string;
  created_at: string;
  description?: string;
  about_type?: string;
  about_id?: string;
  updated_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

interface Feedback {
  feedback_id: string;
  title: string;
  kind: string;
  created_by_role: string;
  created_by_id: string;
  created_at: string;
  message?: string;
  about_type?: string;
  about_id?: string;
  status?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export default function Reports({ userId, config, features, api }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'feedback'>('reports');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  // Load reports and feedback involving this crew member
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'reports') {
          // Reports involving this crew member
          const mockReports: Report[] = [
            {
              report_id: 'RPT-002',
              title: 'Crew Safety Concern',
              type: 'safety',
              severity: 'high',
              status: 'in_progress',
              created_by_role: 'center',
              created_by_id: 'CTR-001',
              created_at: '2025-01-08T14:20:00Z',
              description: 'Safety protocols not being followed by crew member - need to review training procedures',
              about_type: 'crew',
              about_id: userId // This crew member
            },
            {
              report_id: 'RPT-004',
              title: 'Equipment Usage Issue',
              type: 'operational',
              severity: 'medium',
              status: 'resolved',
              created_by_role: 'manager',
              created_by_id: 'MGR-001',
              created_at: '2025-01-06T11:45:00Z',
              description: 'Equipment handling requires improvement to maintain quality standards',
              about_type: 'crew',
              about_id: userId,
              resolved_by: 'MGR-001',
              resolution_notes: 'Additional training session completed successfully'
            }
          ];
          setReports(mockReports);
        } else {
          // Feedback involving this crew member
          const mockFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-003',
              title: 'Training Program Results',
              kind: 'compliment',
              created_by_role: 'center',
              created_by_id: 'CTR-001',
              created_at: '2025-01-07T13:20:00Z',
              message: 'Crew member showing excellent improvement after training program completion',
              about_type: 'crew',
              about_id: userId
            },
            {
              feedback_id: 'FDB-005',
              title: 'Work Quality Recognition',
              kind: 'compliment',
              created_by_role: 'customer',
              created_by_id: 'CUS-003',
              created_at: '2025-01-05T16:30:00Z',
              message: 'Outstanding service quality and attention to detail from crew member',
              about_type: 'crew',
              about_id: userId,
              status: 'acknowledged',
              resolution_notes: 'Recognition added to personnel file'
            },
            {
              feedback_id: 'FDB-006',
              title: 'Process Improvement Suggestion',
              kind: 'suggestion',
              created_by_role: 'contractor',
              created_by_id: 'CON-001',
              created_at: '2025-01-04T09:15:00Z',
              message: 'Crew could benefit from updated workflow documentation for efficiency',
              about_type: 'crew',
              about_id: userId
            }
          ];
          setFeedback(mockFeedback);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, userId]);

  // Filter data based on selected filters
  const getFilteredData = () => {
    const data = activeTab === 'reports' ? reports : feedback;
    
    return data.filter(item => {
      if (statusFilter !== 'all') {
        const status = 'status' in item ? item.status : (item as Feedback).status || 'open';
        if (status !== statusFilter) return false;
      }
      
      return true;
    });
  };

  const filteredData = getFilteredData();

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Reports & Feedback</h2>
      
      
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('reports')} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: activeTab === 'reports' ? '#dc2626' : 'white', 
            color: activeTab === 'reports' ? 'white' : '#111827', 
            fontSize: 13, 
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Reports ({reports.length})
        </button>
        <button 
          onClick={() => setActiveTab('feedback')} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: activeTab === 'feedback' ? '#16a34a' : 'white', 
            color: activeTab === 'feedback' ? 'white' : '#111827', 
            fontSize: 13, 
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Feedback ({feedback.length})
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4 }}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="ui-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <div style={{ fontSize: 14 }}>Loading {activeTab}...</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {activeTab === 'reports' ? '📊' : '💬'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              No {activeTab === 'reports' ? 'Reports' : 'Feedback'} Found
            </div>
            <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              {activeTab === 'reports' 
                ? 'Reports involving you will appear here when created.'
                : 'Feedback about your work will be displayed here when submitted.'
              }
            </div>
          </div>
        ) : (
          <div>
            {filteredData.map((item, index) => {
              const isReport = 'severity' in item;
              const status = 'status' in item ? item.status : (item as Feedback).status || 'open';
              
              return (
                <div 
                  key={isReport ? item.report_id : (item as Feedback).feedback_id}
                  style={{ 
                    padding: 16, 
                    borderBottom: index < filteredData.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: isReport ? '#fef2f2' : '#f0fdf4'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ 
                          fontSize: 13, 
                          fontWeight: 700, 
                          color: isReport ? '#dc2626' : '#16a34a' 
                        }}>
                          {isReport ? item.report_id : (item as Feedback).feedback_id}
                        </span>
                        {isReport && (
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: 10, 
                            fontWeight: 600,
                            background: (item as Report).severity === 'high' ? '#fecaca' : 
                                      (item as Report).severity === 'medium' ? '#fed7aa' : '#fef3c7',
                            color: (item as Report).severity === 'high' ? '#991b1b' : 
                                  (item as Report).severity === 'medium' ? '#9a3412' : '#92400e'
                          }}>
                            {(item as Report).severity?.toUpperCase()}
                          </span>
                        )}
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: 10, 
                          fontWeight: 600,
                          background: status === 'resolved' || status === 'acknowledged' ? '#dcfce7' : 
                                    status === 'in_progress' ? '#fef3c7' : '#fee2e2',
                          color: status === 'resolved' || status === 'acknowledged' ? '#166534' : 
                                status === 'in_progress' ? '#92400e' : '#991b1b'
                        }}>
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                        {item.title}
                      </h4>
                      
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                        From: <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{item.created_by_role}</span> • 
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                      
                      {(isReport ? item.description : (item as Feedback).message) && (
                        <p style={{ 
                          fontSize: 12, 
                          color: '#374151', 
                          lineHeight: 1.4, 
                          margin: '8px 0',
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #e5e7eb'
                        }}>
                          {isReport ? item.description : (item as Feedback).message}
                        </p>
                      )}
                      
                      {item.resolution_notes && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                          <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 2 }}>
                            Resolution Notes:
                          </div>
                          <div style={{ fontSize: 12, color: '#374151' }}>
                            {item.resolution_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}