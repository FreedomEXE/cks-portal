import React, { useState, useEffect } from 'react';
import { TabSection } from '@cks/ui';
import ReportCard, { type ReportFeedback } from './ReportCard';
import { getReasonsForCategory, type ReportCategory, CATEGORY_LABELS } from './reportReasons';

interface ReportsSectionProps {
  role: string;
  userId: string;
  primaryColor?: string;
  reports?: ReportFeedback[];
  feedback?: ReportFeedback[];
  isLoading?: boolean;
  onSubmit?: (payload: any) => Promise<void> | void;
  onAcknowledge?: (id: string, type: 'report' | 'feedback') => Promise<void> | void;
  onResolve?: (id: string, details?: { actionTaken?: string; notes?: string }) => Promise<void> | void;
  // NEW: Functions to fetch entities for dropdowns
  fetchServices?: () => Promise<any[]>;
  fetchProcedures?: () => Promise<any[]>;
  fetchOrders?: () => Promise<any[]>;
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
  fetchServices,
  fetchProcedures,
  fetchOrders,
}) => {
  const [activeTab, setActiveTab] = useState('reports');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if user can create reports/feedback at all
  const canCreate = ['contractor', 'customer', 'center', 'manager'].includes(role.toLowerCase());
  const canCreateReports = ['contractor', 'customer', 'center'].includes(role.toLowerCase());
  const defaultType = canCreateReports ? 'report' : 'feedback';

  // NEW STRUCTURED STATE: 3 dropdown selections
  const [reportForm, setReportForm] = useState({
    type: defaultType as 'report' | 'feedback',
    reportCategory: '' as ReportCategory | '',  // service | order | procedure
    relatedEntityId: '',                         // ID of selected entity
    reportReason: '',                            // Selected reason
  });

  // State for entity lists (populated by API calls)
  const [services, setServices] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  // Fetch entities when component mounts (only if functions provided)
  useEffect(() => {
    const loadEntities = async () => {
      setEntitiesLoading(true);
      try {
        if (fetchServices) {
          const serviceData = await fetchServices();
          setServices(serviceData || []);
        }
        if (fetchProcedures) {
          const procedureData = await fetchProcedures();
          setProcedures(procedureData || []);
        }
        if (fetchOrders) {
          const orderData = await fetchOrders();
          setOrders(orderData || []);
        }
      } catch (err) {
        console.error('Failed to fetch entities:', err);
      } finally {
        setEntitiesLoading(false);
      }
    };

    loadEntities();
  }, [fetchServices, fetchProcedures, fetchOrders]);

  // Get entity list based on selected category
  const getEntityList = () => {
    switch (reportForm.reportCategory) {
      case 'service':
        return services;
      case 'order':
        return orders;
      case 'procedure':
        return procedures;
      default:
        return [];
    }
  };

  // Combine reports and feedback from props
  const allReports: ReportFeedback[] = [...reports, ...feedback];

  // Filter reports based on tab and user
  const getFilteredReports = () => {
    let filtered = allReports;

    switch (activeTab) {
      case 'reports':
        filtered = reports.filter(report => report.status !== 'closed');
        break;
      case 'feedback':
        filtered = feedback.filter(report => report.status !== 'closed');
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
    // Validate all 3 dropdowns are selected
    if (!reportForm.type || !reportForm.reportCategory || !reportForm.relatedEntityId || !reportForm.reportReason) {
      alert('Please make all selections before submitting');
      return;
    }

    try {
      if (onSubmit) {
        // Send structured data to backend
        await Promise.resolve(
          onSubmit({
            type: reportForm.type,
            reportCategory: reportForm.reportCategory,
            relatedEntityId: reportForm.relatedEntityId,
            reportReason: reportForm.reportReason,
          }),
        );
      } else {
        console.log('Submitting structured report:', reportForm);
      }
    } catch (err) {
      console.error('Failed to submit', err);
      alert('Failed to submit. Please try again.');
      return;
    }

    // Reset form
    setReportForm({
      type: defaultType,
      reportCategory: '',
      relatedEntityId: '',
      reportReason: '',
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

  // NEW: Get available reasons for dropdown 3 based on type and category
  const getAvailableReasons = (): readonly string[] => {
    if (!reportForm.reportCategory) return [];
    return getReasonsForCategory(reportForm.type, reportForm.reportCategory as ReportCategory);
  };

  const renderSubmitForm = () => {
    const entityList = getEntityList();
    const availableReasons = getAvailableReasons();

    return (
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
          {/* Row 1: Type Selection */}
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
                  onChange={(e) => setReportForm({
                    type: e.target.value as 'report' | 'feedback',
                    reportCategory: '',
                    relatedEntityId: '',
                    reportReason: ''
                  })}
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
            <div></div>
          </div>

          {/* Row 2: Dropdown 1 - Report Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px'
              }}>
                {reportForm.type === 'report' ? 'Report For' : 'Feedback For'} *
              </label>
              <select
                value={reportForm.reportCategory}
                onChange={(e) => setReportForm({
                  ...reportForm,
                  reportCategory: e.target.value as ReportCategory | '',
                  relatedEntityId: '',
                  reportReason: ''
                })}
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
                <option value="service">Service</option>
                <option value="order">Order</option>
                <option value="procedure">Procedure</option>
              </select>
            </div>
            <div></div>
          </div>

          {/* Row 3: Dropdown 2 - Select Entity */}
          {reportForm.reportCategory && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Select {CATEGORY_LABELS[reportForm.reportCategory as ReportCategory]} *
                </label>
                <select
                  value={reportForm.relatedEntityId}
                  onChange={(e) => setReportForm({
                    ...reportForm,
                    relatedEntityId: e.target.value,
                    reportReason: ''
                  })}
                  disabled={entitiesLoading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: entitiesLoading ? '#f9fafb' : '#ffffff',
                    cursor: entitiesLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {entitiesLoading ? 'Loading...' : `Select ${reportForm.reportCategory}`}
                  </option>
                  {entityList.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name || entity.title || entity.id}
                    </option>
                  ))}
                </select>
              </div>
              <div></div>
            </div>
          )}

          {/* Row 4: Dropdown 3 - Select Reason */}
          {reportForm.reportCategory && reportForm.relatedEntityId && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Reason *
                </label>
                <select
                  value={reportForm.reportReason}
                  onChange={(e) => setReportForm({
                    ...reportForm,
                    reportReason: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Select reason</option>
                  {availableReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div></div>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={handleSubmitReport}
              disabled={!reportForm.reportCategory || !reportForm.relatedEntityId || !reportForm.reportReason}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: (reportForm.reportCategory && reportForm.relatedEntityId && reportForm.reportReason) ? primaryColor : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (reportForm.reportCategory && reportForm.relatedEntityId && reportForm.reportReason) ? 'pointer' : 'not-allowed'
              }}
            >
              Submit {reportForm.type === 'report' ? 'Report' : 'Feedback'}
            </button>
          </div>
        </div>
      </div>
    );
  };

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
    { id: 'reports', label: 'Reports', count: reports.filter(r => r.status !== 'closed').length },
    { id: 'feedback', label: 'Feedback', count: feedback.filter(r => r.status !== 'closed').length },
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
