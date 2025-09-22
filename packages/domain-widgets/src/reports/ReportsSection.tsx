import React, { useState } from 'react';
import { TabSection } from '@cks/ui';
import ReportCard, { type ReportFeedback } from './ReportCard';

interface ReportsSectionProps {
  role: string;
  userId: string;
  primaryColor?: string;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({
  role,
  userId,
  primaryColor = '#3b82f6'
}) => {
  const [activeTab, setActiveTab] = useState('all-reports');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if user can create reports (vs only feedback)
  const canCreateReports = ['contractor', 'customer', 'center'].includes(role);
  const defaultType = canCreateReports ? 'report' : 'feedback';

  const [reportForm, setReportForm] = useState({
    type: defaultType as 'report' | 'feedback',
    category: '',
    title: '',
    description: '',
    tags: '',
    relatedService: '',
    relatedOrder: ''
  });

  // Get category options based on type
  const getCategoryOptions = (type: 'report' | 'feedback') => {
    if (type === 'feedback') {
      return [
        'Service Excellence',
        'Staff Performance',
        'Process Improvement',
        'Product Suggestion',
        'System Enhancement',
        'Recognition',
        'Other'
      ];
    } else {
      return [
        'Service Quality',
        'Product Quality',
        'Crew Performance',
        'Delivery Issues',
        'System Bug',
        'Safety Concern',
        'Other'
      ];
    }
  };

  // Mock data - replace with actual API data
  const mockReports: ReportFeedback[] = [
    {
      id: 'RPT-001',
      type: 'report',
      category: 'Service Quality',
      title: 'Cleaning service incomplete',
      description: 'The crew left without finishing the bathroom cleaning. Several areas were missed including mirrors and floor mopping.',
      submittedBy: 'CUS-001',
      submittedDate: '2025-09-18',
      status: 'open',
      relatedService: 'CTR001-SRV001',
      acknowledgments: [
        { userId: 'CTR-001', date: '2025-09-18' },
        { userId: 'MNG-001', date: '2025-09-19' }
      ],
      tags: ['incomplete', 'bathroom']
    },
    {
      id: 'FBK-001',
      type: 'feedback',
      category: 'Staff Performance',
      title: 'Excellent service from crew team',
      description: 'The cleaning crew was professional, thorough, and completed the job ahead of schedule. Very impressed with their attention to detail.',
      submittedBy: 'CUS-002',
      submittedDate: '2025-09-17',
      status: 'open',
      relatedService: 'CTR002-SRV002',
      acknowledgments: [
        { userId: 'CRW-001', date: '2025-09-17' },
        { userId: 'MNG-001', date: '2025-09-18' }
      ],
      tags: ['professional', 'punctual']
    },
    {
      id: 'RPT-002',
      type: 'report',
      category: 'Product Quality',
      title: 'Defective cleaning supplies received',
      description: 'Received a batch of floor cleaner that appears diluted and ineffective. Multiple bottles from the same shipment have the same issue.',
      submittedBy: 'CRW-002',
      submittedDate: '2025-09-16',
      status: 'closed',
      relatedOrder: 'CRW002-ORD-PRD001',
      acknowledgments: [
        { userId: 'WHS-001', date: '2025-09-16' }
      ],
      resolution: {
        resolvedBy: 'WHS-001',
        resolvedDate: '2025-09-17',
        actionTaken: 'Replaced entire batch with new stock',
        notes: 'Contacted supplier about quality control issue. Implemented additional testing procedures for incoming products.'
      },
      tags: ['defective', 'batch-issue']
    },
    {
      id: 'FBK-002',
      type: 'feedback',
      category: 'Process Improvement',
      title: 'Suggestion for inventory tracking',
      description: 'It would be helpful to have real-time inventory levels visible in the ordering system to avoid requesting out-of-stock items.',
      submittedBy: 'MNG-001',
      submittedDate: '2025-09-15',
      status: 'open',
      acknowledgments: [
        { userId: 'WHS-001', date: '2025-09-15' }
      ],
      tags: ['inventory', 'efficiency']
    }
  ];

  // Filter reports based on tab and user
  const getFilteredReports = () => {
    let filtered = mockReports;

    switch (activeTab) {
      case 'my-reports':
        filtered = mockReports.filter(report => report.submittedBy === userId);
        break;
      case 'all-reports':
        // In real implementation, this would filter based on user tree/ecosystem
        filtered = mockReports.filter(report => report.status === 'open');
        break;
      case 'archive':
        filtered = mockReports.filter(report => report.status === 'closed');
        break;
      default:
        filtered = [];
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.category.toLowerCase().includes(query) ||
        report.submittedBy.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredReports = getFilteredReports();

  const handleSubmitReport = () => {
    if (!reportForm.type || !reportForm.category || !reportForm.title || !reportForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Submitting report:', reportForm);

    // Reset form
    setReportForm({
      type: 'report',
      category: '',
      title: '',
      description: '',
      tags: '',
      relatedService: '',
      relatedOrder: ''
    });

    alert('Report submitted successfully!');
  };

  const handleAcknowledge = (reportId: string) => {
    console.log('Acknowledging report:', reportId);
    // In real implementation, this would call an API
  };

  const handleResolve = (reportId: string, actionTaken: string, notes: string) => {
    console.log('Resolving report:', reportId, actionTaken, notes);
    // In real implementation, this would call an API
  };

  const renderSubmitForm = () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '20px'
      }}>
        Submit New {reportForm.type === 'report' ? 'Report' : 'Feedback'}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Type Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Type *
            </label>
            {canCreateReports ? (
              <select
                value={reportForm.type}
                onChange={(e) => setReportForm({...reportForm, type: e.target.value as 'report' | 'feedback', category: ''})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="report">Report (Issue/Problem)</option>
                <option value="feedback">Feedback (Suggestion/Compliment)</option>
              </select>
            ) : (
              <div style={{
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}>
                Feedback (Suggestion/Compliment)
              </div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Category *
            </label>
            <select
              value={reportForm.category}
              onChange={(e) => setReportForm({...reportForm, category: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Select category</option>
              {getCategoryOptions(reportForm.type).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>


        {/* Title */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Title *
            </label>
            <input
              type="text"
              value={reportForm.title}
              onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
              placeholder="Brief summary of the issue or feedback"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div></div>
        </div>

        {/* Description */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Description * ({reportForm.description.length}/500)
            </label>
            <textarea
              value={reportForm.description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setReportForm({...reportForm, description: e.target.value});
                }
              }}
              placeholder="Detailed description of the issue or feedback (max 500 characters)"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div></div>
        </div>

        {/* Optional Fields Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Tags (optional)
            </label>
            <input
              type="text"
              value={reportForm.tags}
              onChange={(e) => setReportForm({...reportForm, tags: e.target.value})}
              placeholder="Comma-separated tags"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Related Service (optional)
            </label>
            <input
              type="text"
              value={reportForm.relatedService}
              onChange={(e) => setReportForm({...reportForm, relatedService: e.target.value})}
              placeholder="CTR001-SRV001"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Related Order (optional)
            </label>
            <input
              type="text"
              value={reportForm.relatedOrder}
              onChange={(e) => setReportForm({...reportForm, relatedOrder: e.target.value})}
              placeholder="ORD-PRD-001"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div></div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={handleSubmitReport}
            disabled={!reportForm.type || !reportForm.category || !reportForm.title || !reportForm.description}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: reportForm.type && reportForm.category && reportForm.title && reportForm.description ? primaryColor : '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: reportForm.type && reportForm.category && reportForm.title && reportForm.description ? 'pointer' : 'not-allowed'
            }}
          >
            Submit {reportForm.type === 'report' ? 'Report' : 'Feedback'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderReportsList = () => (
    <div style={{ padding: '24px' }}>
      {filteredReports.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            margin: '0 0 8px 0'
          }}>
            No {activeTab === 'archive' ? 'archived' : activeTab === 'my-reports' ? 'submitted' : ''} reports found
          </p>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            {searchQuery ? `No results found for "${searchQuery}"` : 'Reports and feedback will appear here when available.'}
          </p>
        </div>
      ) : (
        <div>
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              currentUser={userId}
              userRole={role}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <TabSection
      tabs={[
        { id: 'all-reports', label: 'All Reports', count: mockReports.filter(r => r.status === 'open').length },
        { id: 'my-reports', label: 'My Reports', count: mockReports.filter(r => r.submittedBy === userId).length },
        { id: 'create', label: 'Create' },
        { id: 'archive', label: 'Archive', count: mockReports.filter(r => r.status === 'closed').length }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      description={
        activeTab === 'create' ? 'Submit new reports or feedback to your ecosystem' :
        activeTab === 'my-reports' ? 'Reports and feedback you have submitted' :
        activeTab === 'all-reports' ? 'All open reports and feedback in your ecosystem' :
        'Resolved and closed reports archive'
      }
      searchPlaceholder={
        activeTab !== 'create' ? 'Search reports and feedback...' : undefined
      }
      onSearch={activeTab !== 'create' ? setSearchQuery : undefined}
      primaryColor={primaryColor}
      contentPadding="flush"
    >
      {activeTab === 'create' && renderSubmitForm()}
      {activeTab !== 'create' && renderReportsList()}
    </TabSection>
  );
};

export default ReportsSection;
