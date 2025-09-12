/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Reports.tsx
 * 
 * Description: Center reporting and feedback system with ecosystem hierarchy
 * Function: Submit reports about crew, customers, contractors and view ecosystem communications
 * Importance: Critical - Center reports visible to crew, customers, contractors & managers
 * Connects to: Reporting API, feedback system, ecosystem visibility system
 */

import React, { useState, useEffect } from 'react';

interface CenterReportsProps {
  userId: string;
  config: any;
  features: any;
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
}

export default function CenterReports({ userId, config, features, api }: CenterReportsProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'my-items' | 'view-all'>('create');
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'feedback'>('report');
  const [reports, setReports] = useState<Report[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [reportsTotals, setReportsTotals] = useState<Record<string, number>>({});
  const [feedbackTotals, setFeedbackTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [reportForm, setReportForm] = useState({
    title: '',
    about_type: '', // 'crew', 'customer', 'contractor', 'order', 'service'
    about_id: '',
    type: '',
    severity: '',
    description: ''
  });
  
  const [feedbackForm, setFeedbackForm] = useState({
    title: '',
    about_type: '', // 'crew', 'customer', 'contractor', 'order', 'service'
    about_id: '',
    kind: '',
    message: ''
  });

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'my-items' && activeSubTab === 'report') {
          // Center submitted reports
          const mockReports: Report[] = [
            {
              report_id: 'RPT-101',
              title: 'Crew Performance Issue',
              type: 'performance',
              severity: 'medium',
              status: 'open',
              created_by_role: 'center',
              created_by_id: userId,
              created_at: '2025-01-10T09:15:00Z',
              description: 'Crew member consistently arriving late for shift assignments',
              about_type: 'crew',
              about_id: 'CRW-003'
            },
            {
              report_id: 'RPT-102',
              title: 'Customer Equipment Misuse',
              type: 'equipment',
              severity: 'low',
              status: 'resolved',
              created_by_role: 'center',
              created_by_id: userId,
              created_at: '2025-01-09T14:30:00Z',
              description: 'Customer improperly using cleaning equipment, need training session',
              about_type: 'customer',
              about_id: 'CUS-002'
            }
          ];
          setReports(mockReports);
          
        } else if (activeTab === 'my-items' && activeSubTab === 'feedback') {
          // Center submitted feedback
          const mockFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-101',
              title: 'Excellent Crew Work Today',
              kind: 'compliment',
              created_by_role: 'center',
              created_by_id: userId,
              created_at: '2025-01-09T17:00:00Z',
              message: 'The crew did an outstanding job with the deep cleaning project today. Very thorough and professional.',
              about_type: 'crew',
              about_id: 'CRW-001'
            },
            {
              feedback_id: 'FDB-102',
              title: 'Schedule Coordination',
              kind: 'suggestion',
              created_by_role: 'center',
              created_by_id: userId,
              created_at: '2025-01-08T10:45:00Z',
              message: 'Would like to discuss adjusting contractor visit schedule for better coordination.',
              about_type: 'contractor',
              about_id: 'CON-001'
            }
          ];
          setFeedback(mockFeedback);
          
        } else if (activeTab === 'view-all' && activeSubTab === 'report') {
          // Reports from others involving this center
          const mockAllReports: Report[] = [
            {
              report_id: 'RPT-201',
              title: 'Center Service Quality',
              type: 'service',
              severity: 'medium',
              status: 'in_progress',
              created_by_role: 'customer',
              created_by_id: 'CUS-004',
              created_at: '2025-01-09T11:20:00Z',
              description: 'Center response times could be improved during peak hours',
              about_type: 'center',
              about_id: userId
            },
            {
              report_id: 'RPT-202',
              title: 'Resource Allocation Issue',
              type: 'operational',
              severity: 'high',
              status: 'open',
              created_by_role: 'contractor',
              created_by_id: 'CON-002',
              created_at: '2025-01-08T14:15:00Z',
              description: 'Center needs better resource planning for large projects',
              about_type: 'center',
              about_id: userId
            }
          ];
          setAllReports(mockAllReports);
          
        } else if (activeTab === 'view-all' && activeSubTab === 'feedback') {
          // Feedback from others involving this center
          const mockAllFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-201',
              title: 'Great Center Management',
              kind: 'compliment',
              created_by_role: 'crew',
              created_by_id: 'CRW-002',
              created_at: '2025-01-09T16:30:00Z',
              message: 'Center provides excellent support and coordination for all activities',
              about_type: 'center',
              about_id: userId
            },
            {
              feedback_id: 'FDB-202',
              title: 'Communication Enhancement',
              kind: 'suggestion',
              created_by_role: 'customer',
              created_by_id: 'CUS-003',
              created_at: '2025-01-07T13:45:00Z',
              message: 'Center could improve update frequency for project status',
              about_type: 'center',
              about_id: userId
            }
          ];
          setAllFeedback(mockAllFeedback);
        }
        
        setReportsTotals({
          open: 1,
          in_progress: 1,
          resolved: 1,
          closed: 0
        });
        setFeedbackTotals({
          compliment: 1,
          suggestion: 1,
          issue: 0
        });
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, activeSubTab, userId]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting report:', reportForm);
      // Here would be API call to submit report
      alert('Report submitted successfully! Visible to crew, customers, contractors, and managers.');
      setReportForm({
        title: '',
        about_type: '',
        about_id: '',
        type: '',
        severity: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting feedback:', feedbackForm);
      // Here would be API call to submit feedback
      alert('Feedback submitted successfully! Visible to relevant team members.');
      setFeedbackForm({
        title: '',
        about_type: '',
        about_id: '',
        kind: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Reports & Feedback</h2>
      
      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('create')} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: activeTab === 'create' ? '#eab308' : 'white', 
            color: activeTab === 'create' ? 'white' : '#111827', 
            fontSize: 13, 
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Create
        </button>
        <button 
          onClick={() => setActiveTab('my-items')} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: activeTab === 'my-items' ? '#eab308' : 'white', 
            color: activeTab === 'my-items' ? 'white' : '#111827', 
            fontSize: 13, 
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          My Items
        </button>
        <button 
          onClick={() => setActiveTab('view-all')} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: activeTab === 'view-all' ? '#eab308' : 'white', 
            color: activeTab === 'view-all' ? 'white' : '#111827', 
            fontSize: 13, 
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          View All
        </button>
      </div>

      {/* Sub-navigation for Create and My Items */}
      {(activeTab === 'create' || activeTab === 'my-items' || activeTab === 'view-all') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, paddingLeft: 8 }}>
          <button 
            onClick={() => setActiveSubTab('report')} 
            style={{ 
              padding: '6px 12px', 
              borderRadius: 6, 
              border: '1px solid #e5e7eb', 
              background: activeSubTab === 'report' ? '#dc2626' : 'white', 
              color: activeSubTab === 'report' ? 'white' : '#111827', 
              fontSize: 12, 
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reports
          </button>
          <button 
            onClick={() => setActiveSubTab('feedback')} 
            style={{ 
              padding: '6px 12px', 
              borderRadius: 6, 
              border: '1px solid #e5e7eb', 
              background: activeSubTab === 'feedback' ? '#16a34a' : 'white', 
              color: activeSubTab === 'feedback' ? 'white' : '#111827', 
              fontSize: 12, 
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Feedback
          </button>
        </div>
      )}


      {/* Content based on active tab */}
      <div className="ui-card" style={{ padding: activeTab === 'create' ? 20 : 0 }}>
        {/* CREATE TAB */}
        {activeTab === 'create' && activeSubTab === 'report' && (
          <form onSubmit={handleReportSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#dc2626' }}>Create Report</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Title:</label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>About:</label>
                <select
                  value={reportForm.about_type}
                  onChange={(e) => setReportForm({...reportForm, about_type: e.target.value, about_id: ''})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="crew">Crew</option>
                  <option value="customer">Customer</option>
                  <option value="contractor">Contractor</option>
                  <option value="order">Order</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              {reportForm.about_type && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ID:</label>
                  <input
                    type="text"
                    value={reportForm.about_id}
                    onChange={(e) => setReportForm({...reportForm, about_id: e.target.value})}
                    placeholder={`${reportForm.about_type.toUpperCase()}-001`}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                    required
                  />
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Type:</label>
                <select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="performance">Performance</option>
                  <option value="safety">Safety</option>
                  <option value="equipment">Equipment</option>
                  <option value="service">Service</option>
                  <option value="operational">Operational</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Severity:</label>
                <select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({...reportForm, severity: e.target.value})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                >
                  <option value="">Select severity...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description:</label>
              <textarea
                value={reportForm.description}
                onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                rows={4}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, resize: 'vertical' }}
                required
              />
            </div>
            
            <button 
              type="submit" 
              style={{ 
                background: '#dc2626', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: 6, 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              Submit Report
            </button>
          </form>
        )}
        
        {activeTab === 'create' && activeSubTab === 'feedback' && (
          <form onSubmit={handleFeedbackSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#16a34a' }}>Create Feedback</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Title:</label>
                <input
                  type="text"
                  value={feedbackForm.title}
                  onChange={(e) => setFeedbackForm({...feedbackForm, title: e.target.value})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>About:</label>
                <select
                  value={feedbackForm.about_type}
                  onChange={(e) => setFeedbackForm({...feedbackForm, about_type: e.target.value, about_id: ''})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="crew">Crew</option>
                  <option value="customer">Customer</option>
                  <option value="contractor">Contractor</option>
                  <option value="order">Order</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {feedbackForm.about_type && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ID:</label>
                  <input
                    type="text"
                    value={feedbackForm.about_id}
                    onChange={(e) => setFeedbackForm({...feedbackForm, about_id: e.target.value})}
                    placeholder={`${feedbackForm.about_type.toUpperCase()}-001`}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                    required
                  />
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Kind:</label>
                <select
                  value={feedbackForm.kind}
                  onChange={(e) => setFeedbackForm({...feedbackForm, kind: e.target.value})}
                  style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required
                >
                  <option value="">Select kind...</option>
                  <option value="compliment">Compliment</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="concern">Concern</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Message:</label>
              <textarea
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                rows={4}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, resize: 'vertical' }}
                required
              />
            </div>
            
            <button 
              type="submit" 
              style={{ 
                background: '#16a34a', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: 6, 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              Submit Feedback
            </button>
          </form>
        )}
        
        {/* MY ITEMS TAB */}
        {activeTab === 'my-items' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 14 }}>Loading {activeSubTab}...</div>
              </div>
            ) : (
              <div>
                {activeSubTab === 'report' && reports.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No Reports Found</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Reports you create will appear here</div>
                  </div>
                )}
                
                {activeSubTab === 'feedback' && feedback.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No Feedback Found</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Feedback you submit will appear here</div>
                  </div>
                )}
                
                {activeSubTab === 'report' && reports.map((report, index) => (
                  <div key={report.report_id} style={{ 
                    padding: 16, 
                    borderBottom: index < reports.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: '#fef2f2'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{report.report_id}</span>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 600,
                        background: report.severity === 'high' ? '#fecaca' : 
                                  report.severity === 'medium' ? '#fed7aa' : '#fef3c7',
                        color: report.severity === 'high' ? '#991b1b' : 
                              report.severity === 'medium' ? '#9a3412' : '#92400e'
                      }}>
                        {report.severity?.toUpperCase()}
                      </span>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 600,
                        background: report.status === 'resolved' ? '#dcfce7' : 
                                  report.status === 'in_progress' ? '#fef3c7' : '#fee2e2',
                        color: report.status === 'resolved' ? '#166534' : 
                              report.status === 'in_progress' ? '#92400e' : '#991b1b'
                      }}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{report.title}</h4>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      About: {report.about_type} • Created: {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    {report.description && (
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.4, margin: 0 }}>{report.description}</p>
                    )}
                  </div>
                ))}
                
                {activeSubTab === 'feedback' && feedback.map((fb, index) => (
                  <div key={fb.feedback_id} style={{ 
                    padding: 16, 
                    borderBottom: index < feedback.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: '#f0fdf4'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fb.feedback_id}</span>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 600,
                        background: '#dcfce7',
                        color: '#166534'
                      }}>
                        {fb.kind.toUpperCase()}
                      </span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{fb.title}</h4>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      About: {fb.about_type} • Created: {new Date(fb.created_at).toLocaleDateString()}
                    </div>
                    {fb.message && (
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.4, margin: 0 }}>{fb.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* VIEW ALL TAB */}
        {activeTab === 'view-all' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 14 }}>Loading {activeSubTab}...</div>
              </div>
            ) : (
              <div>
                {activeSubTab === 'report' && allReports.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No Reports Found</div>
                  </div>
                )}
                
                {activeSubTab === 'feedback' && allFeedback.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No Feedback Found</div>
                  </div>
                )}
                
                {activeSubTab === 'report' && allReports.map((report, index) => (
                  <div key={report.report_id} style={{ 
                    padding: 12, 
                    borderBottom: index < allReports.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ fontSize: 14 }}>
                      <strong>{report.report_id}</strong> - {report.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      Created by: {report.created_by_role} | Status: {report.status === 'resolved' ? 'Resolved' : 'Open'}
                    </div>
                  </div>
                ))}
                
                {activeSubTab === 'feedback' && allFeedback.map((fb, index) => (
                  <div key={fb.feedback_id} style={{ 
                    padding: 12, 
                    borderBottom: index < allFeedback.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ fontSize: 14 }}>
                      <strong>{fb.feedback_id}</strong> - {fb.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      Created by: {fb.created_by_role} | Status: {fb.status || 'Open'}
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