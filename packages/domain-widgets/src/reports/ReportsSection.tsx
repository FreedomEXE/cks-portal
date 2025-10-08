import React, { useState } from 'react';
import { TabSection } from '@cks/ui';
import ReportCard, { type ReportFeedback } from './ReportCard';

interface ReportsSectionProps {
  role: string;
  userId: string;
  primaryColor?: string;
  reports?: ReportFeedback[];
  feedback?: ReportFeedback[];
  isLoading?: boolean;
  onSubmit?: (payload: { type: 'report' | 'feedback'; category: string; title: string; description: string; tags?: string; relatedService?: string; relatedOrder?: string }) => Promise<void> | void;
  onAcknowledge?: (id: string, type: 'report' | 'feedback') => Promise<void> | void;
  onResolve?: (id: string, details?: { actionTaken?: string; notes?: string }) => Promise<void> | void;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({
  role,
  userId,
  primaryColor = '#3b82f6',
  reports = [],
  feedback = [],
  isLoading = false,
  onSubmit,
  onAcknowledge,
  onResolve,
}) => {
  const [activeTab, setActiveTab] = useState('all-reports');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if user can create reports/feedback at all
  // Only contractor, customer, center, and manager can create
  // Crew and warehouse are read-only
  const canCreate = ['contractor', 'customer', 'center', 'manager'].includes(role.toLowerCase());

  // Determine if user can create reports (vs only feedback)
  const canCreateReports = ['contractor', 'customer', 'center'].includes(role.toLowerCase());
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

  // Combine reports and feedback from props
  const allReports: ReportFeedback[] = [...reports, ...feedback];

  // Filter reports based on tab and user
  const getFilteredReports = () => {
    let filtered = allReports;

    switch (activeTab) {
      case 'reports':
        filtered = reports; // Only show reports (issues/problems)
        break;
      case 'feedback':
        filtered = feedback; // Only show feedback (suggestions/compliments)
        break;
      case 'all-reports':
        filtered = allReports.filter(report => report.status === 'open');
        break;
      case 'archive':
        filtered = allReports.filter(report => report.status === 'closed');
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

  const handleSubmitReport = async () => {
    if (!reportForm.type || !reportForm.category || !reportForm.title || !reportForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (onSubmit) {
        await Promise.resolve(
          onSubmit({
            type: reportForm.type,
            category: reportForm.category,
            title: reportForm.title,
            description: reportForm.description,
            tags: reportForm.tags,
            relatedService: reportForm.relatedService,
            relatedOrder: reportForm.relatedOrder,
          }),
        );
      } else {
        console.log('Submitting report:', reportForm);
      }
    } catch (err) {
      console.error('Failed to submit', err);
      alert('Failed to submit. Please try again.');
      return;
    }

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

    alert('Submitted successfully!');
  };

  const handleAcknowledge = async (reportId: string, type: 'report' | 'feedback') => {
    try {
      if (onAcknowledge) {
        await Promise.resolve(onAcknowledge(reportId, type));
      } else {
        console.log('Acknowledging', type, reportId);
      }
    } catch (err) {
      console.error('Acknowledge failed', err);
      alert('Failed to acknowledge.');
    }
  };

  const handleResolve = async (reportId: string, actionTaken: string, notes: string) => {
    try {
      if (onResolve) {
        await Promise.resolve(onResolve(reportId, { actionTaken, notes }));
      } else {
        console.log('Resolving report:', reportId, actionTaken, notes);
      }
    } catch (err) {
      console.error('Resolve failed', err);
      alert('Failed to resolve.');
    }
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
      {isLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af'
          }}>
            Loading reports...
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            margin: '0 0 8px 0'
          }}>
            No {activeTab === 'archive' ? 'archived' : activeTab === 'reports' ? 'reports' : activeTab === 'feedback' ? 'feedback' : ''} found
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
              onAcknowledge={(id) => handleAcknowledge(id, report.type)}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Build tabs array based on role permissions
  const tabs = [
    { id: 'all-reports', label: 'All Reports', count: allReports.filter(r => r.status === 'open').length },
    { id: 'reports', label: 'Reports', count: reports.length },
    { id: 'feedback', label: 'Feedback', count: feedback.length },
    ...(canCreate ? [{ id: 'create', label: 'Create' }] : []),
    { id: 'archive', label: 'Archive', count: allReports.filter(r => r.status === 'closed').length }
  ];

  return (
    <TabSection
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      description={
        activeTab === 'create' ? 'Submit new reports or feedback to your ecosystem' :
        activeTab === 'reports' ? 'Issues and problems reported by your ecosystem' :
        activeTab === 'feedback' ? 'Suggestions and compliments from your ecosystem' :
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
      {activeTab === 'create' && canCreate && renderSubmitForm()}
      {activeTab !== 'create' && renderReportsList()}
    </TabSection>
  );
};

export default ReportsSection;
