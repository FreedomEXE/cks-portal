/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Reports.tsx
 * 
 * Description: Customer reports and feedback submission system with ecosystem hierarchy
 * Function: Submit and track reports, view reports from others involving customer
 * Importance: Critical - Customer communication following ecosystem structure
 * Connects to: Customer API reports endpoints, ecosystem visibility system
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

export default function Reports({ userId, config, features, api }: ReportsProps) {
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
    about_type: '', // 'center', 'crew', 'order', 'service'
    about_id: '',
    type: '',
    severity: '',
    description: ''
  });
  
  const [feedbackForm, setFeedbackForm] = useState({
    title: '',
    about_type: '', // 'center', 'crew', 'order', 'service'
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
          // Customer submitted reports
          const mockReports: Report[] = [
            {
              report_id: 'RPT-001',
              title: 'Center Performance Issue',
              type: 'performance',
              severity: 'medium',
              status: 'in_progress',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-09T10:30:00Z',
              description: 'Center showing performance decline',
              about_type: 'center',
              about_id: 'CTR-001'
            }
          ];
          
          setReports(mockReports);
          setReportsTotals({ open: 0, in_progress: 1, resolved: 0, closed: 0 });
          
        } else if (activeTab === 'my-items' && activeSubTab === 'feedback') {
          // Customer submitted feedback
          const mockFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-001',
              title: 'Excellent Service Quality',
              kind: 'praise',
              created_by_role: 'customer',
              created_by_id: 'CUS-001',
              created_at: '2025-01-08T16:45:00Z',
              message: 'Outstanding cleaning service. Very professional team.',
              about_type: 'center',
              about_id: 'CTR-001'
            }
          ];
          
          setFeedback(mockFeedback);
          setFeedbackTotals({ praise: 1, request: 0, issue: 0 });
          
        } else if (activeTab === 'view-all') {
          // Reports from others involving this customer
          const mockAllReports: Report[] = [
            {
              report_id: 'RPT-301',
              title: 'Customer Equipment Request',
              type: 'equipment',
              severity: 'medium',
              status: 'open',
              created_by_role: 'contractor',
              created_by_id: 'CONT-001',
              created_at: '2025-01-10T08:30:00Z',
              description: 'Customer CTR-001 requires equipment upgrade',
              about_type: 'center',
              about_id: 'CTR-001'
            },
            {
              report_id: 'RPT-302',
              title: 'Service Completion Delay',
              type: 'schedule',
              severity: 'low',
              status: 'resolved',
              created_by_role: 'center',
              created_by_id: 'CEN-001',
              created_at: '2025-01-09T15:20:00Z',
              description: 'Delay in scheduled cleaning service',
              about_type: 'service',
              about_id: 'SRV-001'
            }
          ];

          const mockAllFeedback: Feedback[] = [
            {
              feedback_id: 'FDB-301',
              title: 'Process Improvement Suggestion',
              kind: 'request',
              created_by_role: 'center',
              created_by_id: 'CEN-001',
              created_at: '2025-01-09T12:00:00Z',
              message: 'Suggest implementing new check-in procedure',
              about_type: 'service',
              about_id: 'SRV-001'
            }
          ];

          setAllReports(mockAllReports);
          setAllFeedback(mockAllFeedback);
        }
        
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
      alert('Report submitted! Visible to contractors, managers, and all ecosystem members involved.');
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
      alert('Feedback submitted! Visible to relevant team members.');
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reports & Feedback</h2>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'create', label: 'Create', desc: 'Submit new reports & feedback' },
          { key: 'my-items', label: 'My Items', desc: 'View your submitted items' },
          { key: 'view-all', label: 'View All', desc: 'View reports from others involving you' }
        ].map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === key ? '#eab308' : 'white',
              color: activeTab === key ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={desc}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub Navigation for Create and My Items */}
      {(activeTab === 'create' || activeTab === 'my-items') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'report', label: 'Reports', desc: 'Serious issues requiring action' },
            { key: 'feedback', label: 'Feedback', desc: 'General communication & suggestions' }
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setActiveSubTab(key as any)}
              style={{
                padding: '6px 16px',
                borderRadius: 4,
                border: '1px solid #e5e7eb',
                background: activeSubTab === key ? '#f59e0b' : '#f9fafb',
                color: activeSubTab === key ? 'white' : '#6b7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
              title={desc}
            >
              {label}
            </button>
          ))}
        </div>
      )}


      {/* Create Report Form */}
      {activeTab === 'create' && activeSubTab === 'report' && (
        <div className="ui-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Submit New Report</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Reports are for serious issues requiring action. Create reports only about centers & crew under you.
          </p>
          <form onSubmit={handleReportSubmit}>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Report Title *
                </label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  About (Type) *
                </label>
                <select
                  value={reportForm.about_type}
                  onChange={(e) => setReportForm({...reportForm, about_type: e.target.value, about_id: ''})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="center">Center (under you)</option>
                  <option value="crew">Crew Member (under you)</option>
                  <option value="order">Order</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  About (Specific) *
                </label>
                <select
                  value={reportForm.about_id}
                  onChange={(e) => setReportForm({...reportForm, about_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                  disabled={!reportForm.about_type}
                >
                  <option value="">Select Item</option>
                  {reportForm.about_type === 'center' && (
                    <>
                      <option value="CTR-001">Downtown Office</option>
                      <option value="CTR-002">North Campus</option>
                      <option value="CTR-003">South Branch</option>
                    </>
                  )}
                  {reportForm.about_type === 'crew' && (
                    <>
                      <option value="CRW-001">John Smith (Downtown)</option>
                      <option value="CRW-002">Mary Johnson (North)</option>
                      <option value="CRW-003">David Wilson (South)</option>
                    </>
                  )}
                  {reportForm.about_type === 'order' && (
                    <>
                      <option value="ORD-001">Order #001 - Downtown Cleaning</option>
                      <option value="ORD-002">Order #002 - North Campus Maintenance</option>
                    </>
                  )}
                  {reportForm.about_type === 'service' && (
                    <>
                      <option value="SRV-001">Weekly Cleaning Service</option>
                      <option value="SRV-002">Emergency Maintenance</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Type *
                </label>
                <select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="performance">Performance Issue</option>
                  <option value="equipment">Equipment Issue</option>
                  <option value="service">Service Quality</option>
                  <option value="safety">Safety Concern</option>
                  <option value="schedule">Schedule Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Severity *
                </label>
                <select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({...reportForm, severity: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select Severity</option>
                  <option value="low">Low - Minor issue</option>
                  <option value="medium">Medium - Moderate concern</option>
                  <option value="high">High - Urgent attention needed</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Description *
              </label>
              <textarea
                value={reportForm.description}
                onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 14,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Describe the issue in detail..."
                required
              />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#eab308',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Submit Report
              </button>
              <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                Report will be visible to all ecosystem members involved
              </span>
            </div>
          </form>
        </div>
      )}

      {/* Create Feedback Form */}
      {activeTab === 'create' && activeSubTab === 'feedback' && (
        <div className="ui-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Submit New Feedback</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Feedback is for general communication, suggestions, or positive recognition.
          </p>
          <form onSubmit={handleFeedbackSubmit}>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Feedback Title *
                </label>
                <input
                  type="text"
                  value={feedbackForm.title}
                  onChange={(e) => setFeedbackForm({...feedbackForm, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  About (Type) *
                </label>
                <select
                  value={feedbackForm.about_type}
                  onChange={(e) => setFeedbackForm({...feedbackForm, about_type: e.target.value, about_id: ''})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="center">Center</option>
                  <option value="crew">Crew Member</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  About (Specific) *
                </label>
                <select
                  value={feedbackForm.about_id}
                  onChange={(e) => setFeedbackForm({...feedbackForm, about_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                  disabled={!feedbackForm.about_type}
                >
                  <option value="">Select Item</option>
                  {feedbackForm.about_type === 'center' && (
                    <>
                      <option value="CTR-001">Downtown Office</option>
                      <option value="CTR-002">North Campus</option>
                      <option value="CTR-003">South Branch</option>
                    </>
                  )}
                  {feedbackForm.about_type === 'crew' && (
                    <>
                      <option value="CRW-001">John Smith</option>
                      <option value="CRW-002">Mary Johnson</option>
                      <option value="CRW-003">David Wilson</option>
                    </>
                  )}
                  {feedbackForm.about_type === 'service' && (
                    <>
                      <option value="SRV-001">Weekly Cleaning</option>
                      <option value="SRV-002">Emergency Service</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Type *
                </label>
                <select
                  value={feedbackForm.kind}
                  onChange={(e) => setFeedbackForm({...feedbackForm, kind: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select Feedback Type</option>
                  <option value="praise">Praise - Compliment good work</option>
                  <option value="request">Request - Suggestion or request</option>
                  <option value="issue">Minor Issue - Small concern (non-urgent)</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Message *
              </label>
              <textarea
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 14,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Share your feedback..."
                required
              />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#eab308',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Submit Feedback
              </button>
              <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                Feedback will be visible to relevant team members
              </span>
            </div>
          </form>
        </div>
      )}

      {/* My Items View */}
      {activeTab === 'my-items' && (
        <div>
          {activeSubTab === 'report' ? (
            <div>
              {/* Reports Status Summary */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'open', label: 'Open', value: reportsTotals.open || 0, color: '#ef4444' },
                  { key: 'in_progress', label: 'In Progress', value: reportsTotals.in_progress || 0, color: '#f59e0b' },
                  { key: 'resolved', label: 'Resolved', value: reportsTotals.resolved || 0, color: '#10b981' },
                  { key: 'closed', label: 'Closed', value: reportsTotals.closed || 0, color: '#6b7280' }
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
                    {label}: {value}
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
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>About</th>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Type</th>
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
                          <td style={{ padding: 12, fontSize: 12, color: '#6b7280' }}>
                            {report.about_type}: {report.about_id}
                          </td>
                          <td style={{ padding: 12, textTransform: 'capitalize' }}>{report.type}</td>
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
                  { key: 'praise', label: 'Praise', value: feedbackTotals.praise || 0, color: '#10b981' },
                  { key: 'request', label: 'Requests', value: feedbackTotals.request || 0, color: '#eab308' },
                  { key: 'issue', label: 'Issues', value: feedbackTotals.issue || 0, color: '#ef4444' }
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
                    {label}: {value}
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
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>About</th>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Type</th>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedback.map((feedbackItem, index) => (
                        <tr key={feedbackItem.feedback_id} style={{
                          borderBottom: index < feedback.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}>
                          <td style={{ padding: 12, fontWeight: 600 }}>{feedbackItem.title}</td>
                          <td style={{ padding: 12, fontSize: 12, color: '#6b7280' }}>
                            {feedbackItem.about_type}: {feedbackItem.about_id}
                          </td>
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
  );
}