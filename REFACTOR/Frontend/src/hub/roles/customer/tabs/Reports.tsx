/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Reports.tsx
 * 
 * Description: Customer reports and feedback submission system
 * Function: Submit and track reports and provide feedback on services
 * Importance: Critical - Customer communication and quality assurance 
 * Connects to: Customer API reports endpoints, feedback system
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
}

interface Feedback {
  feedback_id: string;
  title: string;
  kind: string;
  created_by_role: string;
  created_by_id: string;
  created_at: string;
  message?: string;
  center_id?: string;
  customer_id?: string;
}

export default function Reports({ userId, config, features, api }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'feedback'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [reportsTotals, setReportsTotals] = useState<Record<string, number>>({});
  const [feedbackTotals, setFeedbackTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Load reports or feedback based on active tab
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'reports') {
          // Mock reports data - customer submitted reports
          const mockReports: Report[] = [
            {
              report_id: 'RPT-001',
              title: 'Cleaning Equipment Issue',
              type: 'equipment',
              severity: 'medium',
              status: 'in_progress',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-09T10:30:00Z',
              description: 'Vacuum cleaner making unusual noise at downtown location'
            },
            {
              report_id: 'RPT-002',
              title: 'Service Schedule Concern',
              type: 'schedule',
              severity: 'low',
              status: 'resolved',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-08T14:15:00Z',
              description: 'Request to adjust cleaning schedule for north campus'
            }
          ];
          
          setReports(mockReports);
          setReportsTotals({
            open: 0,
            in_progress: 1,
            resolved: 1,
            closed: 0
          });
          
        } else {
          // Mock feedback data - customer submitted feedback
          const mockFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-001',
              title: 'Outstanding Cleaning Service',
              kind: 'praise',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-08T16:45:00Z',
              message: 'The cleaning team has been exceptional. Very thorough and professional.',
              center_id: 'CTR-001'
            },
            {
              feedback_id: 'FDB-002',
              title: 'Additional Security Request',
              kind: 'request',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-07T11:20:00Z',
              message: 'Would like to discuss adding evening security coverage.',
              center_id: 'CTR-002'
            }
          ];
          
          setFeedback(mockFeedback);
          setFeedbackTotals({
            praise: 1,
            request: 1,
            issue: 0
          });
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, userId]);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reports & Feedback</h2>
        
        {/* Reports/Feedback Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === 'reports' ? '#eab308' : 'white',
              color: activeTab === 'reports' ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === 'feedback' ? '#eab308' : 'white',
              color: activeTab === 'feedback' ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Feedback
          </button>
        </div>
      </div>

      {activeTab === 'reports' ? (
        <div>
          {/* Reports Status Summary */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'open', label: 'Open', value: reportsTotals.open, color: '#ef4444' },
              { key: 'in_progress', label: 'In Progress', value: reportsTotals.in_progress, color: '#f59e0b' },
              { key: 'resolved', label: 'Resolved', value: reportsTotals.resolved, color: '#10b981' },
              { key: 'closed', label: 'Closed', value: reportsTotals.closed, color: '#6b7280' }
            ].map(({ key, label, value, color }) => (
              <span key={key} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: color
              }}>
                {label}: {value || 0}
              </span>
            ))}
          </div>

          <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading reports...</div>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Reports</div>
                <div style={{ fontSize: 12 }}>Your submitted reports will appear here</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Title</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Type</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Severity</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr key={report.report_id} style={{
                      borderBottom: index < reports.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{report.title}</td>
                      <td style={{ padding: 12, textTransform: 'capitalize' }}>{report.type}</td>
                      <td style={{ padding: 12 }}>
                        {report.severity ? (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: report.severity === 'high' ? '#fef2f2' : 
                                       report.severity === 'medium' ? '#fef3c7' : '#f0fdf4',
                            color: report.severity === 'high' ? '#dc2626' : 
                                   report.severity === 'medium' ? '#d97706' : '#059669'
                          }}>
                            {report.severity}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: 12, textTransform: 'capitalize' }}>{report.status.replace('_', ' ')}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Feedback Summary */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'praise', label: 'Praise', value: feedbackTotals.praise, color: '#10b981' },
              { key: 'request', label: 'Requests', value: feedbackTotals.request, color: '#eab308' },
              { key: 'issue', label: 'Issues', value: feedbackTotals.issue, color: '#ef4444' }
            ].map(({ key, label, value, color }) => (
              <span key={key} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: color
              }}>
                {label}: {value || 0}
              </span>
            ))}
          </div>

          <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading feedback...</div>
              </div>
            ) : feedback.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Feedback</div>
                <div style={{ fontSize: 12 }}>Your submitted feedback will appear here</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Title</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Type</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Center</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((feedbackItem, index) => (
                    <tr key={feedbackItem.feedback_id} style={{
                      borderBottom: index < feedback.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{feedbackItem.title}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          background: feedbackItem.kind === 'praise' ? '#dcfce7' : 
                                     feedbackItem.kind === 'request' ? '#fef3c7' : '#fef2f2',
                          color: feedbackItem.kind === 'praise' ? '#059669' : 
                                 feedbackItem.kind === 'request' ? '#d97706' : '#dc2626'
                        }}>
                          {feedbackItem.kind}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>{feedbackItem.center_id || '—'}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>
                        {new Date(feedbackItem.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="ui-card" style={{ padding: 16, marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Submit New {activeTab === 'reports' ? 'Report' : 'Feedback'}</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={{
            padding: '8px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: '#eab308',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}>
            + New {activeTab === 'reports' ? 'Report' : 'Feedback'}
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Submit {activeTab} about service quality, issues, or general feedback
          </span>
        </div>
      </div>
    </div>
  );
}