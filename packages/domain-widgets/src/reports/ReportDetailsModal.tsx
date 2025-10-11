import React from 'react';
import { ModalRoot, Button } from '@cks/ui';
import type { ReportFeedback } from './ReportCard';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportFeedback | null;
  currentUser: string;
  userRole: string;
}

// Helper to get user-friendly role name from ID
const getRoleName = (userId: string): string => {
  const prefix = userId.split('-')[0]?.toUpperCase();
  const roleMap: Record<string, string> = {
    'CUS': 'Customer',
    'CEN': 'Center',
    'CON': 'Contractor',
    'CRW': 'Crew',
    'MGR': 'Manager',
    'WHS': 'Warehouse',
    'ADM': 'Administrator'
  };
  return roleMap[prefix] || 'User';
};

// Helper to format date nicely
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper to get category display name
const getCategoryDisplay = (category: string): string => {
  const map: Record<string, string> = {
    'service': 'Service',
    'order': 'Product Order',
    'procedure': 'Procedure'
  };
  return map[category] || category;
};

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  isOpen,
  onClose,
  report,
  currentUser,
  userRole
}) => {
  if (!report) return null;

  const isReport = report.type === 'report';
  const roleName = getRoleName(report.submittedBy);
  const isWarehouseManaged = (managed?: string | null): boolean => {
    if (!managed) return false;
    const val = managed.toString();
    return val.toLowerCase() === 'warehouse' || val.toUpperCase().startsWith('WHS-');
  };

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#111827',
              margin: 0
            }}>
              {isReport ? 'Report' : 'Feedback'} Details
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <p style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#6b7280',
            margin: 0
          }}>
            {report.id}
          </p>
        </div>

        {/* Status Badges */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: isReport ? '#fee2e2' : '#d1fae5',
            color: isReport ? '#991b1b' : '#065f46',
            textTransform: 'uppercase'
          }}>
            {report.type}
          </span>
          {report.priority && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: report.priority === 'HIGH' ? '#fee2e2' : report.priority === 'MEDIUM' ? '#fef3c7' : '#ecfdf5',
              color: report.priority === 'HIGH' ? '#b91c1c' : report.priority === 'MEDIUM' ? '#f59e0b' : '#059669'
            }}>
              {report.priority} PRIORITY
            </span>
          )}
          {report.rating && report.rating > 0 && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: '#fffbeb',
              color: '#92400e'
            }}>
              {'★'.repeat(report.rating)}{'☆'.repeat(5 - report.rating)}
            </span>
          )}
        </div>

        {/* Report Summary */}
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '16px'
          }}>
            {isReport ? 'Report' : 'Feedback'} Summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Type & Submitted By */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                Type
              </p>
              <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                {report.reportCategory ? getCategoryDisplay(report.reportCategory) : 'General'}
              </p>
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                Submitted By
              </p>
              <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                {roleName} ({report.submittedBy})
              </p>
            </div>

            {/* Related Entity & Managed By */}
            {report.relatedEntityId && (
              <>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                    {report.reportCategory === 'order' ? 'Order' : report.reportCategory === 'service' ? 'Service' : 'Related To'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 500, margin: 0 }}>
                    {report.relatedEntityId}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                    Managed By
                  </p>
                  <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                    {report.reportCategory === 'order' || isWarehouseManaged(report.serviceManagedBy) ? 'Warehouse' : 'Manager'}
                  </p>
                </div>
              </>
            )}

            {/* Issue/Reason & Date */}
            {report.reportReason && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                  {isReport ? 'Issue' : 'Feedback'}
                </p>
                <p style={{ fontSize: '14px', color: '#111827', fontWeight: 600, margin: 0 }}>
                  {report.reportReason}
                </p>
              </div>
            )}

            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                Date Submitted
              </p>
              <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                {formatDate(report.submittedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Description (Full Details) */}
        {report.description && (
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              Full Description
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#111827',
              lineHeight: '1.6',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
              {report.description}
            </p>
          </div>
        )}

        {/* Report Lifecycle */}
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#fefce8',
          borderRadius: '6px',
          border: '1px solid #fde047'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '16px'
          }}>
            {isReport ? 'Report' : 'Feedback'} Lifecycle
          </h3>

          {/* Status */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
              Current Status
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                backgroundColor: report.status === 'open' ? '#fee2e2' : report.status === 'resolved' ? '#d1fae5' : '#e5e7eb',
                color: report.status === 'open' ? '#991b1b' : report.status === 'resolved' ? '#065f46' : '#374151'
              }}>
                {report.status}
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {report.status === 'open' && (isReport ? 'Awaiting acknowledgment and resolution' : 'Awaiting acknowledgment')}
                {report.status === 'resolved' && (isReport ? 'Resolved and awaiting closure' : 'Awaiting closure')}
                {report.status === 'closed' && `${isReport ? 'Report' : 'Feedback'} closed`}
              </span>
            </div>
          </div>

          {/* Acknowledgments */}
          <div style={{ marginBottom: report.status === 'resolved' || report.status === 'closed' ? '16px' : '0' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
              Acknowledgments {report.acknowledgments && report.acknowledgments.length > 0 && `(${report.acknowledgments.length})`}
            </p>
            {report.acknowledgments && report.acknowledgments.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {report.acknowledgments.map((ack, index) => (
                  <span key={index} style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#1e40af',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                    {getRoleName(ack.userId)} ({ack.userId})
                    {ack.userId === currentUser && <span style={{ fontWeight: 700, color: '#6b7280' }}> - you</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                No acknowledgments yet
              </p>
            )}
          </div>

          {/* Resolution Status - Only show for reports */}
          {isReport && (report.status === 'resolved' || report.status === 'closed') && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
                Resolution Status
              </p>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                {report.resolvedBy && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 4px 0' }}>
                      Resolved By
                    </p>
                    <p style={{ fontSize: '14px', color: '#15803d', fontWeight: 600, margin: 0 }}>
                      {getRoleName(report.resolvedBy)} ({report.resolvedBy})
                      {report.resolvedAt && ` on ${formatDate(report.resolvedAt)}`}
                    </p>
                  </div>
                )}

                {report.resolution?.actionTaken && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 4px 0' }}>
                      Action Taken
                    </p>
                    <p style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6', margin: 0 }}>
                      {report.resolution.actionTaken}
                    </p>
                  </div>
                )}

                {(report.resolution_notes || report.resolution?.notes) && (
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 4px 0' }}>
                      Resolution Notes
                    </p>
                    <p style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6', margin: 0 }}>
                      {report.resolution_notes || report.resolution?.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalRoot>
  );
};

export default ReportDetailsModal;
