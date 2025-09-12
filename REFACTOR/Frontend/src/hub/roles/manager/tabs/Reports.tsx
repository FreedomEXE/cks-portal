/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Reports.tsx
 * 
 * Description: Manager reports and feedback management with view/resolve capabilities only
 * Function: View all reports and feedback from ecosystem, resolve issues
 * Importance: Critical - Enables managers to oversee all ecosystem communications
 * Connects to: Manager API reports endpoints, ecosystem visibility system
 * 
 * Notes: Manager view/resolve only - no create functionality
 *        Includes filtering, status management, and resolution capabilities
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
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Report | Feedback | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Load all reports and feedback
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'reports') {
          // All reports across the ecosystem
          const mockReports: Report[] = [
            {
              report_id: 'RPT-001',
              title: 'Center Performance Issue',
              type: 'performance',
              severity: 'high',
              status: 'open',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-09T10:30:00Z',
              description: 'Center showing performance decline affecting service quality',
              about_type: 'center',
              about_id: 'CTR-001'
            },
            {
              report_id: 'RPT-002',
              title: 'Crew Safety Concern',
              type: 'safety',
              severity: 'high',
              status: 'in_progress',
              created_by_role: 'center',
              created_by_id: 'CTR-001',
              created_at: '2025-01-08T14:20:00Z',
              description: 'Safety protocols not being followed by crew member',
              about_type: 'crew',
              about_id: 'CRW-003'
            },
            {
              report_id: 'RPT-003',
              title: 'Order Processing Delay',
              type: 'operational',
              severity: 'medium',
              status: 'resolved',
              created_by_role: 'contractor',
              created_by_id: 'CON-002',
              created_at: '2025-01-07T09:15:00Z',
              description: 'Significant delays in order processing affecting customer satisfaction',
              about_type: 'order',
              about_id: 'ORD-12345',
              resolved_by: 'MGR-001',
              resolution_notes: 'Identified bottleneck and implemented new workflow'
            }
          ];
          setReports(mockReports);
        } else {
          // All feedback across the ecosystem
          const mockFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-001',
              title: 'Great Service Experience',
              kind: 'compliment',
              created_by_role: 'customer',
              created_by_id: 'CUS-002',
              created_at: '2025-01-09T16:45:00Z',
              message: 'Excellent service quality and response time from the center team',
              about_type: 'center',
              about_id: 'CTR-002'
            },
            {
              feedback_id: 'FDB-002',
              title: 'Suggestion for Improvement',
              kind: 'suggestion',
              created_by_role: 'contractor',
              created_by_id: 'CON-003',
              created_at: '2025-01-08T11:30:00Z',
              message: 'Could implement better communication protocol for order updates',
              about_type: 'service',
              about_id: 'SVC-789'
            },
            {
              feedback_id: 'FDB-003',
              title: 'Process Enhancement',
              kind: 'suggestion',
              created_by_role: 'center',
              created_by_id: 'CTR-001',
              created_at: '2025-01-07T13:20:00Z',
              message: 'Crew training program showing positive results',
              about_type: 'crew',
              about_id: 'CRW-001',
              status: 'acknowledged',
              resolved_by: 'MGR-001',
              resolution_notes: 'Great feedback - implementing across all centers'
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
  }, [activeTab]);

  // Filter data based on selected filters
  const getFilteredData = () => {
    const data = activeTab === 'reports' ? reports : feedback;
    
    return data.filter(item => {
      if (statusFilter !== 'all') {
        const status = 'status' in item ? item.status : (item as Feedback).status || 'open';
        if (status !== statusFilter) return false;
      }
      
      if (activeTab === 'reports' && severityFilter !== 'all') {
        if ((item as Report).severity !== severityFilter) return false;
      }
      
      if (roleFilter !== 'all' && item.created_by_role !== roleFilter) return false;
      
      return true;
    });
  };

  const handleResolve = async (item: Report | Feedback) => {
    try {
      const isReport = 'severity' in item;
      const newStatus = isReport ? 'resolved' : 'acknowledged';
      
      if (isReport) {
        setReports(prev => prev.map(r => 
          r.report_id === item.report_id 
            ? { ...r, status: newStatus, resolved_by: userId, resolution_notes: resolutionNotes }
            : r
        ));
      } else {
        setFeedback(prev => prev.map(f => 
          f.feedback_id === (item as Feedback).feedback_id 
            ? { ...f, status: newStatus, resolved_by: userId, resolution_notes: resolutionNotes }
            : f
        ));
      }
      
      setSelectedItem(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error resolving item:', error);
    }
  };

  const filteredData = getFilteredData();

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Reports & Feedback Management</h2>
      
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
          All Reports ({reports.length})
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
          All Feedback ({feedback.length})
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
        
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Severity:</label>
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4 }}
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>From:</label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4 }}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="contractor">Contractors</option>
            <option value="center">Centers</option>
            <option value="crew">Crew</option>
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
                ? 'All system reports will appear here when submitted.'
                : 'All ecosystem feedback will be displayed here when submitted.'
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
                        About: <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{item.about_type || 'General'}</span> • 
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
                    
                    {status !== 'resolved' && status !== 'acknowledged' && (
                      <button
                        onClick={() => setSelectedItem(item)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#3b7af7',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          marginLeft: 12
                        }}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            width: '90%',
            maxWidth: 500,
            maxHeight: '80%',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Resolve {('severity' in selectedItem) ? 'Report' : 'Feedback'}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <strong>{selectedItem.title}</strong>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 8px 0' }}>
                {('severity' in selectedItem) ? selectedItem.description : (selectedItem as Feedback).message}
              </p>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Resolution Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about how this was resolved..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 12,
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(selectedItem)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Mark as {('severity' in selectedItem) ? 'Resolved' : 'Acknowledged'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

