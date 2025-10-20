import React from 'react';
import styles from './ReportDetails.module.css';

export interface ReportDetailsProps {
  type: 'report' | 'feedback';
  reportCategory?: string;
  submittedBy: string;
  submittedDate: string;
  relatedEntityId?: string;
  serviceManagedBy?: string;
  reportReason?: string;
  description?: string;
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

// Helper to check if service is warehouse managed
const isWarehouseManaged = (managed?: string | null): boolean => {
  if (!managed) return false;
  const val = managed.toString();
  return val.toLowerCase() === 'warehouse' || val.toUpperCase().startsWith('WHS-');
};

const ReportDetails: React.FC<ReportDetailsProps> = ({
  type,
  reportCategory,
  submittedBy,
  submittedDate,
  relatedEntityId,
  serviceManagedBy,
  reportReason,
  description,
}) => {
  const isReport = type === 'report';
  const roleName = getRoleName(submittedBy);

  return (
    <div className={styles.container}>
      {/* Report Summary */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          {isReport ? 'Report' : 'Feedback'} Summary
        </h4>
        <div className={styles.detailsGrid}>
          {/* Type */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Type</span>
            <span className={styles.detailValue}>
              {reportCategory ? getCategoryDisplay(reportCategory) : 'General'}
            </span>
          </div>

          {/* Submitted By */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Submitted By</span>
            <span className={styles.detailValue}>
              {roleName} ({submittedBy})
            </span>
          </div>

          {/* Related Entity (if exists) */}
          {relatedEntityId && (
            <>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  {reportCategory === 'order' ? 'Order' : reportCategory === 'service' ? 'Service' : 'Related To'}
                </span>
                <span className={styles.detailValueLink}>
                  {relatedEntityId}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Managed By</span>
                <span className={styles.detailValue}>
                  {reportCategory === 'order' || isWarehouseManaged(serviceManagedBy) ? 'Warehouse' : 'Manager'}
                </span>
              </div>
            </>
          )}

          {/* Issue/Reason */}
          {reportReason && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                {isReport ? 'Issue' : 'Feedback'}
              </span>
              <span className={styles.detailValue} style={{ fontWeight: 600 }}>
                {reportReason}
              </span>
            </div>
          )}

          {/* Date Submitted */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Date Submitted</span>
            <span className={styles.detailValue}>
              {formatDate(submittedDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Full Description */}
      {description && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Full Description</h4>
          <p className={styles.description}>{description}</p>
        </div>
      )}
    </div>
  );
};

export default ReportDetails;
