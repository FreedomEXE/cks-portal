import React from 'react';
import styles from './ReportQuickActions.module.css';

export interface ReportAcknowledgment {
  userId: string;
  acknowledgedAt: string;
}

export interface ReportResolution {
  notes?: string;
  actionTaken?: string;
}

export interface ReportAction {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export interface ReportQuickActionsProps {
  type: 'report' | 'feedback';
  status: 'open' | 'resolved' | 'closed';
  acknowledgments?: ReportAcknowledgment[];
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: ReportResolution;
  resolution_notes?: string;
  currentUser?: string;
  actions?: ReportAction[];
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

const ReportQuickActions: React.FC<ReportQuickActionsProps> = ({
  type,
  status,
  acknowledgments = [],
  resolvedBy,
  resolvedAt,
  resolution,
  resolution_notes,
  currentUser,
  actions = [],
}) => {
  const isReport = type === 'report';

  return (
    <div className={styles.container}>
      {/* Action Buttons Section */}
      {actions.length > 0 && (
        <div className={styles.actionsSection}>
          <h3 className={styles.sectionTitle}>Actions</h3>
          <div className={styles.actionsGrid}>
            {actions.map((action, index) => {
              const buttonClass = `${styles.actionButton} ${
                action.variant === 'danger' ? styles.actionDanger :
                action.variant === 'primary' ? styles.actionPrimary :
                styles.actionSecondary
              }`;

              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={buttonClass}
                >
                  {action.loading ? 'Loading...' : action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lifecycle Section - Yellow Box */}
      <div className={styles.lifecycleSection}>
        <h3 className={styles.sectionTitle}>
          {isReport ? 'Report' : 'Feedback'} Lifecycle
        </h3>

        {/* Current Status */}
        <div className={styles.statusContainer}>
          <p className={styles.label}>Current Status</p>
          <div className={styles.statusRow}>
            <span
              className={styles.statusBadge}
              style={{
                backgroundColor: status === 'open' ? '#fee2e2' : status === 'resolved' ? '#d1fae5' : '#e5e7eb',
                color: status === 'open' ? '#991b1b' : status === 'resolved' ? '#065f46' : '#374151',
              }}
            >
              {status.toUpperCase()}
            </span>
            <span className={styles.statusDescription}>
              {status === 'open' && (isReport ? 'Awaiting acknowledgment and resolution' : 'Awaiting acknowledgment')}
              {status === 'resolved' && (isReport ? 'Resolved and awaiting closure' : 'Awaiting closure')}
              {status === 'closed' && `${isReport ? 'Report' : 'Feedback'} closed`}
            </span>
          </div>
        </div>

        {/* Acknowledgments */}
        <div className={styles.acknowledgementsContainer}>
          <p className={styles.label}>
            Acknowledgments {acknowledgments.length > 0 && `(${acknowledgments.length})`}
          </p>
          {acknowledgments.length > 0 ? (
            <div className={styles.acknowledgementsList}>
              {acknowledgments.map((ack, index) => (
                <span key={index} className={styles.acknowledgementBadge}>
                  <span className={styles.checkmark}>✓</span>
                  {getRoleName(ack.userId)} ({ack.userId})
                  {currentUser && ack.userId === currentUser && (
                    <span className={styles.youLabel}> - you</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No acknowledgments yet</p>
          )}
        </div>

        {/* Resolution Status - Only show for reports that are resolved/closed */}
        {isReport && (status === 'resolved' || status === 'closed') && (
          <div className={styles.resolutionContainer}>
            <p className={styles.label}>Resolution Status</p>
            <div className={styles.resolutionBox}>
              {resolvedBy && (
                <div className={styles.resolutionItem}>
                  <p className={styles.resolutionLabel}>Resolved By</p>
                  <p className={styles.resolutionValue}>
                    {getRoleName(resolvedBy)} ({resolvedBy})
                    {resolvedAt && ` on ${formatDate(resolvedAt)}`}
                  </p>
                </div>
              )}

              {resolution?.actionTaken && (
                <div className={styles.resolutionItem}>
                  <p className={styles.resolutionLabel}>Action Taken</p>
                  <p className={styles.resolutionText}>{resolution.actionTaken}</p>
                </div>
              )}

              {(resolution_notes || resolution?.notes) && (
                <div className={styles.resolutionItem}>
                  <p className={styles.resolutionLabel}>Resolution Notes</p>
                  <p className={styles.resolutionText}>
                    {resolution_notes || resolution?.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportQuickActions;
